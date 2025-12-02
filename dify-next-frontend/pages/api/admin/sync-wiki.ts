
import { NextApiRequest, NextApiResponse } from 'next';
import { syncWikiToDify } from '../../../lib/wiki-sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple security check (e.g., check for a secret header or just allow localhost/admin)
  // For now, we'll assume it's protected by network or a shared secret if needed.
  // You can add: if (req.headers['x-sync-secret'] !== process.env.SYNC_SECRET) return res.status(401).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run sync in background (or await if you want to see result)
    // Since it might take long, maybe just trigger it.
    // But Vercel/Next.js serverless functions have timeouts.
    // If running as a container, it's fine to await.
    await syncWikiToDify();

    res.status(200).json({ success: true, message: 'Sync completed' });
  } catch (error: any) {
    console.error('Sync failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
