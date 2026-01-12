// Test Plan Urtracker API Service
// 用於查詢各個 ODM 的 Test Plan 專案數據

const API_BASE_URL = '/api/urtracker';

// Test Plan 專案配置 (從 URT-projectlist.txt 提取)
export const TEST_PLAN_PROJECTS = {
  // TV 分類
  TV: {
    CHH: { id: 2861, key: 'Test_Plan_CHH', name: 'CHH (TestPlanCHH)' },
    'HKC(A)': { id: 2737, key: 'Test_Plan_HKC(A)', name: 'HKC(A)' },
    'HKC(B)': { id: 2738, key: 'Test_Plan_HKC(B)', name: 'HKC(B)' },
    KTC: { id: 2897, key: 'Test_Plan_KTC1', name: 'KTC (Test plan KTC)' },
    MSF: { id: 3062, key: 'Test_Plan_MSF', name: 'MSF' },
    SKY: { id: 3048, key: 'Test_Plan_SKY', name: 'SKY (testplanSKY)' },
    BOE: { id: 3615, key: 'Test_Plan_BOE', name: 'BOE' },
  },
  // MNT 分類
  MNT: {
    CTX: { id: 2735, key: 'Test Plan_CTX', name: 'CTX (Test Plan_CTX)' },
    Deweco: { id: 3064, key: 'Test Plan_Deweco', name: 'Deweco (Test Plan_Deweco)' },
    Hannovo: { id: 2966, key: 'Test Plan_Hannovo', name: 'Hannovo (Test Plan_HH)' },
    HengFAKJ: { id: 2740, key: 'Test Plan_HengFAKJ', name: 'HengFAKJ (Test Plan_HF)' },
    KTC_MNT: { id: 2895, key: 'Test Plan_KTC_MNT', name: 'KTC_MNT (Test Plan_KTC_MNT)' },
    LNT_AOC: { id: 2883, key: 'Test Plan_LNT_AOC', name: 'LNT_AOC (Test Plan_LNT_AOC)' },
    LNT_Philips: { id: 2879, key: 'Test Plan_LNT_Philips', name: 'LNT_Philips (Test Plan_LNT_PHP)' },
    Ostar: { id: 2741, key: 'Test Plan_Ostar', name: 'Ostar (Test Plan_Ostar)' },
    TJ: { id: 2985, key: 'Test Plan_TJ', name: 'TJ (Test Plan_TJ)' },
    MTC: { id: 3517, key: 'Test_Plan_MTC', name: 'MTC (Test Plan_MTC)' },
  },
  // PD 分類
  PD: {
    CEDAR: { id: 2824, key: 'Test Plan_CEDAR', name: 'CEDAR (Test Plan_CEDAR)' },
    FABULUX: { id: 2749, key: 'Test Plan_FABULUX', name: 'FABULUX (Test Plan_FABULUX)' },
  },
} as const;

export type TestPlanCategory = keyof typeof TEST_PLAN_PROJECTS;
export type TestPlanODM<T extends TestPlanCategory> = keyof typeof TEST_PLAN_PROJECTS[T];

export interface ODMConfig {
  id: number;
  key: string;
  name: string;
}

export interface TestPlanIssue {
  ParentID: string;
  ChildCount: number;
  'Issue Code': string;
  'Create Time': string;
  'Is Closed': string;  // TRUE/FALSE
  'Close Time': string;
  'Create User': string;
  Assignee: string;
  'Record Num': string;
  'Last Process User': string;
  'Last Process Time': string;
  State: string;
  Product: string;
  Brand: string;
  Model: string;
  Stage: string;
  '试跑类别': string;
  '试跑内容': string;
  'Stage Plan Start': string;
  'Stage Plan Exit': string;
  'Production Plan date': string;
  'Test Item': string;
  'Test Set Counts': string;
  'Test Set Resused?': string;
  'Test Plan Start': string;
  'Test Plan Finish': string;
  'Test Actual Start': string;
  'Test Actual Finish': string;
  'Report upload Address (FTP/others)': string;
  [key: string]: any;
}

export interface ODMStats {
  odm: string;
  total: number;
  inProgress: number;
  tracking: number;
  completed: number;
  models: string[];
}

export interface CategoryStats {
  category: TestPlanCategory;
  odmStats: ODMStats[];
  totalInProgress: number;
}

/**
 * 獲取專案數據（通過專案 ID）
 */
