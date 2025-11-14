import { useRouter } from 'next/router';

// Safe translation hook that won't break SSR
export const useTranslationSafe = (namespace: string = 'auth') => {
  const router = useRouter();
  const locale = router.locale || 'en';

  // Static translations for SSR compatibility
  const translations: Record<string, Record<string, string>> = {
    en: {
      // Auth translations
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
      'home.title': 'Dify Portal',
      'home.welcome': 'Welcome to Dify Portal',
      'home.description': 'Your centralized dashboard for AI applications.',
      'home.login_prompt': 'Please log in to access your dashboard.',
    },
    zh: {
      // Auth translations
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
      'home.title': 'Dify 入口網站',
      'home.welcome': '歡迎使用 Dify 入口網站',
      'home.description': '您的 AI 應用程式集中式儀表板。',
      'home.login_prompt': '請登入以存取您的儀表板。',
    }
  };

  const t = (key: string, options?: { defaultValue?: string }): string => {
    const translation = translations[locale]?.[key] || translations['en']?.[key];
    return translation || options?.defaultValue || key;
  };

  return { t };
};