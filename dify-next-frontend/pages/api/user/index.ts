import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;

  let operation = '';
  switch (method) {
    case 'GET':
      operation = '用戶列表查詢';
      break;
    case 'POST':
      operation = '用戶創建';
      break;
    default:
      operation = '用戶管理';
  }

  return res.status(410).json({
    error: 'This API endpoint has been deprecated',
    message: `${operation}功能已整合至 Wiki.js 系統，請使用 Wiki.js 管理介面進行用戶管理`,
    redirectTo: process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3000',
    deprecated: true,
    timestamp: new Date().toISOString()
  });
}
