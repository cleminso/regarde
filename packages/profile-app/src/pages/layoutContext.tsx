import { createContext, useContext, ReactNode, useState } from 'react';

interface LayoutContextType {
  showHeader: boolean;
  setShowHeader: (show: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [showHeader, setShowHeader] = useState(true);

  return (
    <LayoutContext.Provider value={{ showHeader, setShowHeader }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
