import type { NextApiRequest, NextApiResponse } from 'next';
import { readCalls } from '@/lib/callStore';
import { getContacts } from '@/lib/wuzApi';

// Returns stored WhatsApp calls, newest first, enriched with contact names.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const calls = readCalls();

  // Best-effort name lookup from contacts (never fail the call list on this).
  let nameByDigits: Record<string, string> = {};
  try {
    const contacts = await getContacts();
    Object.keys(contacts).forEach((jid) => {
      const c = contacts[jid] || {};
      const d = String(jid).split('@')[0].replace(/[^0-9]/g, '');
      const name = c.FullName || c.PushName || c.BusinessName || '';
      if (d && name) nameByDigits[d] = name;
    });
  } catch {
    nameByDigits = {};
  }

  const enriched = calls
    .map((c) => ({
      ...c,
      name: c.name || nameByDigits[c.waId] || c.waId || 'Unknown',
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return res.status(200).json({ calls: enriched });
}
