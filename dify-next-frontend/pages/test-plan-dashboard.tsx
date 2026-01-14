import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useTranslation } from '../lib/mockTranslation';
import {
  TEST_PLAN_PROJECTS,
  TestPlanCategory,
  CategoryStats,
  ODMStats,
  TestPlanIssue,
  getAllCategoriesStats,
  getODMModelTestItems,
  downloadTestPlanExcel,
  getODMConfig,
} from '../services/testPlanService';
import ODMStatsCard from '../components/TestPlan/ODMStatsCard';
import TestPlanTable from '../components/TestPlan/TestPlanTable';

interface SelectedODM {
  category: TestPlanCategory;
  odmName: string;
  modelName?: string;
}

export default function TestPlanDashboard() {
  const { t } = useTranslation('auth');
  const [selectedCategory, setSelectedCategory] = useState<TestPlanCategory>('TV');
  const [categoriesStats, setCategoriesStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [selectedODM, setSelectedODM] = useState<SelectedODM | null>(null);
  const [odmTestItems, setOdmTestItems] = useState<TestPlanIssue[]>([]);
  const [loadingTestItems, setLoadingTestItems] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedCategoriesToLoad, setSelectedCategoriesToLoad] = useState<TestPlanCategory[]>([]);

  // 載入統計數據
  const loadStats = async () => {
    if (selectedCategoriesToLoad.length === 0) {
      alert('請至少選擇一個產品別來載入');
      return;
    }

    setLoading(true);
    try {
      const stats = await getAllCategoriesStats(selectedCategoriesToLoad);
      setCategoriesStats(stats);
      setStatsLoaded(true);

      // 如果當前選擇的分類沒有被載入，設置為第一個載入的分類
      if (stats.length > 0 && !stats.find(s => s.category === selectedCategory)) {
        setSelectedCategory(stats[0].category);
      }
    } catch (error: any) {
      console.error('載入統計數據失敗:', error);
      alert(`載入統計數據失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 當選擇 ODM 時載入測試項目
  const handleODMClick = async (odmName: string) => {
    setSelectedODM({
      category: selectedCategory,
      odmName,
      modelName: undefined,
    });
    setSelectedModel('');
    setLoadingTestItems(true);

    try {
      const items = await getODMModelTestItems(selectedCategory, odmName);
      setOdmTestItems(items);
    } catch (error: any) {
      console.error('載入測試項目失敗:', error);
      alert(`載入測試項目失敗: ${error.message}`);
      setOdmTestItems([]);
    } finally {
      setLoadingTestItems(false);
    }
  };

  // 當選擇機種時過濾測試項目
  const handleModelSelect = async (modelName: string) => {
    if (!selectedODM) return;

    setSelectedModel(modelName);
    setLoadingTestItems(true);

    try {
      const items = await getODMModelTestItems(
        selectedODM.category,
        selectedODM.odmName,
        modelName || undefined
      );
      setOdmTestItems(items);
    } catch (error: any) {
      console.error('載入測試項目失敗:', error);
      alert(`載入測試項目失敗: ${error.message}`);
      setOdmTestItems([]);
    } finally {
      setLoadingTestItems(false);
    }
  };

  // 返回統計視圖
  const handleBackToStats = () => {
    setSelectedODM(null);
    setOdmTestItems([]);
    setSelectedModel('');
  };

  // 下載 Excel
  const handleDownloadExcel = async (odmName: string) => {
    const odmConfig = getODMConfig(selectedCategory, odmName);

    if (!odmConfig) {
      alert('找不到 ODM 配置');
      return;
    }

    try {
      await downloadTestPlanExcel(odmConfig.id, odmConfig.key);
      alert('下載成功！');
    } catch (error: any) {
      alert(`下載失敗: ${error.message}`);
    }
  };

  // 獲取當前分類的統計數據
  const currentCategoryStats = categoriesStats.find(
    stats => stats.category === selectedCategory
  );

  // 獲取當前 ODM 的統計數據（用於顯示機種列表）
  const currentODMStats = currentCategoryStats?.odmStats.find(
    stat => stat.odm === selectedODM?.odmName
  );

  return (
    <MainLayout title="Test Plan 戰情室">
      <div className="w-full max-w-7xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 標題區 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🎯 Test Plan 戰情室
            </h1>
            <p className="text-gray-600">
              統計 TV/MNT/PD 各家 ODM 的測試項目：總計/追蹤中/已完成
            </p>
          </div>

          {!selectedODM ? (
            <>
              {/* 分類選擇和載入按鈕 */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">選擇要載入的產品別</h3>
                    <button
                      onClick={() => {
                        if (selectedCategoriesToLoad.length === 3) {
                          setSelectedCategoriesToLoad([]);
                        } else {
                          setSelectedCategoriesToLoad(['TV', 'MNT', 'PD']);
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {selectedCategoriesToLoad.length === 3 ? '取消全選' : '全選'}
                    </button>
                  </div>
                  <div className="flex gap-4">
                    {(['TV', 'MNT', 'PD'] as TestPlanCategory[]).map((category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCategoriesToLoad.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategoriesToLoad(prev => [...prev, category]);
                            } else {
                              setSelectedCategoriesToLoad(prev => prev.filter(c => c !== category));
                            }
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {(['TV', 'MNT', 'PD'] as TestPlanCategory[]).map((category) => {
                      const categoryStats = categoriesStats.find(s => s.category === category);
                      // 只顯示已載入的分類
                      if (!statsLoaded || !categoryStats) return null;
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-6 py-3 rounded-lg font-bold transition-colors relative ${
                            selectedCategory === category
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {category}
                          {categoryStats && statsLoaded && (
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              selectedCategory === category
                                ? 'bg-white text-blue-600'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {categoryStats.totalInProgress}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={loadStats}
                      disabled={loading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {loading ? '載入中...' : statsLoaded ? '🔄 重新整理' : '📊 載入統計數據'}
                    </button>

                    {statsLoaded && (
                      <button
                        onClick={() => {
                          setCategoriesStats([]);
                          setStatsLoaded(false);
                          setSelectedCategoriesToLoad([]);
                          setSelectedODM(null);
                          setOdmTestItems([]);
                          setSelectedModel('');
                        }}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
                      >
                        🗑️ 清除數據
                      </button>
                    )}
                  </div>
                </div>

                {statsLoaded && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>最後更新: {new Date().toLocaleString('zh-TW')}</p>
                  </div>
                )}
              </div>

              {/* ODM 統計卡片網格 */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">載入統計數據中...</span>
                </div>
              )}

              {!loading && !statsLoaded && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold">💡 使用說明</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>點擊「📊 載入統計數據」按鈕來查看各 ODM 的測試項目統計</li>
                    <li>點擊 ODM 卡片查看該 ODM 追蹤中的所有測試項目</li>
                    <li>可以切換 TV/MNT/PD 分類查看不同類別的統計</li>
                    <li>統計基於 Is Closed 欄位：FALSE=追蹤中，TRUE=已完成</li>
                  </ul>
                </div>
              )}

              {!loading && statsLoaded && currentCategoryStats && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedCategory} - ODM 測試進度統計
                    </h2>
                    <p className="text-gray-600 mt-1">
                      共 {currentCategoryStats.odmStats.length} 家 ODM，
                      總計追蹤中項目: <span className="font-bold text-blue-600">{currentCategoryStats.totalInProgress}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentCategoryStats.odmStats.map((stat) => (
                      <ODMStatsCard
                        key={stat.odm}
                        stats={stat}
                        onODMClick={handleODMClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ODM 詳細視圖 */}
              <div className="mb-6">
                <button
                  onClick={handleBackToStats}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors mb-4"
                >
                  ← 返回統計視圖
                </button>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedCategory} - {selectedODM.odmName}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    追蹤中的測試項目（Is Closed = FALSE）
                  </p>
                </div>

                {/* 機種選擇器 */}
                {currentODMStats && currentODMStats.models.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      篩選機種 (選填)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedModel}
                        onChange={(e) => handleModelSelect(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">全部機種 ({currentODMStats.models.length})</option>
                        {currentODMStats.models.map((model, idx) => (
                          <option key={idx} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDownloadExcel(selectedODM.odmName)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        📥 下載 Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 測試項目表格 */}
              <TestPlanTable
                data={odmTestItems}
                loading={loadingTestItems}
                title={selectedModel
                  ? `${selectedODM.odmName} - ${selectedModel}`
                  : `${selectedODM.odmName} - 所有機種`
                }
              />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
