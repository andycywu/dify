import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { retrieveChunks } from '../services/knowledgeAdmin';

interface SearchResult {
  content: string;
  score: number;
  document_name: string;
  dataset_name: string;
}

interface ChunkRecord {
  content: string;
  score: number;
  document_name: string;
  document_id: string;
  [key: string]: any;
}

// 優先欄位清單
const PRIORITY_FIELDS = [
  'Project Number', 'Model Name', 'Supplier', 'KO Date', 'MP Date',
  'EIT Plan Start Date', 'EIT Plan End Date',
  '專案編號', '機種名稱', '供應商', 'KO日期', 'MP日期', 'EIT開始日期', 'EIT結束日期',
];

// InHouse 欄位映射表
const INHOUSE_FIELD_MAPPING: { [key: string]: string } = {
  '1專案難易度': 'Project Difficulty',
  '2.專案難易度': 'Project Difficulty 2',
  '3.PIF Project Number': 'Project Number',
  '4.Site': 'Site',
  '5.TPV機種名稱13碼': 'TPV Model Name 13',
  '6.對外機種名': 'External Model Name',
  '7.Resolution': 'Resolution',
  '8.Panel size': 'Panel Size',
  '9.EE負責人': 'EE Owner',
  '10.TV功能分類': 'TV Function Category',
  '11.客戶品牌': 'Customer Brand',
  '12.地區': 'Region',
  '13.Scalar supplier': 'Scalar Supplier',
  '14.Scaler IC Type': 'Scaler IC Type',
  '15.Lcm/Module': 'LCM/Module',
  '16.面板類型': 'Panel Type',
  '17.Panel供應商': 'Panel Supplier',
  '18.Panel型號': 'Panel Model',
  '19.Cabinet (ID Code)': 'Cabinet ID Code',
  '20.Power Board/Adapter': 'Power Board/Adapter',
  '21.Finish': 'Finish',
  '22.Project Status': 'Project Status',
  '23.Cause-1': 'Cause 1',
  '24.Cause-2': 'Cause 2',
  '25.影響': 'Impact',
  '26.對策計畫': 'Countermeasure Plan',
  '27.部門': 'Department',
  '28.擔當': 'Responsible',
  '29.Deadline': 'Deadline',
  '30.ODM OBM(BG)': 'ODM OBM BG',
  '31.L=Leading or D=Derivative': 'Leading or Derivative',
  '32.Panel Source (1, 2nd or 3th)': 'Panel Source',
  '33.DM Team': 'DM Team',
  '34.HW Leader': 'HW Leader',
  '35.PjM Team': 'PjM Team',
  '36.PM (Schedule PjM)': 'PM Schedule PjM',
  '37.A Project Y Or N': 'A Project Y/N',
  '39.MQE Name': 'MQE Name',
  '40.面板比例': 'Panel Ratio',
  '41.系列': 'Series',
  '42.Product Category': 'Product Category',
  '43.規格': 'Specification',
  '44.Virtual Project Part No.(Create By Sys.)': 'Virtual Project Part No',
  '45.PLM Project Name': 'PLM Project Name',
  '46.BP': 'BP',
  '47.實際出貨數量': 'Actual Shipment Quantity',
  '48.預估人力': 'Estimated Manpower',
  '49.KO UC Ratio (Unique Parts 比率)': 'KO UC Ratio',
  '50.Panel 2nd Source Reason': 'Panel 2nd Source Reason',
  '51.KO Project Reason': 'KO Project Reason',
  '52.Create Date': 'Create Date',
  '53.Update Date': 'Update Date',
  '54.KO 日期': 'KO Date',
  '55.EIT 計畫開始日期': 'EIT Plan Start Date',
  '56.EIT 計畫完成日期': 'EIT Plan End Date',
  '57.EIT實際開始日期': 'EIT Actual Start Date',
  '58.EIT實際完成日期': 'EIT Actual End Date',
  '60.SVT 計畫開始日期': 'SVT Plan Start Date',
  '60.SVT 計畫完成日期': 'SVT Plan End Date',
  '61.SVT實際開始日期': 'SVT Actual Start Date',
  '62.SVT實際完成日期': 'SVT Actual End Date',
  '62.SVT 計畫評審會': 'SVT Plan Review',
  '63.SVT 實際評審會': 'SVT Actual Review',
  '64.MP Plan BOM Release': 'MP Plan BOM Release',
  '65.MP Actual BOM Release': 'MP Actual BOM Release',
  '66.MP Planning Date': 'MP Planning Date',
  '67.MP Actual Date': 'MP Actual Date',
  '68.VTM Planning Date': 'VTM Planning Date',
  '69.VTM Actual Date': 'VTM Actual Date',
  '70.量產Site': 'Production Site',
  '71.Project List-EIT': 'Project List EIT',
  '72.Project List-SVT': 'Project List SVT',
  '73.Project List-MP': 'Project List MP',
  '74.NPNPCL': 'NPNPCL',
  '75.Tooling': 'Tooling',
  '76.SW Tracking': 'SW Tracking',
  '77.Sample Distribution': 'Sample Distribution',
  '78.Certificate': 'Certificate',
  '79.Testing': 'Testing',
  '80.Cost': 'Cost',
  '81.Risk Assessment': 'Risk Assessment',
  '82.DDR Size': 'DDR Size',
  '83.Flash/EMMC Size': 'Flash/EMMC Size',
  '84.WiFi/BT Type': 'WiFi/BT Type',
  '85.WiFi/BT (IC P/N)': 'WiFi/BT IC P/N',
  '86.Speaker': 'Speaker',
  '87.EE 板子形態': 'EE Board Type',
  '88.MB PCB Size (X x Y) (mm)': 'MB PCB Size',
  '89.MB PCB P/N (9碼)': 'MB PCB P/N',
  '90.PWR 板子形態': 'PWR Board Type',
  '91.Power Consumption (Pout) (W)': 'Power Consumption',
  '92.PWR PCB Size (X x Y) (mm)': 'PWR PCB Size',
  '93.PWR Type': 'PWR Type',
  '94.後殼架構': 'Rear Shell Structure',
  '95.後殼模具號': 'Rear Shell Mold No',
  '96.底座架構': 'Base Structure',
  '97.Stand': 'Stand',
  '98.Cell 料號': 'Cell Part No',
  '99.Cell版本': 'Cell Version',
  '100.背板 (BMS/SEMI-SET)': 'Backplane',
  '101.外框': 'Frame',
  '102.OD': 'OD',
  '103.LB': 'LB',
  '104.Optical Film Structure': 'Optical Film Structure',
  '105.WCG': 'WCG',
  '106.L/D': 'L/D',
  '107.Brightness (Min/Typ)': 'Brightness',
  '108.Grouping 樣機數': 'Grouping Sample Count',
  '109.EMS 標準樣機數': 'EMS Standard Sample Count',
  '110.高/低阶机种': 'High/Low End Model',
  '112. 產品型式': 'Product Type',
  '113. 預計開始銷售年份': 'Expected Sales Start Year',
  '114. Certifictaion Logo Hdmi': 'Certification Logo HDMI',
  '115. Hdmi Certified Date': 'HDMI Certified Date',
  '116. Certifictaion Logo Dts': 'Certification Logo DTS',
  '117. Dts Certified Date': 'DTS Certified Date',
  '118. Certifictaion Logo Dolby Audio': 'Certification Logo Dolby Audio',
  '119. Dolby Audio Certified Date': 'Dolby Audio Certified Date',
  '120. Certifictaion Logo Dolby Vision': 'Certification Logo Dolby Vision',
  '121. Dolby Vision Certified Date': 'Dolby Vision Certified Date',
};

