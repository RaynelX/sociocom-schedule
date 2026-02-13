import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { schemas } from './schemas';
import type { AppDatabase } from './types';
import type { RxStorage } from 'rxdb';

let dbPromise: Promise<AppDatabase> | null = null;

export function getDatabase(): Promise<AppDatabase> {
  if (!dbPromise) {
    dbPromise = createDatabase();
  }
  return dbPromise;
}

async function createDatabase(): Promise<AppDatabase> {
  let storage: RxStorage<any, any> = getRxStorageDexie();

  if (import.meta.env.DEV) {
    const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
    addRxPlugin(RxDBDevModePlugin);

    const { wrappedValidateAjvStorage } = await import('rxdb/plugins/validate-ajv');
    storage = wrappedValidateAjvStorage({ storage });
  }

  const db = await createRxDatabase<AppDatabase>({
    name: 'studenthub',
    storage,
  });

  await db.addCollections({
    subjects: { schema: schemas.subjects },
    teachers: { schema: schemas.teachers },
    schedule: { schema: schemas.schedule },
    overrides: { schema: schemas.overrides },
    events: { schema: schemas.events },
    students: { schema: schemas.students },
    semester: { schema: schemas.semester },
  });

  console.log('[DB] Database initialized with collections:', Object.keys(db.collections));

  return db;
}