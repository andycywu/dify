import type { NextApiRequest, NextApiResponse } from 'next';

const REST_TO_SOAP_BASE_URL = process.env.REST_TO_SOAP_PROXY_URL || 'http://rest-to-soap-proxy:5001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { projectId } = req.query;
  const state = (req.query.state as string) || 'all';

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '缺少專案 ID',
      message: '請提供有效的 projectId'
    });
  }

  try {
    console.log(`[Urtracker Download ID] 開始處理請求: ${projectId}, state: ${state}`);

    // 從 rest-to-soap-proxy 下載 Excel 文件 (使用專案 ID)
    const downloadUrl = `${REST_TO_SOAP_BASE_URL}/api/https/download/${projectId}?state=${state}`;
    console.log(`[Urtracker Download ID] 正在請求: ${downloadUrl}`);

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `下載失敗: ${response.statusText}`
      }));

      console.error(`[Urtracker Download ID] 下載失敗:`, errorData);

      return res.status(response.status).json({
        success: false,
        error: errorData.error || '下載失敗',
        message: errorData.message
      });
    }

    // 獲取 Excel 文件
    const buffer = await response.arrayBuffer();

    // 從響應頭中獲取文件名或生成默認文件名
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `Project_${projectId}_${state}_${new Date().toISOString().split('T')[0]}.xls`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) {
        filename = match[1];
      }
    }

    // 設置響應頭讓瀏覽器下載文件
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.byteLength);

    return res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('[Urtracker Download ID] 錯誤:', error);

    return res.status(500).json({
      success: false,
      error: '下載失敗',
      message: error.message || '無法下載 Excel 文件'
    });
  }
}