// 解析 Outsourcing 內容
function parseOutsourcingContent(content: string): { [key: string]: string } {
  const summary: { [key: string]: string } = {};
  if (!content) return summary;

  // 支援分號、逗號、換行分隔
  const separators = [';', ',', '\n'];
  let pairs: string[] = [];

  for (const sep of separators) {
    if (content.includes(sep)) {
      pairs = content.split(sep).map(p => p.trim()).filter(p => p);
      break;
    }
  }

  pairs.forEach(pair => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex > 0) {
      const key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();
      if (key && value) {
        summary[key] = value;
      }
    }
  });

  return summary;
}

// 解析 InHouse 內容
function parseInHouseContent(content: string): { [key: string]: string } {
  const summary: { [key: string]: string } = {};
  if (!content) return summary;

  // 支援分號、逗號、換行分隔
  const separators = [';', ',', '\n'];
  let pairs: string[] = [];

  for (const sep of separators) {
    if (content.includes(sep)) {
      pairs = content.split(sep).map(p => p.trim()).filter(p => p);
      break;
    }
  }

  pairs.forEach(pair => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex > 0) {
      let key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();

      // 移除數字前綴（如 "1.", "2."）
      key = key.replace(/^\d+\.?/, '').trim();

      // 映射到標準欄位名稱
      const mappedKey = INHOUSE_FIELD_MAPPING[key] || key;

      if (mappedKey && value) {
        summary[mappedKey] = value;
      }
    }
  });

  return summary;
}

