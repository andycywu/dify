import React from 'react';

export default function Profile() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">個人資料</h2>
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 rounded p-4 shadow">
            <div className="font-semibold mb-1">姓名</div>
            <div className="text-gray-700">（這裡顯示用戶姓名，未來可編輯）</div>
          </div>
          <div className="bg-blue-50 rounded p-4 shadow">
            <div className="font-semibold mb-1">Email</div>
            <div className="text-gray-700">（這裡顯示用戶 Email，未來可編輯）</div>
          </div>
          <div className="bg-blue-50 rounded p-4 shadow">
            <div className="font-semibold mb-1">密碼</div>
            <div className="text-gray-700">（這裡可加密碼修改功能）</div>
          </div>
        </div>
      </div>
    </div>
  );
}
