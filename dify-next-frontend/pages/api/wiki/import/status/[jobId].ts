import type { NextApiRequest, NextApiResponse } from 'next';

// 模擬的導入任務狀態
const mockJobs: Record<string, any> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query;

  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const job = mockJobs[jobId] || {
      id: jobId,
      status: 'completed',
      progress: 100,
      message: 'Import completed successfully',
    };

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    console.error('Failed to fetch job status:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch job status',
      message: error.message,
    });
  }
}
