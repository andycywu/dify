// Mock translation implementation to avoid SSR issues
// This replaces react-i18next with a simple, static translation system

import { useEffect, useMemo, useState } from 'react';

type TranslationFunction = (key: string, options?: { defaultValue?: string }) => string;

interface UseTranslationReturn {
  t: TranslationFunction;
}

// Static translation maps
const translations: Record<string, Record<string, string>> = {
  en: {
    // Loading and common
    'loading': 'Loading...',
    'profile_page.please_login': 'Please log in to view this page',
    'usage_page.loading_stats': 'Loading usage statistics...',
    'usage_page.error_loading': 'Error loading data',
    'usage_page.dify_usage_stats': 'Dify Usage Statistics',
    'usage_page.total_messages': 'Total Messages',
    'usage_page.total_tokens': 'Total Tokens',
    'usage_page.total_cost': 'Total Cost',
    'usage_page.active_users': 'Active Users',
    'usage_page.table_date': 'Date',
    'usage_page.table_source': 'Source',
    'usage_page.table_messages': 'Messages',
    'usage_page.table_tokens': 'Tokens',
    'usage_page.table_cost': 'Cost',
    'usage_page.table_user_id': 'User ID',
    'usage_page.data_source_note': 'Data source: Wiki.js API and Dify system',
    'usage_page.cost_calculation_note': 'Cost calculation based on token usage and current pricing model',
    'usage_page.title': 'Usage Reports',
    'usage_page.today_api_usage': 'Today\'s API Usage',
    'usage_page.monthly_api_usage': 'This Month\'s API Usage',
    // Dashboard
    'dashboard': 'Dashboard',
    'dashboard_cards.profile.title': 'Profile',
    'dashboard_cards.profile.description': 'Manage your profile and preferences',
    'dashboard_cards.profile.go': 'Go to Profile',
    'dashboard_cards.settings.title': 'Settings',
    'dashboard_cards.settings.description': 'Configure your account settings',
    'dashboard_cards.settings.go': 'Go to Settings',
    'dashboard_cards.chatbot.title': 'Chatbot',
    'dashboard_cards.chatbot.description': 'Test the agentic chatbot interface',
    'dashboard_cards.chatbot.go': 'Test Chatbot',
    'dashboard_cards.reports.title': 'Reports',
    'dashboard_cards.reports.description': 'View usage statistics and reports',
    'dashboard_cards.reports.go': 'View Reports',
    // Home
    'home.title': 'TPV OBM Test Assistant',
    'home.welcome': 'Welcome to TPV OBM Test Assistant',
    'home.description': 'Your solution for managing test agentic and user authentication.',
    'home.login_prompt': 'Please log in to access the system.',
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.submit': 'Submit',
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    // Header
    'app_title': 'TPV OBM Test Assistant',
    'chat_to_agentic': 'AI Test Assistant',
    'user_admin': 'Admin Panel',
    'knowledge_management': 'Knowledge Management',
    'usage': 'Usage',
    'login': 'Login',
    'logout': 'Logout',
    'OBM I&D KB': 'OBM I&D Knowledge Base',
    'Wiki Sync': 'Wiki Synchronization'
  },
  zh: {
    // Loading and common
    'loading': '載入中...',
    'profile_page.please_login': '請登入以查看此頁面',
    'usage_page.loading_stats': '載入使用統計中...',
    'usage_page.error_loading': '載入資料時發生錯誤',
    'usage_page.dify_usage_stats': 'Dify 使用統計',
    'usage_page.total_messages': '總訊息數',
    'usage_page.total_tokens': '總 Token 數',
    'usage_page.total_cost': '總成本',
    'usage_page.active_users': '活躍用戶',
    'usage_page.table_date': '日期',
    'usage_page.table_source': '來源',
    'usage_page.table_messages': '訊息',
    'usage_page.table_tokens': 'Tokens',
    'usage_page.table_cost': '成本',
    'usage_page.table_user_id': '用戶 ID',
    'usage_page.data_source_note': '資料來源：Wiki.js API 和 Dify 系統',
    'usage_page.cost_calculation_note': '成本計算基於 token 使用量和目前定價模型',
    'usage_page.title': '使用報告',
    'usage_page.today_api_usage': '今日 API 使用量',
    'usage_page.monthly_api_usage': '本月 API 使用量',
    // Dashboard
    'dashboard': '儀表板',
    'dashboard_cards.profile.title': '個人資料',
    'dashboard_cards.profile.description': '管理您的個人資料和偏好設定',
    'dashboard_cards.profile.go': '前往個人資料',
    'dashboard_cards.settings.title': '設定',
    'dashboard_cards.settings.description': '配置您的帳戶設定',
    'dashboard_cards.settings.go': '前往設定',
    'dashboard_cards.chatbot.title': '聊天機器人',
    'dashboard_cards.chatbot.description': '測試智能聊天機器人介面',
    'dashboard_cards.chatbot.go': '測試聊天機器人',
    'dashboard_cards.reports.title': '報告',
    'dashboard_cards.reports.description': '查看使用統計和報告',
    'dashboard_cards.reports.go': '查看報告',
    // Home
    'home.title': 'TPV OBM 測試助理',
    'home.welcome': '歡迎使用 TPV OBM 測試助理',
    'home.description': '管理測試代理和用戶驗證的解決方案。',
    'home.login_prompt': '請登入以使用系統。',
    // Auth
    'auth.login': '登入',
    'auth.logout': '登出',
    'auth.signup': '註冊',
    'auth.email': '電子郵件',
    'auth.password': '密碼',
    'auth.name': '姓名',
    'auth.submit': '提交',
    // Navigation
    'nav.home': '首頁',
    'nav.dashboard': '儀表板',
    'nav.profile': '個人資料',
    'nav.settings': '設定',
    'nav.logout': '登出',
    // Common
    'common.loading': '載入中...',
    'common.error': '錯誤',
    'common.success': '成功',
    'common.save': '儲存',
    'common.cancel': '取消',
    'common.edit': '編輯',
    'common.delete': '刪除',
    // Header
    'app_title': 'TPV OBM測試助理',
    'chat_to_agentic': 'AI 測試助理',
    'user_admin': '管理面板',
    'knowledge_management': '知識庫管理',
    'usage': '使用報告',
    'login': '登入',
    'logout': '登出',
    'OBM I&D KB': 'OBM I&D 知識庫',
    'Wiki Sync': 'Wiki 同步管理'
  }
};

