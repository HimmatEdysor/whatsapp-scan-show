import type { NextApiRequest, NextApiResponse } from 'next';
import { getStatus } from '@/lib/wuzApi';

type ResponseData = {
  sessionId: string;
  isConnected: boolean;
  status: string;
  phone?: string;
} | {
  error: string;
};

export default async function handler(
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
    const status = await getStatus();
    return res.status(200).json({
      sessionId: sessionId as string,
      isConnected: status.connected,
      status: status.connected ? 'connected' : 'waiting',
      phone: status.phone,
    });
  } catch {
    return res.status(200).json({
      sessionId: sessionId as string,
      isConnected: false,
      status: 'waiting',
    });
  }
}
