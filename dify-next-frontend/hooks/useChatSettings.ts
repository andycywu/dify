import { useState, useEffect } from 'react';

interface ChatSettings {
  enableVoice: boolean;
  enableHistory: boolean;
  primaryColor: string;
  customLogo: string;
  avatarSrc: string;
  apiKey: string;
  apiBaseUrl: string;
}

// 預設值直接從 .env 取得
const defaultSettings: ChatSettings = {
  enableVoice: false,
  enableHistory: true,
  primaryColor: '#3B82F6',
  customLogo: '/images/TPV-icon.png',
  avatarSrc: '/images/assistant-avatar.png',
  apiKey: process.env.NEXT_PUBLIC_DIFY_API_KEY || '',
  apiBaseUrl: process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'http://localhost/v1',
};

export const useChatSettings = () => {
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('chatSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          ...defaultSettings,
          ...parsedSettings,
          // 若 localStorage 沒有 apiKey/apiBaseUrl，則 fallback 用 .env
          apiKey: parsedSettings.apiKey || defaultSettings.apiKey,
          apiBaseUrl: parsedSettings.apiBaseUrl || defaultSettings.apiBaseUrl,
        });
      } else {
        setSettings(defaultSettings);
      }
      setLoaded(true);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(defaultSettings);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage when they change
    if (loaded) {
      localStorage.setItem('chatSettings', JSON.stringify(settings));
    }
  }, [settings, loaded]);

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  return {
    settings,
    updateSettings,
    loaded,
  };
};
