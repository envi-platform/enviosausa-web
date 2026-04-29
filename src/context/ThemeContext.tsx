import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  mode: ThemeMode;
  fontSize: FontSize;
  highContrast: boolean;
  setMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (val: boolean) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => 
    (localStorage.getItem('envi_mode') as ThemeMode) || 'light'
  );
  const [fontSize, setFontSize] = useState<FontSize>(() => 
    (localStorage.getItem('envi_font_size') as FontSize) || 'medium'
  );
  const [highContrast, setHighContrast] = useState<boolean>(() => 
    localStorage.getItem('envi_high_contrast') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('envi_mode', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('envi_font_size', fontSize);
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('envi_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{
      mode, fontSize, highContrast,
      setMode, setFontSize, setHighContrast, toggleMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