// 提取 summary line 欄位
function extractSummaryFields(content: string, datasetName: string): { [key: string]: string } {
  if (datasetName.includes('InHouse')) {
    return parseInHouseContent(content);
  } else {
    return parseOutsourcingContent(content);
  }
}

// 解析內容函數：將結構化資料轉換為可讀格式
const parseContent = (content: string, full = false): React.ReactElement => {
  // 檢查內容是否有效
  if (!content || typeof content !== 'string') {
    return (
      <div className="text-gray-500 italic">
        無內容
      </div>
    );
  }

  // 嘗試解析為 JSON
  try {
    const parsed = JSON.parse(content);
    const entries = Object.entries(parsed);
    const shown = full ? entries : entries.slice(0, 5);
    return (
      <div className="space-y-2">
        {shown.map(([key, value], idx) => (
          <div key={idx} className="flex border-b border-gray-200 pb-2 last:border-b-0">
            <span className="font-semibold text-gray-700 min-w-[200px]">{key}:</span>
            <span className="text-gray-600 flex-1">{String(value)}</span>
          </div>
        ))}
        {!full && entries.length > shown.length && (
          <div className="text-sm text-gray-500">... {entries.length - shown.length} more</div>
        )}
      </div>
    );
  } catch (e) {
    // 如果不是 JSON，先處理以分號分隔或逗號分隔的 key:value 對
    const normalizeKey = (k: string) => k.replace(/^\s*\d+\.?\s*/, '').trim();

    const tryParseKeyValueList = (items: string[]) => {
      const pairs: [string, string][] = [];
      for (const item of items) {
        const part = item.trim();
        if (!part) continue;
        if (part.includes(':')) {
          const [k, ...v] = part.split(':');
          pairs.push([normalizeKey(k), v.join(':').trim()]);
        } else if (part.includes('=')) {
          const [k, ...v] = part.split('=');
          pairs.push([normalizeKey(k), v.join('=').trim()]);
        } else {
          pairs.push([normalizeKey(part), '']);
        }
      }
      return pairs;
    };

    // 處理以分號分隔的情況（Outsourcing 與 InHouse 的大表常見）
    if (content.includes(';')) {
      const parts = content.split(';').map(s => s.trim()).filter(Boolean);
      const pairs = tryParseKeyValueList(parts);
      // 若有至少一個 pair 有值，視為 key:value 列表
      if (pairs.length > 0 && pairs.some(p => p[1] !== '')) {
        const shown = full ? pairs : pairs.slice(0, 5);
        return (
          <div className="space-y-2">
            {shown.map(([key, value], idx) => (
              <div key={idx} className="flex border-b border-gray-200 pb-2 last:border-b-0">
                <span className="font-semibold text-gray-700 min-w-[200px]">{key}:</span>
                <span className="text-gray-600 flex-1">{value}</span>
              </div>
            ))}
            {!full && pairs.length > shown.length && (
              <div className="text-sm text-gray-500">... {pairs.length - shown.length} more</div>
            )}
          </div>
        );
      }
      // 否則退回為普通表格顯示
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {parts.map((field, idx) => (
                  <td key={idx} className="px-3 py-2 text-sm text-gray-700 border border-gray-200">
                    {field}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // 處理以逗號分隔但可能為 key:value 列表的情況
    if (content.includes(',') && content.split(',').length > 3) {
      const fields = content.split(',').map(f => f.trim()).filter(Boolean);
      const pairs = tryParseKeyValueList(fields);
      if (pairs.length > 0 && pairs.some(p => p[1] !== '')) {
        const shown = full ? pairs : pairs.slice(0, 5);
        return (
          <div className="space-y-2">
            {shown.map(([key, value], idx) => (
              <div key={idx} className="flex border-b border-gray-200 pb-2 last:border-b-0">
                <span className="font-semibold text-gray-700 min-w-[200px]">{key}:</span>
                <span className="text-gray-600 flex-1">{value}</span>
              </div>
            ))}
            {!full && pairs.length > shown.length && (
              <div className="text-sm text-gray-500">... {pairs.length - shown.length} more</div>
            )}
          </div>
        );
      }
      // 否則表格顯示
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                {fields.map((field, idx) => (
                  <td key={idx} className="px-3 py-2 text-sm text-gray-700 border border-gray-200">
                    {field}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // 嘗試將多行文字格式化
    if (content.includes('\n')) {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const shownLines = full ? lines : lines.slice(0, 5);
        return (
          <div className="space-y-1">
            {shownLines.map((line, idx) => {
              // 檢查是否是 key: value 格式
              if (line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                return (
                  <div key={idx} className="flex border-b border-gray-200 pb-1 last:border-b-0">
                    <span className="font-semibold text-gray-700 min-w-[200px]">{normalizeKey(key)}:</span>
                    <span className="text-gray-600 flex-1">{value}</span>
                  </div>
                );
              }
              return <div key={idx} className="text-gray-700">{line}</div>;
            })}
            {!full && lines.length > shownLines.length && (
              <div className="text-sm text-gray-500">... {lines.length - shownLines.length} more</div>
            )}
          </div>
        );
      }
    }

    // 如果都不是，顯示原始內容（縮短長度，除非要求 full）
    if (full) {
      return (
        <div className="text-gray-700 whitespace-pre-wrap">
          {content}
        </div>
      );
    }
    const maxLength = 500;
    const displayContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    return (
      <div className="text-gray-700 whitespace-pre-wrap">
        {displayContent}
      </div>
    );
  }
};

export default function BigTableSearch() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<'inhouse' | 'outsourcing' | 'both'>('outsourcing');
  const [pageSize, setPageSize] = useState<number>(3); // 每頁顯示筆數
  const [currentPage, setCurrentPage] = useState<number>(1); // 當前頁碼
  const [searchMode, setSearchMode] = useState<'semantic' | 'text'>('text');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 從環境變數或配置讀取 Dataset IDs
  const DATASETS = {
    inhouse: process.env.NEXT_PUBLIC_KB_INHOUSE_ID || '',
    outsourcing: process.env.NEXT_PUBLIC_KB_OUTSOURCING_ID || '',
  };

  const handleSearch = async () => {
    setCurrentPage(1); // 新查詢時重設頁碼
    if (!keyword.trim()) {
      setError('請輸入搜尋關鍵字');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allResults: SearchResult[] = [];

      // 根據選擇的 Dataset 進行檢索
      const datasetsToSearch = selectedDataset === 'both'
        ? ['inhouse', 'outsourcing']
        : [selectedDataset];

      // helper: 嘗試從 record 裡取得可讀的 document name
      const getDocumentName = (record: ChunkRecord, dataset: string) => {
        if (record.document_name) return record.document_name;
        if (record.segment && record.segment.document_name) return record.segment.document_name;
        if (record.metadata && (record.metadata.title || record.metadata.name)) return record.metadata.title || record.metadata.name;
        if (record.document_id) return String(record.document_id);
        // 嘗試從 content 中抽取 Project Number 或第一行作為替代名稱
        try {
          const content = record.content || (record.segment && record.segment.content) || record.text || '';
          const m = content.match(/Project\s*Number[:=]\s*([A-Z0-9\-]+)/i) || content.match(/專案編號[:=]\s*([A-Z0-9\-]+)/i);
          if (m && m[1]) return m[1];
          const firstLine = (content || '').split(/\r?\n/).find((l: string) => Boolean(l && l.trim()));
          if (firstLine && firstLine.length < 120) return firstLine.trim().slice(0, 120);
        } catch {}
        return 'Unknown';
      };

      for (const dataset of datasetsToSearch) {
        const datasetId = DATASETS[dataset as keyof typeof DATASETS];
        if (!datasetId) {
          console.warn(`Dataset ID not configured for: ${dataset}`);
          continue;
        }

        try {
          const method = searchMode === 'semantic' ? 'semantic_search' : 'full_text_search';
          const response = await retrieveChunks(datasetId, keyword, 50, method);

          // 將結果加上 dataset 標籤，優先使用 record.content，其次 segment.content，再其次 text
          let mapped = response.records.map((record: ChunkRecord) => ({
            content: (record.content || (record.segment && record.segment.content) || record.text || '').toString(),
            score: typeof record.score === 'number' ? record.score : 0,
            document_name: getDocumentName(record, dataset),
            dataset_name: dataset === 'inhouse' ? 'Project KB (InHouse)' : 'Project KB (Outsourcing)',
          }));

          // 如果使用全文檢索模式，於 client-side 做簡單的 substring 過濾與排序
          if (searchMode === 'text') {
            const q = keyword.trim().toLowerCase();
            mapped = mapped
              .filter((r: SearchResult) => (r.content || '').toLowerCase().includes(q) || (r.document_name || '').toLowerCase().includes(q))
              .map((r: SearchResult) => ({ ...r, score: (r.content.toLowerCase().includes(q) || r.document_name.toLowerCase().includes(q)) ? 1 : 0 }));
            mapped.sort((a: SearchResult, b: SearchResult) => (b.score - a.score));
          }

          allResults.push(...mapped);
        } catch (err) {
          console.error(`Failed to search ${dataset}:`, err);
        }
      }

      // 按相關度排序
      allResults.sort((a, b) => b.score - a.score);
      setResults(allResults);

      if (allResults.length === 0) {
        setError('找不到相關資料，請嘗試使用不同的關鍵字');
      }

    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || '搜尋失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // 收集所有欄位
    const allFields = new Set<string>();
    const processedResults = results.map(result => {
      const parsed = extractSummaryFields(result.content, result.dataset_name);
      Object.keys(parsed).forEach(key => allFields.add(key));
      return { ...result, parsed };
    });

    // 建立 CSV 標頭
    const headers = ['Dataset', 'Document', 'Score', ...Array.from(allFields).sort()];

    // 建立 CSV 資料
    const csvData = processedResults.map(result => {
      const row: any = {
        Dataset: result.dataset_name,
        Document: result.document_name,
        Score: result.score,
      };

      // 填入解析後的欄位值
      Array.from(allFields).forEach(field => {
        row[field] = result.parsed[field] || '';
      });

      return row;
    });

    // 生成 CSV 字串
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // 添加 UTF-8 BOM 以確保中文正常顯示
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Modal 狀態
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  // 展開狀態：使用 index 作為 key（全域 index，非分頁內 index）
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleExpanded = (globalIdx: number) => {
    setExpandedIndices(prev => {
      const found = prev.includes(globalIdx);
      const next = found ? prev.filter(i => i !== globalIdx) : [...prev, globalIdx];
      return next;
    });
  };

  // 分頁相關
  const totalResults = results.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const pagedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <MainLayout title="大表檢索系統">
      <div className="w-full max-w-6xl">
        {/* Debug badge: shows expanded indices for quick visual verification */}
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-xs text-gray-800 px-3 py-1 rounded shadow z-50">
          展開: {expandedIndices.length} {expandedIndices.length ? `(${expandedIndices.join(',')})` : ''}
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 標題 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🔍 大表檢索系統
            </h1>
            <p className="text-gray-600">
              在 Knowledge Base 中搜尋專案資料
            </p>
          </div>

          {/* 搜尋區域 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* 關鍵字輸入 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜尋關鍵字
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
                  placeholder="輸入關鍵字，如：專案名稱、負責人、技術名稱..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Dataset 選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜尋範圍
                </label>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="both">全部 (InHouse + Outsourcing)</option>
                  <option value="inhouse">InHouse 專案</option>
                  <option value="outsourcing">Outsourcing 專案</option>
                </select>
              </div>

              {/* 每頁顯示數量選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每頁顯示
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={3}>3 筆</option>
                  <option value={5}>5 筆</option>
                  <option value={10}>10 筆</option>
                </select>
                <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">
                  搜尋模式
                </label>
                <select
                  value={searchMode}
                  onChange={(e) => setSearchMode(e.target.value as 'semantic' | 'text')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="semantic">語義搜尋 (預設)</option>
                  <option value="text">全文檢索 (文字比對)</option>
                </select>
              </div>
            </div>

            {/* 搜尋按鈕 */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading || !keyword.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? '搜尋中...' : '🔍 開始搜尋'}
              </button>

              {results.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  📥 匯出結果 (CSV)
                </button>
              )}
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              ⚠️ {error}
            </div>
          )}

          {/* 搜尋結果 */}
          {results.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  搜尋結果（第 {currentPage} / {totalPages} 頁，每頁 {pageSize} 筆）
                </h2>
                <span className="text-sm text-gray-600">
                  共找到 {results.length} 筆資料
                </span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {pagedResults.map((result, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx;
                  const summaryFields = extractSummaryFields(result.content, result.dataset_name);
                  return (
                    <div
                      key={`${result.document_name || 'doc'}-${globalIdx}`}
                      aria-expanded={expandedIndices.includes(globalIdx)}
                      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative ${expandedIndices.includes(globalIdx) ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}
                    >
                      {/* 排名標籤 */}
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                        {globalIdx + 1}
                      </div>

                      {/* 標題列 */}
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2 pl-10">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {result.dataset_name}
                          </span>
                          <span className="text-sm text-gray-600">
                            📄 {result.document_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">相關度</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                            {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* summary line */}
                      {Object.keys(summaryFields).length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-x-6 gap-y-1 pl-10">
                          {PRIORITY_FIELDS.filter(f => summaryFields[f]).map(f => (
                            <span key={f} className="inline-block text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 font-semibold">
                              {f}: {summaryFields[f]}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 內容 + 展開/收合 + 查看原始 */}
                      <div className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-200 text-sm relative">
                        {parseContent(result.content, expandedIndices.includes(globalIdx))}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            data-index={globalIdx}
                            aria-expanded={expandedIndices.includes(globalIdx)}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 border border-gray-300 cursor-pointer"
                            onClick={() => toggleExpanded(globalIdx)}
                          >
                            {expandedIndices.includes(globalIdx) ? '收合' : '展開'}
                          </button>
                          <button
                            data-index={globalIdx}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 border border-gray-300 cursor-pointer"
                            onClick={() => {
                              setModalContent(result.content);
                              setModalOpen(true);
                            }}
                          >
                            查看原始
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 分頁按鈕 */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  上一頁
                </button>
                <span className="text-gray-700">第 {currentPage} / {totalPages} 頁</span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  下一頁
                </button>
              </div>

              {/* Modal for 原始內容 */}
              <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                  <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
                  <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto p-6 z-10">
                    <Dialog.Title className="text-lg font-bold mb-2">原始內容</Dialog.Title>
                    <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 max-h-[60vh] overflow-y-auto text-sm">
                      {modalContent}
                    </pre>
                    <div className="mt-4 flex justify-end">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => setModalOpen(false)}
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog>
            </div>
          )}

          {/* 空狀態 */}
          {!loading && !error && results.length === 0 && keyword && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                找不到相關資料
              </h3>
              <p className="text-gray-600">
                請嘗試使用不同的關鍵字或調整搜尋範圍
              </p>
            </div>
          )}

          {/* 初始狀態提示 */}
          {!keyword && !loading && results.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💡 使用說明
              </h3>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li>輸入關鍵字進行全文搜尋</li>
                <li>支援模糊匹配和語義搜尋</li>
                <li>可選擇特定 Dataset 或搜尋全部</li>
                <li>選擇顯示 Top 5 或 Top 10 結果</li>
                <li>結果按相關度自動排序</li>
                <li>資料以結構化格式清晰呈現</li>
                <li>可匯出搜尋結果為 CSV 檔案</li>
              </ul>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚙️ 設定說明：</strong>請確保已在 .env 檔案中設定 Dataset IDs：
                </p>
                <code className="block mt-2 text-xs bg-white p-2 rounded border border-yellow-300">
                  NEXT_PUBLIC_KB_INHOUSE_ID=your_dataset_id<br/>
                  NEXT_PUBLIC_KB_OUTSOURCING_ID=your_dataset_id
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
