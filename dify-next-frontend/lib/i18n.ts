import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation resources
import authEn from '../locales/en/auth.json';
import authZh from '../locales/zh/auth.json';
import adminEn from '../locales/en/admin.json';
import adminZh from '../locales/zh/admin.json';

// Resource organization with namespaces
const resources = {
  en: {
    auth: authEn,
    admin: adminEn,
    translation: {
      // Navigation and basic UI
      "nav.dashboard": "Dashboard",
      "nav.knowledge": "Knowledge Base",
      "nav.logout": "Logout",
      "nav.login": "Login",
      "nav.signup": "Sign Up",

      // Authentication (fallback)
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.confirmPassword": "Confirm Password",
      "auth.fullName": "Full Name",
      "auth.loginButton": "Sign In",
      "auth.signupButton": "Sign Up",
      "auth.forgotPassword": "Forgot Password?",
      "auth.hasAccount": "Already have an account?",
      "auth.noAccount": "Don't have an account?",
      "auth.signupHere": "Sign up here",
      "auth.loginHere": "Login here",

      // Dashboard
      "dashboard.title": "Dashboard",
      "dashboard.welcome": "Welcome to Dify",
      "dashboard.personalSettings": "Personal Settings",
      "dashboard.usageReports": "Usage Reports",

      // Knowledge Base
      "knowledge.title": "Knowledge Base Management",
      "knowledge.upload": "Upload Documents",
      "knowledge.search": "Search Knowledge Base",

      // Common
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      "common.cancel": "Cancel",
      "common.confirm": "Confirm",
      "common.save": "Save",
      "common.edit": "Edit",
      "common.delete": "Delete",
      "common.search": "Search",
      "common.filter": "Filter",
      "common.export": "Export",
      "common.import": "Import"
    }
  },
  zh: {
    auth: authZh,
    admin: adminZh,
    translation: {
      // 導航和基本 UI
      "nav.dashboard": "儀表板",
      "nav.knowledge": "知識庫",
      "nav.logout": "登出",
      "nav.login": "登入",
      "nav.signup": "註冊",

      // 認證相關 (fallback)
      "auth.email": "電子郵件",
      "auth.password": "密碼",
      "auth.confirmPassword": "確認密碼",
      "auth.fullName": "全名",
      "auth.loginButton": "登入",
      "auth.signupButton": "註冊",
      "auth.forgotPassword": "忘記密碼？",
      "auth.hasAccount": "已有帳號？",
      "auth.noAccount": "沒有帳號？",
      "auth.signupHere": "在此註冊",
      "auth.loginHere": "在此登入",

      // 儀表板
      "dashboard.title": "儀表板",
      "dashboard.welcome": "歡迎使用 Dify",
      "dashboard.personalSettings": "個人設定",
      "dashboard.usageReports": "使用報告",

      // 知識庫
      "knowledge.title": "知識庫管理",
      "knowledge.upload": "上傳文件",
      "knowledge.search": "搜尋知識庫",

      // 通用
      "common.loading": "載入中...",
      "common.error": "錯誤",
      "common.success": "成功",
      "common.cancel": "取消",
      "common.confirm": "確認",
      "common.save": "儲存",
      "common.edit": "編輯",
      "common.delete": "刪除",
      "common.search": "搜尋",
      "common.filter": "篩選",
      "common.export": "匯出",
      "common.import": "匯入"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language set to English
    fallbackLng: 'en',
    
    // Namespace configuration
    ns: ['auth', 'admin', 'translation'],
    defaultNS: 'auth',

    interpolation: {
      escapeValue: false, // React already handles this safely
    },

    react: {
      useSuspense: false, // Avoid SSR issues
    }
  });

export default i18n;
