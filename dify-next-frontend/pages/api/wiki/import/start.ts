import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: 實作實際的導入邏輯
    const jobId = `job-${Date.now()}`;

    return res.status(200).json({
      success: true,
      data: {
        id: jobId,
        status: 'started',
        message: 'Import job started',
      },
    });
  } catch (error: any) {
    console.error('Failed to start import:', error.message);
    return res.status(500).json({
      error: 'Failed to start import',
      message: error.message,
    });
  }
}
