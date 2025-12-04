import type { NextApiRequest, NextApiResponse } from 'next';

// 模擬的導入歷史記錄（實際應該從數據庫獲取）
const mockHistory = [
  {
    id: '1',
    status: 'completed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    documentsProcessed: 100,
    documentsTotal: 100,
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: 從數據庫獲取實際的導入歷史
    return res.status(200).json({
      success: true,
      data: mockHistory,
    });
  } catch (error: any) {
    console.error('Failed to fetch import history:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch import history',
      message: error.message,
    });
  }
}
