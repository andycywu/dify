import React, { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useTranslation } from '../lib/mockTranslation';
import {
  triggerExcelDownload,
  fetchProjectData as fetchParsedData,
  PROJECTS_CONFIG,
  ProjectKey
} from '../services/urtrackerService';
import UrtrackerTable, { UrtrackerIssue } from '../components/Urtracker/UrtrackerTable';

interface ProjectData {
  key: string;
  name: string;
  loading: boolean;
  error: string | null;
  data: UrtrackerIssue[] | null;
  totalRows: number;
}

export default function AICDashboard() {
  const { t } = useTranslation('auth');
  const [selectedProject, setSelectedProject] = useState<string>('TV');
  const [filterState, setFilterState] = useState<string>('open');
  const [projects, setProjects] = useState<Record<string, ProjectData>>({
    TV: { key: 'TV', name: 'TV-Data', loading: false, error: null, data: null, totalRows: 0 },
    PD: { key: 'PD', name: 'PD-Data', loading: false, error: null, data: null, totalRows: 0 },
    MNT: { key: 'MNT', name: 'MNT-Data', loading: false, error: null, data: null, totalRows: 0 },
    AVA: { key: 'AVA', name: 'AVA-Data', loading: false, error: null, data: null, totalRows: 0 },
  });

  const fetchProjectData = async (projectKey: string) => {
    setProjects(prev => ({
      ...prev,
      [projectKey]: { ...prev[projectKey], loading: true, error: null }
    }));

    try {
      const result = await fetchParsedData(projectKey as ProjectKey, { state: filterState as any });

      setProjects(prev => ({
        ...prev,
        [projectKey]: {
          ...prev[projectKey],
          loading: false,
          data: result.rows as UrtrackerIssue[],
          totalRows: result.totalRows,
          error: null
        }
      }));
    } catch (error: any) {
      console.error(`獲取 ${projectKey} 數據失敗:`, error);
      setProjects(prev => ({
        ...prev,
        [projectKey]: {
          ...prev[projectKey],
          loading: false,
          error: error.message || '獲取數據失敗'
        }
      }));
    }
  };

  const handleDownloadExcel = async (projectKey: string) => {
    try {
      await triggerExcelDownload(projectKey as ProjectKey, { state: filterState as any });
    } catch (error: any) {
      alert(`下載失敗: ${error.message}`);
    }
  };

  return (
    <MainLayout title="AIC 戰情室 - Urtracker 數據查詢">
      <div className="w-full max-w-7xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 標題區 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🎯 AIC 戰情室
            </h1>
            <p className="text-gray-600">
              查詢和下載 Urtracker 專案數據 (TV/PD/MNT/AVA)
            </p>
          </div>

          {/* 篩選控制區 */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 專案選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇專案
                </label>
                <div className="flex gap-2">
                  {Object.keys(projects).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedProject(key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedProject === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* 狀態篩選 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue 狀態
                </label>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部</option>
                  <option value="open">開啟中 (Open)</option>
                  <option value="closed">已關閉 (Closed)</option>
                </select>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => fetchProjectData(selectedProject)}
                disabled={projects[selectedProject]?.loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {projects[selectedProject]?.loading ? '載入中...' : '📊 載入數據'}
              </button>
              <button
                onClick={() => handleDownloadExcel(selectedProject)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                📥 下載 Excel
              </button>
            </div>
          </div>

          {/* 數據展示區 */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {projects[selectedProject]?.name} - {filterState === 'all' ? '全部' : filterState === 'open' ? '開啟中' : '已關閉'}
            </h2>

            {/* 錯誤訊息 */}
            {projects[selectedProject]?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="font-semibold">❌ 錯誤</p>
                <p>{projects[selectedProject]?.error}</p>
              </div>
            )}

            {/* 載入狀態 */}
            {projects[selectedProject]?.loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">載入中...</span>
              </div>
            )}

            {/* 提示訊息 */}
            {!projects[selectedProject]?.loading && !projects[selectedProject]?.data && !projects[selectedProject]?.error && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">💡 使用說明</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>點擊「📊 載入數據」按鈕來查看專案數據表格</li>
                  <li>點擊「📥 下載 Excel」按鈕來下載原始 Excel 文件</li>
                  <li>表格支持搜索、排序和分頁功能</li>
                </ul>
              </div>
            )}

            {/* 數據表格 */}
            {projects[selectedProject]?.data && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    📊 共 {projects[selectedProject].totalRows} 筆數據
                  </h3>
                  <div className="text-sm text-gray-600">
                    最後更新: {new Date().toLocaleString('zh-TW')}
                  </div>
                </div>
                <UrtrackerTable
                  data={projects[selectedProject].data}
                  loading={projects[selectedProject].loading}
                />
              </div>
            )}
          </div>

          {/* 顯示的欄位說明 */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              📋 當前顯示欄位
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Issue Code</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">State</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Priority</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Brand</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Model Name</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Assignee</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Create Time</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Due Date</span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Description</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              * 如需顯示其他欄位（如 Region, Vendor, Classification 等），請告知
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
