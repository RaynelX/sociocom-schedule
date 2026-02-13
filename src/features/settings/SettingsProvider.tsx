import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
  } from 'react';
  import { SettingsSetup } from './SettingsSetup';
  
  // ============================================================
  // Типы
  // ============================================================
  
  export interface StudentSettings {
    subgroup: 'a' | 'b';
    language: 'en' | 'de';
  }
  
  interface SettingsContextValue {
    settings: StudentSettings;
    updateSettings: (settings: StudentSettings) => void;
    resetSettings: () => void;
  }
  
  // ============================================================
  // Константы
  // ============================================================
  
  const STORAGE_KEY = 'student_hub_settings';
  const SettingsContext = createContext<SettingsContextValue | null>(null);
  
  // ============================================================
  // Утилиты
  // ============================================================
  
  function loadSettings(): StudentSettings | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
  
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'subgroup' in parsed &&
        'language' in parsed &&
        (parsed.subgroup === 'a' || parsed.subgroup === 'b') &&
        (parsed.language === 'en' || parsed.language === 'de')
      ) {
        return parsed as StudentSettings;
      }
      return null;
    } catch {
      return null;
    }
  }
  
  function saveSettings(settings: StudentSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
  
  // ============================================================
  // Провайдер
  // ============================================================
  
  export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<StudentSettings | null>(loadSettings);
  
    const updateSettings = useCallback((newSettings: StudentSettings) => {
      saveSettings(newSettings);
      setSettings(newSettings);
    }, []);
  
    const resetSettings = useCallback(() => {
      localStorage.removeItem(STORAGE_KEY);
      setSettings(null);
    }, []);
  
    if (!settings) {
      return <SettingsSetup onComplete={updateSettings} />;
    }
  
    return (
      <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
        {children}
      </SettingsContext.Provider>
    );
  }
  
  // ============================================================
  // Хук
  // ============================================================
  
  export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) {
      throw new Error('useSettings() must be used within <SettingsProvider>');
    }
    return ctx;
  }