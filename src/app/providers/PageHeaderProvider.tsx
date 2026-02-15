import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
  } from 'react';
  
  interface PageHeader {
    title: string;
    subtitle?: string;
  }
  
  interface PageHeaderContextValue {
    header: PageHeader;
    setHeader: (header: PageHeader) => void;
  }
  
  const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);
  
  export function PageHeaderProvider({ children }: { children: ReactNode }) {
    const [header, setHeaderState] = useState<PageHeader>({ title: '' });
  
    const setHeader = useCallback((h: PageHeader) => {
      setHeaderState(h);
    }, []);
  
    return (
      <PageHeaderContext.Provider value={{ header, setHeader }}>
        {children}
      </PageHeaderContext.Provider>
    );
  }
  
  export function usePageHeader(): PageHeader {
    const ctx = useContext(PageHeaderContext);
    if (!ctx) throw new Error('usePageHeader() must be used within <PageHeaderProvider>');
    return ctx.header;
  }
  
  export function useSetPageHeader(header: PageHeader): void {
    const ctx = useContext(PageHeaderContext);
    if (!ctx) throw new Error('useSetPageHeader() must be used within <PageHeaderProvider>');
  
    useEffect(() => {
      ctx.setHeader(header);
    }, [header.title, header.subtitle]);
  }