export async function fetchTestPlanData(projectId: number): Promise<TestPlanIssue[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/parse-by-id/${projectId}?state=all`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `獲取數據失敗: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(`獲取專案 ${projectId} 數據錯誤:`, error);
    throw error;
  }
}

/**
 * 計算 ODM 的統計數據
 * 根據 State 欄位判斷：
 * - 總計：全部項目
 * - 追蹤中：State !== 'Closed (0)' (不是 Closed (0) 的都是追蹤中)
 * - 已完成：State === 'Closed (0)'
 */
export function calculateODMStats(data: TestPlanIssue[], odmName: string): ODMStats {
  // 追蹤中的測試項目（State 不是 Closed (0)）
  const trackingItems = data.filter(item => item.State !== 'Closed (0)');

  // 已完成的項目（State 是 Closed (0)）
  const completedItems = data.filter(item => item.State === 'Closed (0)');

  // 提取不重複的機種列表（從追蹤中的項目）
  const models = Array.from(new Set(
    trackingItems
      .map(item => item.Model)
      .filter(Boolean)
  ));

  return {
    odm: odmName,
    total: data.length,
    inProgress: trackingItems.length,  // 使用 tracking 數量作為進行中
    tracking: trackingItems.length,
    completed: completedItems.length,
    models: models as string[],
  };
}

/**
 * 獲取指定分類的所有 ODM 統計數據
 */
export async function getCategoryStats(category: TestPlanCategory): Promise<CategoryStats> {
  const odms = TEST_PLAN_PROJECTS[category];
  const odmStats: ODMStats[] = [];

  for (const [odmName, config] of Object.entries(odms)) {
    try {
      const data = await fetchTestPlanData(config.id);
      const stats = calculateODMStats(data, odmName);
      odmStats.push(stats);
    } catch (error) {
      console.error(`獲取 ${odmName} 統計數據失敗:`, error);
      // 即使失敗也添加空數據
      odmStats.push({
        odm: odmName,
        total: 0,
        inProgress: 0,
        tracking: 0,
        completed: 0,
        models: [],
      });
    }
  }

  const totalInProgress = odmStats.reduce((sum, stat) => sum + stat.inProgress, 0);

  return {
    category,
    odmStats,
    totalInProgress,
  };
}

/**
 * 獲取所有分類的統計數據
 */
export async function getAllCategoriesStats(): Promise<CategoryStats[]> {
  const categories: TestPlanCategory[] = ['TV', 'MNT', 'PD'];
  const results: CategoryStats[] = [];

  for (const category of categories) {
    try {
      const stats = await getCategoryStats(category);
      results.push(stats);
    } catch (error) {
      console.error(`獲取 ${category} 分類統計失敗:`, error);
    }
  }

  return results;
}

/**
 * 獲取指定 ODM 正在執行的測試機種的所有測試項目
 */
export async function getODMModelTestItems(
  category: TestPlanCategory,
  odmName: string,
  modelName?: string
): Promise<TestPlanIssue[]> {
  const odmConfig = getODMConfig(category, odmName);

  if (!odmConfig) {
    throw new Error(`找不到 ODM: ${odmName} 在分類 ${category} 中`);
  }

  const data = await fetchTestPlanData(odmConfig.id);

  // 過濾追蹤中的測試項目（是否關閉 不是 TRUE）
  let filteredData = data.filter(item => item['是否關閉'] !== 'TRUE');

  // 如果指定了機種，則進一步過濾
  if (modelName) {
    filteredData = filteredData.filter(item =>
      item.Model?.toLowerCase().includes(modelName.toLowerCase())
    );
  }

  return filteredData;
}

/**
 * 獲取 ODM 配置
 */
export function getODMConfig(category: TestPlanCategory, odmName: string): ODMConfig | null {
  const odms = TEST_PLAN_PROJECTS[category];
  const odmConfig = (odms as any)[odmName];
  return odmConfig || null;
}

/**
 * 下載 Test Plan Excel 文件
 */
export async function downloadTestPlanExcel(projectId: number, projectName: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/download-by-id/${projectId}?state=all`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `下載失敗: ${response.statusText}`);
    }

    const blob = await response.blob();
    const filename = `${projectName}_${new Date().toISOString().split('T')[0]}.xls`;

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
    console.error(`下載 Test Plan Excel 文件錯誤:`, error);
    throw error;
  }
}
