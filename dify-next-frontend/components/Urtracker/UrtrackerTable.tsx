import React, { useState, useMemo } from 'react';

export interface UrtrackerIssue {
  ParentID: string;
  ChildCount: number;
  'Issue Code': string;
  'Create Time': string;
  'Is Closed': string;
  'Close Time': string;
  'Create User': string;
  Assignee: string;
  'Record Num': string;
  'Last Process User': string;
  'Last Process Time': string;
  State: string;
  Brand: string;
  'Model Name': string;
  Priority: string;
  Classification: string;
  'Issue Category': string;
  Region: string;
  Vendor: string;
  Description: string;
  Impact: string;
  Action: string;
  DueDate: string;
  'Supervisor/Owner': string;
}

interface UrtrackerTableProps {
  data: UrtrackerIssue[];
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export default function UrtrackerTable({ data, loading = false }: UrtrackerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortColumn, setSortColumn] = useState<keyof UrtrackerIssue | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedIssue, setSelectedIssue] = useState<UrtrackerIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 排序和搜索邏輯
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // 搜索過濾
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // 排序
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === bVal) return 0;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // 分頁邏輯
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  // 排序處理
  const handleSort = (column: keyof UrtrackerIssue) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 排序圖標
  const getSortIcon = (column: keyof UrtrackerIssue) => {
    if (sortColumn !== column) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // 處理 Issue Code 點擊
  const handleIssueClick = (issue: UrtrackerIssue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  // 關閉對話框
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedIssue(null), 300); // 等待動畫結束後清除數據
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">載入數據中...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">暫無數據</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索和統計 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="🔍 搜索 Issue Code, Brand, Model Name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-600">
          顯示 {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} / 共 {filteredAndSortedData.length} 筆
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('Issue Code')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Issue Code {getSortIcon('Issue Code')}
              </th>
              <th
                onClick={() => handleSort('State')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                State {getSortIcon('State')}
              </th>
              <th
                onClick={() => handleSort('Priority')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Priority {getSortIcon('Priority')}
              </th>
              <th
                onClick={() => handleSort('Brand')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Brand {getSortIcon('Brand')}
              </th>
              <th
                onClick={() => handleSort('Model Name')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Model Name {getSortIcon('Model Name')}
              </th>
              <th
                onClick={() => handleSort('Assignee')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Assignee {getSortIcon('Assignee')}
              </th>
              <th
                onClick={() => handleSort('Create Time')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Create Time {getSortIcon('Create Time')}
              </th>
              <th
                onClick={() => handleSort('DueDate')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Due Date {getSortIcon('DueDate')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleIssueClick(item)}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {item['Issue Code']}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.State === 'Open' || item.State === 'New'
                      ? 'bg-green-100 text-green-800'
                      : item.State === 'Closed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.State}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.Priority === 'High' || item.Priority === 'Urgent'
                      ? 'bg-red-100 text-red-800'
                      : item.Priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.Priority}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.Brand}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item['Model Name']}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.Assignee}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {item['Create Time']}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {item.DueDate}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {item.Description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分頁控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            上一頁
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            下一頁
          </button>
        </div>
      )}

      {/* 詳細內容對話框 */}
      {isModalOpen && selectedIssue && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題欄 */}
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Issue 詳細資訊：{selectedIssue['Issue Code']}
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* 內容區 */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本資訊 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">基本資訊</h3>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Issue Code</label>
                    <p className="text-gray-900 font-semibold">{selectedIssue['Issue Code']}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">State</label>
                    <p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedIssue.State === 'Open' || selectedIssue.State === 'New'
                          ? 'bg-green-100 text-green-800'
                          : selectedIssue.State === 'Closed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedIssue.State}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedIssue.Priority === 'High' || selectedIssue.Priority === 'Urgent'
                          ? 'bg-red-100 text-red-800'
                          : selectedIssue.Priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedIssue.Priority}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Classification</label>
                    <p className="text-gray-900">{selectedIssue.Classification}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Issue Category</label>
                    <p className="text-gray-900">{selectedIssue['Issue Category']}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Is Closed</label>
                    <p className="text-gray-900">{selectedIssue['Is Closed']}</p>
                  </div>
                </div>

                {/* 產品資訊 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">產品資訊</h3>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Brand</label>
                    <p className="text-gray-900">{selectedIssue.Brand}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Model Name</label>
                    <p className="text-gray-900">{selectedIssue['Model Name']}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Region</label>
                    <p className="text-gray-900">{selectedIssue.Region}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor</label>
                    <p className="text-gray-900">{selectedIssue.Vendor}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Parent ID</label>
                    <p className="text-gray-900">{selectedIssue.ParentID}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Child Count</label>
                    <p className="text-gray-900">{selectedIssue.ChildCount}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Record Num</label>
                    <p className="text-gray-900">{selectedIssue['Record Num']}</p>
                  </div>
                </div>

                {/* 人員資訊 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">人員資訊</h3>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Create User</label>
                    <p className="text-gray-900">{selectedIssue['Create User']}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Assignee</label>
                    <p className="text-gray-900">{selectedIssue.Assignee}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Process User</label>
                    <p className="text-gray-900">{selectedIssue['Last Process User']}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Supervisor/Owner</label>
                    <p className="text-gray-900">{selectedIssue['Supervisor/Owner']}</p>
                  </div>
                </div>

                {/* 時間資訊 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">時間資訊</h3>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Create Time</label>
                    <p className="text-gray-900">{selectedIssue['Create Time']}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Close Time</label>
                    <p className="text-gray-900">{selectedIssue['Close Time'] || '尚未關閉'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Process Time</label>
                    <p className="text-gray-900">{selectedIssue['Last Process Time']}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Due Date</label>
                    <p className="text-gray-900">{selectedIssue.DueDate}</p>
                  </div>
                </div>
              </div>

              {/* 詳細描述 - 全寬 */}
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">Description</h3>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                    {selectedIssue.Description || '無描述'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">Impact</h3>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                    {selectedIssue.Impact || '無影響說明'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-3">Action</h3>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                    {selectedIssue.Action || '無處理動作'}
                  </p>
                </div>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
