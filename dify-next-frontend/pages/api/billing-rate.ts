import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 使用 Dify 原生統計，費率直接從 Dify 取得
    return res.status(200).json({ 
      rate: 'native', 
      message: 'Using Dify native pricing from message records',
      note: 'Cost is calculated by Dify based on actual model usage'
    });
  }
  
  // 不再支援自定義費率
  return res.status(405).json({ 
    error: 'Custom billing rate not supported', 
    message: 'Now using Dify native pricing' 
  });
}
