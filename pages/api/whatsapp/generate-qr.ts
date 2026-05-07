import type { NextApiRequest, NextApiResponse } from 'next';
import { connectSession, getQr, getStatus } from '@/lib/wuzApi';

type ResponseData = {
  sessionId: string;
  qrCode: string;
  isConnected: boolean;
} | {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = 'wuzapi';
    await connectSession();
    const qrCode = await getQr();
    const status = await getStatus();

    return res.status(200).json({
      sessionId,
      qrCode,
      isConnected: status.connected,
    });
  } catch (error) {
    return res.status(200).json({
      sessionId: 'wuzapi',
      qrCode: '',
      isConnected: false,
    });
  }
}
