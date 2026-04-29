import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  sessionId: string;
  isConnected: boolean;
  status: string;
} | {
  error: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  try {
    // In production, this would call the Wuz API to check session status
    // For now, simulate a connection after a delay
    const isConnected = Math.random() > 0.7; // 30% chance of connection

    res.status(200).json({
      sessionId: sessionId as string,
      isConnected,
      status: isConnected ? 'connected' : 'waiting',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check session status' });
  }
}
