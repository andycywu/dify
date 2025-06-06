import React, { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';

const LANGUAGES = [
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
];
const BG_COLORS = [
  { value: 'white', label: '白色' },
  { value: 'gray-50', label: '灰白' },
  { value: 'slate-900', label: '深色' },
  { value: 'blue-50', label: '藍白' },
];

export default function Settings() {
  const [language, setLanguage] = useState(typeof window !== 'undefined' ? localStorage.getItem('lang') || 'zh-Hant' : 'zh-Hant');
  const [bgColor, setBgColor] = useState(typeof window !== 'undefined' ? localStorage.getItem('bgColor') || 'white' : 'white');

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    if (typeof window !== 'undefined') localStorage.setItem('lang', e.target.value);
    // 若有 i18n，可加載語言切換
    if (typeof window !== 'undefined') window.location.reload();
  };
  const handleBgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBgColor(e.target.value);
    if (typeof window !== 'undefined') localStorage.setItem('bgColor', e.target.value);
    document.body.className = '';
    document.body.classList.add(`bg-${e.target.value}`);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.className = '';
      document.body.classList.add(`bg-${bgColor}`);
    }
  }, [bgColor]);

  return (
    <MainLayout title="設定">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">設定</h2>
          <div className="flex flex-col gap-4">
            <div className="bg-green-50 rounded p-4 shadow">
              <div className="font-semibold mb-1">主題背景色</div>
              <select className="border rounded px-3 py-2 mt-2" value={bgColor} onChange={handleBgChange}>
                {BG_COLORS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="bg-green-50 rounded p-4 shadow">
              <div className="font-semibold mb-1">語言</div>
              <select className="border rounded px-3 py-2 mt-2" value={language} onChange={handleLangChange}>
                {LANGUAGES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