const DEFAULT_LOCALE = 'en';
const LOCALE_CHANGED_EVENT = 'dify-locale-changed';

const detectClientLocale = (): string => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem('locale');
    if (stored && translations[stored]) return stored;
  } catch {
    // ignore
  }

  const browserLang = (window.navigator?.language || '').toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';

  return DEFAULT_LOCALE;
};

// Mock useTranslation hook
export const useTranslation = (namespace?: string): UseTranslationReturn => {
  // Important: Keep the first client render consistent with SSR to avoid hydration errors.
  // We only resolve the real locale after mount.
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);

  useEffect(() => {
    const applyLocale = () => setLocale(detectClientLocale());
    applyLocale();

    // `storage` won't fire in the same tab; we also listen to a custom event.
    window.addEventListener('storage', applyLocale);
    window.addEventListener(LOCALE_CHANGED_EVENT, applyLocale as EventListener);
    return () => {
      window.removeEventListener('storage', applyLocale);
      window.removeEventListener(LOCALE_CHANGED_EVENT, applyLocale as EventListener);
    };
  }, []);

  const t: TranslationFunction = useMemo(() => {
    return (key: string, options?: { defaultValue?: string }) => {
      const translation = translations[locale]?.[key] || translations[DEFAULT_LOCALE]?.[key];
      return translation || options?.defaultValue || key;
    };
  }, [locale]);

  return { t };
};

export const LOCALE_CHANGE_EVENT_NAME = LOCALE_CHANGED_EVENT;
