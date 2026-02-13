import { BehaviorSubject } from 'rxjs';
import { supabase } from '../../lib/supabase';
import type { AppDatabase } from '../types';

// ============================================================
// Типы
// ============================================================

export interface SyncStatus {
  state: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  lastSyncAt: string | null;
  error?: string;
}

interface CollectionSyncConfig {
  /** Имя коллекции в RxDB */
  rxdbName: keyof AppDatabase['collections'];
  /** Имя таблицы в Supabase */
  supabaseTable: string;
  /** Есть ли поле is_deleted */
  hasIsDeleted: boolean;
}

// ============================================================
// Конфигурация: маппинг коллекций на таблицы
// ============================================================

const SYNC_CONFIGS: CollectionSyncConfig[] = [
  { rxdbName: 'semester',  supabaseTable: 'semester_config',    hasIsDeleted: false },
  { rxdbName: 'subjects',  supabaseTable: 'subjects',           hasIsDeleted: true },
  { rxdbName: 'teachers',  supabaseTable: 'teachers',           hasIsDeleted: true },
  { rxdbName: 'students',  supabaseTable: 'students',           hasIsDeleted: true },
  { rxdbName: 'schedule',  supabaseTable: 'schedule_entries',   hasIsDeleted: true },
  { rxdbName: 'overrides', supabaseTable: 'schedule_overrides', hasIsDeleted: true },
  { rxdbName: 'events',    supabaseTable: 'events',             hasIsDeleted: true },
];

const LAST_SYNC_KEY = 'student_hub_last_sync';

// ============================================================
// Утилиты
// ============================================================

/**
 * Supabase возвращает null для пустых полей.
 * RxDB-схемы с type: 'string' не принимают null.
 * Удаляем null-значения — RxDB обработает их как отсутствующие (optional).
 */
function stripNulls(doc: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ============================================================
// Класс SyncEngine
// ============================================================

export class SyncEngine {
  private db: AppDatabase;
  private isSyncing = false;

  public status$ = new BehaviorSubject<SyncStatus>({
    state: 'idle',
    lastSyncAt: this.getLastSyncAt(),
  });

  constructor(db: AppDatabase) {
    this.db = db;
  }

  // ----------------------------------------------------------
  // Публичный метод: запуск синхронизации
  // ----------------------------------------------------------

  async sync(): Promise<void> {
    // Защита от повторного запуска
    if (this.isSyncing) {
      console.log('[Sync] Already syncing, skipping');
      return;
    }

    // Проверка сети
    if (!navigator.onLine) {
      this.status$.next({
        state: 'offline',
        lastSyncAt: this.getLastSyncAt(),
      });
      return;
    }

    this.isSyncing = true;
    this.status$.next({
      state: 'syncing',
      lastSyncAt: this.getLastSyncAt(),
    });

    try {
      const since = this.getLastSyncAt();
      const syncTimestamp = new Date().toISOString();

      if (since) {
        console.log(`[Sync] Catch-up sync since ${since}`);
      } else {
        console.log('[Sync] Initial sync (first launch)');
      }

      await this.syncAllCollections(since);

      this.setLastSyncAt(syncTimestamp);
      this.status$.next({
        state: 'success',
        lastSyncAt: syncTimestamp,
      });
      console.log('[Sync] Completed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Sync] Failed:', message);
      this.status$.next({
        state: 'error',
        lastSyncAt: this.getLastSyncAt(),
        error: message,
      });
    } finally {
      this.isSyncing = false;
    }
  }

  // ----------------------------------------------------------
  // Синхронизация всех коллекций
  // ----------------------------------------------------------

  private async syncAllCollections(since: string | null): Promise<void> {
    const errors: string[] = [];

    for (const config of SYNC_CONFIGS) {
      try {
        await this.syncCollection(config, since);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${config.rxdbName}: ${message}`);
        console.error(`[Sync] Error syncing ${config.rxdbName}:`, message);
      }
    }

    // Если ВСЕ коллекции упали — это критическая ошибка
    if (errors.length === SYNC_CONFIGS.length) {
      throw new Error(`All collections failed to sync`);
    }

    // Если часть упала — логируем, но не падаем
    if (errors.length > 0) {
      console.warn(`[Sync] Partial sync: ${errors.length} collection(s) failed`);
    }
  }

  // ----------------------------------------------------------
  // Синхронизация одной коллекции
  // ----------------------------------------------------------

  private async syncCollection(
    config: CollectionSyncConfig,
    since: string | null,
  ): Promise<void> {
    const { rxdbName, supabaseTable, hasIsDeleted } = config;

    // Формируем запрос к Supabase
    let query = supabase.from(supabaseTable).select('*');

    if (since) {
      // Catch-up: всё, что изменилось после последней синхронизации
      query = query.gt('updated_at', since);
    } else if (hasIsDeleted) {
      // Initial: только неудалённые записи
      query = query.eq('is_deleted', false);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase query failed for ${supabaseTable}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log(`[Sync] ${rxdbName}: no changes`);
      return;
    }

    // Разделяем на обновления и удаления
    const collection = this.db[rxdbName] as any;
    const toUpsert: Record<string, any>[] = [];
    const toRemove: string[] = [];

    for (const row of data) {
      if (hasIsDeleted && row.is_deleted) {
        toRemove.push(row.id);
      } else {
        toUpsert.push(stripNulls(row));
      }
    }

    // Применяем изменения в RxDB
    if (toUpsert.length > 0) {
      await collection.bulkUpsert(toUpsert);
    }

    if (toRemove.length > 0) {
      await collection.bulkRemove(toRemove).catch(() => {
        // Игнорируем ошибки удаления — документ мог не существовать в RxDB
      });
    }

    console.log(
      `[Sync] ${rxdbName}: ${toUpsert.length} upserted, ${toRemove.length} removed`,
    );
  }

  // ----------------------------------------------------------
  // localStorage: timestamp последней синхронизации
  // ----------------------------------------------------------

  private getLastSyncAt(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  private setLastSyncAt(timestamp: string): void {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  }
}