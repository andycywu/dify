import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TEST API CALLED ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Raw body:', req.body);
    console.log('Query:', req.query);

    const { action, time } = req.body;
    console.log('Parsed:', { action, time });

    return res.status(200).json({
      success: true,
      message: 'Test API called successfully',
      received: { action, time },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
