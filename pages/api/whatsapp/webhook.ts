import type { NextApiRequest, NextApiResponse } from 'next';
import { upsertCall, type CallRecord } from '@/lib/callStore';

// Receives WuzAPI webhook events. We only care about call events here
// (Message/ReadReceipt/etc. are polled elsewhere). Call events arrive in
// real time when the session is subscribed to "All".

type Json = Record<string, any>;

function digits(jid: string): string {
  return String(jid || '').split('@')[0].replace(/[^0-9]/g, '');
}

function toUnixSeconds(ts: any): number {
  if (!ts) return Math.floor(Date.now() / 1000);
  if (typeof ts === 'number') return ts > 1e12 ? Math.floor(ts / 1000) : Math.floor(ts);
  const parsed = Date.parse(String(ts));
  return Number.isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000);
}

function isCallType(type: string): boolean {
  return /call/i.test(type);
}

/** Map a whatsmeow call event type + reason to a display status. */
function resolveStatus(type: string, reason: string): CallRecord['status'] {
  const t = type.toLowerCase();
  const r = (reason || '').toLowerCase();
  if (t.includes('terminate')) {
    if (r.includes('timeout') || r.includes('miss')) return 'missed';
    if (r.includes('reject') || r.includes('decline')) return 'rejected';
    return 'ended';
  }
  if (t.includes('accept')) return 'accepted';
  if (t.includes('offer')) return 'ringing';
  return 'ringing';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // WuzAPI posts either JSON or form-encoded "jsonData". Normalize both.
  let payload: Json = {};
  try {
    if (typeof req.body === 'string') {
      payload = JSON.parse(req.body);
    } else if (req.body && typeof req.body === 'object') {
      payload = req.body;
    }
    if (payload.jsonData && typeof payload.jsonData === 'string') {
      payload = { ...payload, ...JSON.parse(payload.jsonData) };
    }
  } catch {
    // ignore malformed payloads
  }

  const type = String(payload.type || payload.Type || payload.event_type || '');

  if (!isCallType(type)) {
    // Not a call event — acknowledge and ignore.
    return res.status(200).json({ ok: true, ignored: true });
  }

  const event: Json = payload.event || payload.Event || payload.data || payload;

  const callId = String(
    event.CallID || event.callID || event.callId || event.id || `call-${Date.now()}`,
  );
  const fromJid = String(event.From || event.from || event.CallCreator || event.Chat || '');
  const creatorJid = String(event.CallCreator || event.callCreator || fromJid);
  const ownJid = String(payload.jid || payload.Jid || '');
  const isFromMe =
    Boolean(event.IsFromMe || event.fromMe) ||
    (ownJid && digits(creatorJid) === digits(ownJid));

  const reason = String(event.Reason || event.reason || '');
  const isVideo = Boolean(event.IsVideo || event.isVideo || /video/i.test(JSON.stringify(event)));

  const record = upsertCall({
    callId,
    waId: digits(fromJid || creatorJid),
    jid: fromJid || creatorJid,
    direction: isFromMe ? 'outbound' : 'inbound',
    status: resolveStatus(type, reason),
    isVideo,
    timestamp: toUnixSeconds(event.Timestamp || event.timestamp),
  });

  // Log so real call payloads can be inspected during setup.
  console.log('[wuz webhook] call event', type, JSON.stringify(record));

  return res.status(200).json({ ok: true, stored: record.callId });
}
