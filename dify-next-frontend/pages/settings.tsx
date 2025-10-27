import React, { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation('auth');
  const [bgColor, setBgColor] = useState(typeof window !== 'undefined' ? localStorage.getItem('bgColor') || 'white' : 'white');

  const BG_COLORS = [
    { value: 'white', label: t('settings_page.colors.white') },
    { value: 'gray-50', label: t('settings_page.colors.gray') },
    { value: 'slate-900', label: t('settings_page.colors.dark') },
    { value: 'blue-50', label: t('settings_page.colors.blue') },
  ];

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
    <MainLayout title={t('settings_page.title') || 'Settings'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">{t('settings_page.title')}</h2>
          <div className="flex flex-col gap-4">
            <div className="bg-green-50 rounded p-4 shadow">
              <div className="font-semibold mb-1">{t('settings_page.theme_background')}</div>
              <select className="border rounded px-3 py-2 mt-2" value={bgColor} onChange={handleBgChange}>
                {BG_COLORS.map((opt: { value: string; label: string }) => (
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
