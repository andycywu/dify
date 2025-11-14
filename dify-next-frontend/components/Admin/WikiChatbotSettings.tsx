import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface DepartmentSetting {
  id: number;
  department: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

const DEPARTMENTS = [
  { id: 'administrators', name: '管理員' },
  { id: 'Guests', name: '訪客' },
  { id: 'EE', name: '電機工程' },
  { id: 'ME_LCM', name: '機械工程' },
  { id: 'PWR', name: '電源' },
  { id: 'SW', name: '軟體' },
  { id: 'PJM', name: '專案管理' },
];

export default function WikiChatbotSettings() {
  const { t } = useTranslation('admin');
  const [settings, setSettings] = useState<DepartmentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = React.useCallback(async () => {
    try {
      const response = await fetch('/api/chatbot-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      } else {
        showMessage('error', '無法載入設定');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', '載入設定時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (department: string) => {
    const apiKey = apiKeyInput[department];
    
    if (!apiKey || apiKey.trim() === '') {
      showMessage('error', 'API 密鑰不能為空');
      return;
    }

    setSaving(department);
    try {
      const response = await fetch('/api/chatbot-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department, apiKey: apiKey.trim() }),
      });

      if (response.ok) {
        showMessage('success', `${department} 的 API 密鑰已成功保存`);
        setEditingDept(null);
        setApiKeyInput({ ...apiKeyInput, [department]: '' });
        loadSettings();
      } else {
        const data = await response.json();
        showMessage('error', data.error || '保存失敗');
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      showMessage('error', '保存時發生錯誤');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (department: string) => {
    if (!confirm(`確定要刪除 ${department} 的 API 密鑰嗎？`)) {
      return;
    }

    setSaving(department);
    try {
      const response = await fetch(`/api/chatbot-settings?department=${department}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', `${department} 的 API 密鑰已刪除`);
        loadSettings();
      } else {
        const data = await response.json();
        showMessage('error', data.error || '刪除失敗');
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      showMessage('error', '刪除時發生錯誤');
    } finally {
      setSaving(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getDepartmentSetting = (deptId: string) => {
    return settings.find(s => s.department === deptId);
  };

  const toggleShowApiKey = (deptId: string) => {
    setShowApiKey({ ...showApiKey, [deptId]: !showApiKey[deptId] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📌 Wiki.js Chatbot Settings</h3>
        <p className="text-sm text-blue-700">
          在此管理各部門的 Dify API 密鑰。這些密鑰將用於 Wiki.js 聊天機器人與對應部門知識庫的整合。
        </p>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {DEPARTMENTS.map(dept => {
          const setting = getDepartmentSetting(dept.id);
          const isEditing = editingDept === dept.id;
          const isSaving = saving === dept.id;

          return (
            <div key={dept.id} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{dept.name}</h4>
                  <p className="text-sm text-gray-500">部門代碼: {dept.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {setting && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      ✓ 已配置
                    </span>
                  )}
                </div>
              </div>

              {setting && !isEditing && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700">API 密鑰</label>
                      <div className="mt-1 font-mono text-sm text-gray-600">
                        {showApiKey[dept.id] ? setting.apiKey : setting.apiKey}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleShowApiKey(dept.id)}
                      className="ml-4 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      {showApiKey[dept.id] ? '隱藏' : '顯示'}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    最後更新: {new Date(setting.updatedAt).toLocaleString('zh-TW')}
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API 密鑰
                  </label>
                  <input
                    type="text"
                    value={apiKeyInput[dept.id] || ''}
                    onChange={(e) => setApiKeyInput({ ...apiKeyInput, [dept.id]: e.target.value })}
                    placeholder="輸入 Dify API 密鑰 (app-...)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    disabled={isSaving}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    請輸入完整的 API 密鑰，格式通常為 app-xxxxxxxx
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingDept(dept.id);
                        setApiKeyInput({ ...apiKeyInput, [dept.id]: '' });
                      }}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {setting ? '更新密鑰' : '設定密鑰'}
                    </button>
                    {setting && (
                      <button
                        onClick={() => handleDelete(dept.id)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                      >
                        刪除
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSave(dept.id)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingDept(null);
                        setApiKeyInput({ ...apiKeyInput, [dept.id]: '' });
                      }}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:bg-gray-200"
                    >
                      取消
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 重要提示</h4>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>API 密鑰保存後將加密儲存在資料庫中</li>
          <li>請確保輸入的是有效的 Dify API 密鑰</li>
          <li>刪除密鑰後，該部門的聊天機器人將無法使用</li>
          <li>建議定期更新 API 密鑰以提高安全性</li>
        </ul>
      </div>
    </div>
  );
}
