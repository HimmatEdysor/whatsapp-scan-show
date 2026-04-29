import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  sessionId: string;
  qrCode: string;
} | {
  error: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate a mock QR code and session ID
    // In production, this would call the Wuz API
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock QR code data - in production, this comes from Wuz API
    const mockQRData = JSON.stringify({
      sessionId,
      timestamp: new Date().toISOString(),
      apiUrl: process.env.WUZ_API_BASE_URL || 'https://wuzapi.guaranteeadmit.com',
    });

    res.status(200).json({
      sessionId,
      qrCode: mockQRData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
