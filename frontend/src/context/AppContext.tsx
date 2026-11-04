import React, { createContext, useContext, useState, useEffect } from 'react';
import { Farmer, Field, HomeData, Language } from '../types';
import { translations } from '../i18n/translations';
import { api } from '../services/api';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  demoMode: boolean;
  setDemoMode: (mode: boolean) => void;
  farmer: Farmer | null;
  setFarmer: (farmer: Farmer | null) => void;
  fields: Field[];
  setFields: (fields: Field[]) => void;
  selectedField: Field | null;
  setSelectedField: (field: Field | null) => void;
  homeData: HomeData | null;
  loading: boolean;
  refreshHome: () => Promise<void>;
  unreadAlertsCount: number;
  openOnboarding: boolean;
  setOpenOnboarding: (open: boolean) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('pestpulse_lang') as Language) || 'en';
  });
  const [demoMode, setDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('pestpulse_demo') === 'true';
  });
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openOnboarding, setOpenOnboarding] = useState<boolean>(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pestpulse_lang', lang);
    if (farmer) {
      api.updateMe({ language: lang }).catch(() => {});
    }
  };

  const handleSetDemoMode = (mode: boolean) => {
    setDemoMode(mode);
    localStorage.setItem('pestpulse_demo', String(mode));
  };

  const t = (key: keyof typeof translations['en']): string => {
    const langDict = translations[language] || translations.en;
    return (langDict as any)[key] || translations.en[key] || String(key);
  };

  const refreshHome = async () => {
    try {
      setLoading(true);
      const data = await api.getHome(selectedField?.field_id);
      setHomeData(data);
      if (data.farmer) {
        setFarmer(data.farmer);
        if (data.farmer.language && data.farmer.language !== language) {
          setLanguageState(data.farmer.language);
          localStorage.setItem('pestpulse_lang', data.farmer.language);
        }
      }
      if (data.fields && data.fields.length > 0) {
        setFields(data.fields);
        if (!selectedField) {
          setSelectedField(data.selected_field || data.fields[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHome();
  }, [selectedField?.field_id]);

  const logout = () => {
    localStorage.removeItem('pestpulse_token');
    setFarmer(null);
    setOpenOnboarding(true);
  };

  const unreadAlertsCount = homeData?.unread_alerts || 0;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        demoMode,
        setDemoMode: handleSetDemoMode,
        farmer,
        setFarmer,
        fields,
        setFields,
        selectedField,
        setSelectedField,
        homeData,
        loading,
        refreshHome,
        unreadAlertsCount,
        openOnboarding,
        setOpenOnboarding,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
