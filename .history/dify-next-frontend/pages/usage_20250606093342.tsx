import React from 'react';
import MainLayout from '../components/Layout/MainLayout';
import UsageCostTable from '../components/Usage/UsageCostTable';

export default function Usage() {
  return (
    <MainLayout title="用量 / 報表">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">用量 / 報表</h2>
          <UsageCostTable />
        </div>
      </div>
    </MainLayout>
  );
}
