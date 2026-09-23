import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = { ok: boolean } | { error: string };

function baseUrl(): string {
  const base = process.env.WUZAPI_BASE_URL || process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || '';
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return trimmed.replace(/\/api$/i, '');
}

function token(): string {
  return process.env.WUZAPI_TOKEN || process.env.WUZ_API_KEY || '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const base = baseUrl();
  const t = token();
  if (!base || !t) {
    return res.status(200).json({ ok: true });
  }

  try {
    await fetch(`${base}/session/logout`, {
      method: 'POST',
      headers: { Token: t, 'Content-Type': 'application/json' },
    });
  } catch {
    // ignore
  }
  try {
    await fetch(`${base}/session/disconnect`, {
      method: 'POST',
      headers: { Token: t, 'Content-Type': 'application/json' },
    });
  } catch {
    // ignore
  }

  return res.status(200).json({ ok: true });
}
