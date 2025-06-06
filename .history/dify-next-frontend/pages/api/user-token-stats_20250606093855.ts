import type { NextApiRequest, NextApiResponse } from 'next';

// Mock implementation for user daily usage/cost
// In production, replace with real DB or API call
const mockDailyUsage = [
  { date: '2025-06-01', tokenUsage: 120, billing: 1.25 },
  { date: '2025-06-02', tokenUsage: 98, billing: 1.02 },
  { date: '2025-06-03', tokenUsage: 150, billing: 1.50 },
  { date: '2025-06-04', tokenUsage: 80, billing: 0.80 },
  { date: '2025-06-05', tokenUsage: 110, billing: 1.10 },
  { date: '2025-06-06', tokenUsage: 60, billing: 0.60 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }
  // Return mock data for demo
  return res.status(200).json({ dailyUsage: mockDailyUsage });
}
