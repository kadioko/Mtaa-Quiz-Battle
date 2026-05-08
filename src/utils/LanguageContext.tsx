import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../storage/storage';
import { setLanguage } from './i18n';

interface LanguageContextType {
  language: 'sw' | 'en';
  setLang: (lang: 'sw' | 'en') => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'sw',
  setLang: async () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'sw' | 'en'>('sw');

  useEffect(() => {
    StorageService.getSettings().then((s) => {
      setLanguageState(s.language);
      setLanguage(s.language);
    });
  }, []);

  const setLang = async (lang: 'sw' | 'en') => {
    setLanguageState(lang);
    setLanguage(lang);
    const current = await StorageService.getSettings();
    await StorageService.saveSettings({ ...current, language: lang });
  };

  return (
    <LanguageContext.Provider value={{ language, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
