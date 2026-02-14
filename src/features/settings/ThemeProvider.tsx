import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
  } from 'react';
  
  type Theme = 'light' | 'dark' | 'system';
  
  interface ThemeContextValue {
    theme: Theme;
    resolved: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
  }
  
  const STORAGE_KEY = 'student_hub_theme';
  const ThemeContext = createContext<ThemeContextValue | null>(null);
  
  function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  
  function loadTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  }
  
  export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(loadTheme);
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);
  
    const resolved = theme === 'system' ? systemTheme : theme;
  
    // Слушаем изменение системной темы
    useEffect(() => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);
  
    // Применяем класс .dark на <html>
    useEffect(() => {
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    }, [resolved]);
  
    const setTheme = useCallback((t: Theme) => {
      localStorage.setItem(STORAGE_KEY, t);
      setThemeState(t);
    }, []);
  
    return (
      <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }
  
  export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme() must be used within <ThemeProvider>');
    return ctx;
  }