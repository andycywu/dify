import React from 'react';
import { ODMStats } from '../../services/testPlanService';

interface ODMStatsCardProps {
  stats: ODMStats;
  onODMClick: (odmName: string) => void;
}

export default function ODMStatsCard({ stats, onODMClick }: ODMStatsCardProps) {
  const progressPercent = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div
      className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer hover:border-blue-400"
      onClick={() => onODMClick(stats.odm)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">{stats.odm}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          stats.inProgress > 50
            ? 'bg-red-100 text-red-700'
            : stats.inProgress > 20
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-green-100 text-green-700'
        }`}>
          進行中: {stats.inProgress}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">總計</span>
          <span className="font-semibold text-gray-900">{stats.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tracking</span>
          <span className="font-semibold text-blue-600">{stats.tracking}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">已完成</span>
          <span className="font-semibold text-green-600">{stats.completed}</span>
        </div>
      </div>

      {/* 進度條 */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>完成度</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 機種數量 */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-600">
          🎯 進行中機種: <span className="font-semibold text-gray-900">{stats.models.length}</span>
        </span>
      </div>
    </div>
  );
}
