import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DarkColors, LightColors, ThemeColors, ThemeMode } from '../theme/colors';
import { StorageService } from '../storage/storage';

interface ThemeContextType {
  colors: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DarkColors,
  themeMode: 'dark',
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    StorageService.getSettings().then((settings) => {
      setThemeModeState(settings.themeMode ?? 'dark');
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    const current = await StorageService.getSettings();
    await StorageService.saveSettings({ ...current, themeMode: mode });
  };

  const value = useMemo(
    () => ({
      colors: themeMode === 'light' ? LightColors : DarkColors,
      themeMode,
      setThemeMode,
    }),
    [themeMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useThemeColors = () => useTheme().colors;
