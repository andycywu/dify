import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsProps {
  primaryColor: string;
  enableVoice: boolean;
  enableHistory: boolean;
  setEnableVoice: (enable: boolean) => void;
  setEnableHistory: (enable: boolean) => void;
  setPrimaryColor: (color: string) => void;
  onClose: () => void;
  customLogo?: string;
  setCustomLogo: (logo: string) => void;
  avatarSrc: string;
  setAvatarSrc: (src: string) => void;
  apiKey?: string;
  apiBaseUrl?: string;
  setApiKey?: (key: string) => void;
  setApiBaseUrl?: (url: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
  primaryColor,
  enableVoice,
  enableHistory,
  setEnableVoice,
  setEnableHistory,
  setPrimaryColor,
  onClose,
  customLogo,
  setCustomLogo,
  avatarSrc,
  setAvatarSrc,
  apiKey = '',
  apiBaseUrl = '',
  setApiKey = () => {},
  setApiBaseUrl = () => {},
}) => {
  const { isAuthenticated, logout } = useAuth();

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#000000', // Black
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Features Toggle */}
        <div>
          <h3 className="text-lg font-medium mb-3">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Voice Input</span>
              <div 
                className={`relative w-12 h-6 transition duration-200 ease-linear rounded-full ${
                  enableVoice ? 'bg-green-400' : 'bg-gray-300'
                }`}
                onClick={() => setEnableVoice(!enableVoice)}
              >
                <div
                  className={`absolute left-0 w-6 h-6 transition transform duration-200 ease-linear rounded-full bg-white border border-gray-200 ${
                    enableVoice ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Conversation History</span>
              <div 
                className={`relative w-12 h-6 transition duration-200 ease-linear rounded-full ${
                  enableHistory ? 'bg-green-400' : 'bg-gray-300'
                }`}
                onClick={() => setEnableHistory(!enableHistory)}
              >
                <div
                  className={`absolute left-0 w-6 h-6 transition transform duration-200 ease-linear rounded-full bg-white border border-gray-200 ${
                    enableHistory ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Color */}
        <div>
          <h3 className="text-lg font-medium mb-3">Theme Color</h3>
          <div className="grid grid-cols-4 gap-2">
            {predefinedColors.map((color) => (
              <div
                key={color}
                className={`w-10 h-10 rounded-full cursor-pointer ${
                  primaryColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setPrimaryColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Custom Logo */}
        <div>
          <h3 className="text-lg font-medium mb-2">Custom Logo</h3>
          <div className="flex items-center space-x-2">
            {customLogo && (
              <div className="w-10 h-10 bg-gray-100 rounded">
                <img
                  src={customLogo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <input
              type="text"
              placeholder="Logo URL"
              value={customLogo || ''}
              onChange={(e) => setCustomLogo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Avatar */}
        <div>
          <h3 className="text-lg font-medium mb-2">Assistant Avatar</h3>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gray-100 rounded">
              <img
                src={avatarSrc}
                alt="Avatar"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <input
              type="text"
              placeholder="Avatar URL"
              value={avatarSrc}
              onChange={(e) => setAvatarSrc(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* API Configuration */}
        <div>
          <h3 className="text-lg font-medium mb-2">API Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Dify API Key"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">API Base URL</label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="http://localhost/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Account Section */}
        {isAuthenticated && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full py-2 text-white rounded"
              style={{ backgroundColor: primaryColor }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
