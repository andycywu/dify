import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 檢查用戶認證
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });

    console.log('[wiki-batch-importer] Token:', token);

    if (!token || !token.email) {
      console.log('[wiki-batch-importer] No token or email');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[wiki-batch-importer] User email:', token.email);
    console.log('[wiki-batch-importer] User role from token:', token.role);

    // 檢查角色 - 同時檢查多種可能的值
    const isAdmin = token.role === 'Administrator' || token.role === 'admin' || token.role === 'super admin';
    console.log('[wiki-batch-importer] Is admin check result:', isAdmin);

    if (!isAdmin) {
      console.log('[wiki-batch-importer] User is not admin, role:', token.role);
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // 生成臨時認證 token 或使用 session 資訊
    const authToken = Buffer.from(JSON.stringify({
      email: token.email,
      role: token.role,
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 分鐘過期
    })).toString('base64');

    // 重定向到 wiki-batch-importer，帶上認證參數
    // 使用外部可訪問的地址，因為用戶的瀏覽器需要在新標籤頁中訪問
    const batchImporterUrl = process.env.NEXT_PUBLIC_WIKI_BATCH_IMPORTER_URL || 'http://localhost:5050';
    const redirectUrl = `${batchImporterUrl}?auth=${authToken}`;

    console.log('[wiki-batch-importer] Redirecting to:', redirectUrl);

    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('[wiki-batch-importer] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
