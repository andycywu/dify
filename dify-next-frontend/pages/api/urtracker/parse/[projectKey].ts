import type { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';

const REST_TO_SOAP_BASE_URL = process.env.REST_TO_SOAP_PROXY_URL || 'http://rest-to-soap-proxy:5001';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { projectKey } = req.query;
  const state = (req.query.state as string) || 'all';

  if (!projectKey || typeof projectKey !== 'string') {
    return res.status(400).json({
      success: false,
      error: '缺少專案代號',
      message: '請提供有效的 projectKey (TV, PD, MNT, AVA)'
    });
  }

  try {
    console.log(`[Urtracker Parse] 開始處理請求: ${projectKey}, state: ${state}`);
    console.log(`[Urtracker Parse] REST_TO_SOAP_BASE_URL: ${REST_TO_SOAP_BASE_URL}`);

    // 從 rest-to-soap-proxy 下載 Excel 文件
    const downloadUrl = `${REST_TO_SOAP_BASE_URL}/api/https/download-by-name/${projectKey}?state=${state}`;
    console.log(`[Urtracker Parse] 正在請求: ${downloadUrl}`);

    const response = await fetch(downloadUrl);
    console.log(`[Urtracker Parse] 響應狀態: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `下載失敗: ${response.statusText}`
      }));

      console.error(`[Urtracker Parse] 下載失敗:`, errorData);

      return res.status(response.status).json({
        success: false,
        error: errorData.error || '下載失敗',
        message: errorData.message,
        details: {
          projectKey,
          state,
          url: downloadUrl,
          statusCode: response.status
        }
      });
    }

    // 獲取 Excel 文件
    const buffer = await response.arrayBuffer();
    console.log(`[Urtracker Parse] Excel 文件大小: ${buffer.byteLength} bytes`);

    // 使用 xlsx 解析 Excel
    const workbook = XLSX.read(buffer, { type: 'array' });
    console.log(`[Urtracker Parse] 工作表數量: ${workbook.SheetNames.length}`);

    // 獲取第一個工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log(`[Urtracker Parse] 使用工作表: ${sheetName}`);

    // 轉換為 JSON
    const jsonData = XLSX.utils.sheet_to_json<UrtrackerIssue>(worksheet);
    console.log(`[Urtracker Parse] 解析出 ${jsonData.length} 筆數據`);

    // 獲取欄位名稱
    const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    console.log(`[Urtracker Parse] 欄位: ${columns.join(', ')}`);

    return res.status(200).json({
      success: true,
      projectKey,
      state,
      totalRows: jsonData.length,
      columns,
      data: jsonData,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Urtracker Parse] 錯誤:', error);
    console.error('[Urtracker Parse] 錯誤堆疊:', error.stack);

    return res.status(500).json({
      success: false,
      error: '解析失敗',
      message: error.message || '無法解析 Excel 文件',
      projectKey,
      state,
      details: {
        errorType: error.constructor.name,
        errorStack: error.stack
      }
    });
  }
}
