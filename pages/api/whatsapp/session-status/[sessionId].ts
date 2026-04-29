import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  sessionId: string;
  isConnected: boolean;
  status: string;
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
    const wuzApiUrl = process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || 'https://wuzapi.guaranteeadmit.com';
    const wuzApiKey = process.env.WUZ_API_KEY;

    if (!wuzApiKey) {
      return res.status(500).json({ error: 'Wuz API key not configured' });
    }

    // Call real Wuz API to check session status
    const response = await fetch(`${wuzApiUrl}/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${wuzApiKey}`,
      },
    });

    if (!response.ok) {
      // Session not found or expired
      return res.status(200).json({
        sessionId: sessionId as string,
        isConnected: false,
        status: 'waiting',
      });
    }

    const data = await response.json();

    res.status(200).json({
      sessionId: sessionId as string,
      isConnected: data.status === 'connected',
      status: data.status || 'waiting',
    });
  } catch (error) {
    console.error('Session status check error:', error);
    res.status(200).json({
      sessionId: sessionId as string,
      isConnected: false,
      status: 'waiting',
    });
  }
}
