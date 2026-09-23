import type { NextApiRequest, NextApiResponse } from 'next';
import { connectSession, getConfiguredBaseUrl, getQr, getStatus } from '@/lib/wuzApi';

type ResponseData = {
  sessionId: string;
  qrCode: string;
  isConnected: boolean;
  loggedIn?: boolean;
  baseUrl?: string;
  message?: string;
} | {
  error: string;
  baseUrl?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const base = getConfiguredBaseUrl();
  const sessionId = 'wuzapi';

  try {
    const statusBefore = await getStatus().catch(() => ({ connected: false, loggedIn: false }));
    if (statusBefore.loggedIn) {
      return res.status(200).json({
        sessionId,
        qrCode: '',
        isConnected: true,
        loggedIn: true,
        baseUrl: base,
      });
    }

    await connectSession();
    const qrCode = await getQr();
    const status = await getStatus().catch(() => ({ connected: false, loggedIn: false }));

    if (status.loggedIn) {
      return res.status(200).json({
        sessionId,
        qrCode: '',
        isConnected: true,
        loggedIn: true,
        baseUrl: base,
      });
    }

    if (!qrCode) {
      return res.status(200).json({
        sessionId,
        qrCode: '',
        isConnected: false,
        loggedIn: false,
        baseUrl: base,
        message:
          'QR not ready yet. Live Wuz may be outdated — run local wuzapi on :8082 (docker compose up -d wuzapi) and point WUZAPI_BASE_URL to http://127.0.0.1:8082.',
      });
    }

    return res.status(200).json({
      sessionId,
      qrCode,
      isConnected: false,
      loggedIn: false,
      baseUrl: base,
    });
  } catch (error) {
    return res.status(200).json({
      sessionId,
      qrCode: '',
      isConnected: false,
      baseUrl: base,
      message: error instanceof Error ? error.message : 'Failed to reach Wuz API',
    });
  }
}
