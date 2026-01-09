// Urtracker API Service
// 用於調用 rest-to-soap-proxy 服務的 Urtracker API

// 使用 Next.js API 路由作為代理，避免 CORS 問題
const API_BASE_URL = '/api/urtracker';

export interface UrtrackerProject {
  key: string;
  id: number;
  name: string;
}

export interface DownloadOptions {
  state?: 'open' | 'closed' | 'all';
}

export interface ParsedExcelData {
  columns: string[];
  rows: any[];
  totalRows: number;
}

/**
 * 獲取可用的專案列表
 */
export async function getProjects(): Promise<UrtrackerProject[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`);

    if (!response.ok) {
      throw new Error(`獲取專案列表失敗: ${response.statusText}`);
    }

    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error('獲取專案列表錯誤:', error);
    throw error;
  }
}

/**
 * 檢查登入狀態
 */
export async function checkLoginStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.loggedIn || false;
  } catch (error) {
    console.error('檢查登入狀態錯誤:', error);
    return false;
  }
}

/**
 * 下載專案數據 (Excel 文件)
 * @param projectKey 專案代號 (TV, PD, MNT, AVA)
 * @param options 下載選項
 */
export async function downloadProjectExcel(
  projectKey: string,
  options: DownloadOptions = {}
): Promise<Blob> {
  const { state = 'all' } = options;

  try {
    const response = await fetch(
      `${API_BASE_URL}/download/${projectKey}?state=${state}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `下載失敗: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error(`下載 ${projectKey} 專案數據錯誤:`, error);
    throw error;
  }
}

/**
 * 下載專案數據並解析為 JSON
 * @param projectKey 專案代號 (TV, PD, MNT, AVA)
 * @param options 下載選項
 */
export async function fetchProjectData(
  projectKey: string,
  options: DownloadOptions = {}
): Promise<ParsedExcelData> {
  const { state = 'all' } = options;

  try {
    const response = await fetch(
      `${API_BASE_URL}/parse/${projectKey}?state=${state}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `解析失敗: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      columns: result.columns || [],
      rows: result.data || [],
      totalRows: result.totalRows || 0
    };
  } catch (error) {
    console.error(`獲取 ${projectKey} 專案數據錯誤:`, error);
    throw error;
  }
}

/**
 * 觸發瀏覽器下載 Excel 文件
 * @param projectKey 專案代號
 * @param options 下載選項
 */
export async function triggerExcelDownload(
  projectKey: string,
  options: DownloadOptions = {}
): Promise<void> {
  try {
    const blob = await downloadProjectExcel(projectKey, options);
    const { state = 'all' } = options;
    const filename = `${projectKey}_${state}_${new Date().toISOString().split('T')[0]}.xls`;

    // 創建下載鏈接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error(`下載 ${projectKey} Excel 文件錯誤:`, error);
    throw error;
  }
}

/**
 * 獲取專案的統計資訊
 * 注意: 這需要先下載並解析數據，或者後端提供統計 API
 */
export async function getProjectStats(projectKey: string) {
  try {
    const data = await fetchProjectData(projectKey);

    return {
      totalIssues: data.totalRows,
      openIssues: 0, // 需要從數據中計算
      closedIssues: 0, // 需要從數據中計算
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error(`獲取 ${projectKey} 統計資訊錯誤:`, error);
    throw error;
  }
}

// 預設導出所有專案的配置
export const PROJECTS_CONFIG = {
  TV: { key: 'TV', id: 2558, name: 'TV-Data', color: 'blue' },
  PD: { key: 'PD', id: 2559, name: 'PD-Data', color: 'green' },
  MNT: { key: 'MNT', id: 2561, name: 'MNT-Data', color: 'yellow' },
  AVA: { key: 'AVA', id: 2337, name: 'AVA-Data', color: 'purple' },
} as const;

export type ProjectKey = keyof typeof PROJECTS_CONFIG;
