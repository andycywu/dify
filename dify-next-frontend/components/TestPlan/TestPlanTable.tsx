import React, { useState, useMemo } from 'react';
import { TestPlanIssue } from '../../services/testPlanService';

interface TestPlanTableProps {
  data: TestPlanIssue[];
  loading?: boolean;
  title?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function TestPlanTable({ data, loading = false, title }: TestPlanTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortColumn, setSortColumn] = useState<keyof TestPlanIssue | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
  const handleSort = (column: keyof TestPlanIssue) => {
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
  const getSortIcon = (column: keyof TestPlanIssue) => {
    if (sortColumn !== column) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
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
      {/* 標題 */}
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <div className="text-sm text-gray-600">
            共 {data.length} 筆測試項目
          </div>
        </div>
      )}

      {/* 搜索和統計 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="🔍 搜索 Issue Code, Model Name, Assignee..."
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
                onClick={() => handleSort('Model Name')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Model Name {getSortIcon('Model Name')}
              </th>
              <th
                onClick={() => handleSort('Brand')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Brand {getSortIcon('Brand')}
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                  {item['Issue Code']}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item['Is Closed'] === 'TRUE'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item['Is Closed'] === 'TRUE' ? '已完成' : '追蹤中'}
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
                    {item.Priority || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {item['Model Name']}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.Brand}
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
    </div>
  );
}
