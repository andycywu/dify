// Mock usage and cost data for demonstration
import type { NextApiRequest, NextApiResponse } from 'next';

const mockData = [
  { id: '1', date: '2025-06-01', usage: 120, cost: 12.5 },
  { id: '2', date: '2025-06-02', usage: 98, cost: 10.2 },
  { id: '3', date: '2025-06-03', usage: 150, cost: 15.0 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(mockData);
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
