import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: 實作實際的取消邏輯
    return res.status(200).json({
      success: true,
      message: `Job ${jobId} cancelled`,
    });
  } catch (error: any) {
    console.error('Failed to cancel job:', error.message);
    return res.status(500).json({
      error: 'Failed to cancel job',
      message: error.message,
    });
  }
}
