// Simple file-backed store for WhatsApp call events.
//
// WhatsApp/whatsmeow does NOT provide historical call sync: call events only
// arrive in real time via the WuzAPI webhook while the session is connected.
// We persist them here so the Calls tab survives page reloads and dev restarts.

import fs from 'fs';
import path from 'path';

export type CallRecord = {
  id: string;
  callId: string;
  waId: string; // digits-only phone of the other party
  jid: string;
  name?: string;
  direction: 'inbound' | 'outbound';
  status: 'missed' | 'rejected' | 'accepted' | 'ringing' | 'ended';
  isVideo: boolean;
  timestamp: number; // unix seconds
  durationSeconds: number;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const CALLS_FILE = path.join(DATA_DIR, 'calls.json');

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CALLS_FILE)) {
    fs.writeFileSync(CALLS_FILE, '[]', 'utf8');
  }
}

export function readCalls(): CallRecord[] {
  try {
    ensureStore();
    const raw = fs.readFileSync(CALLS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CallRecord[]) : [];
  } catch {
    return [];
  }
}

function writeCalls(calls: CallRecord[]): void {
  ensureStore();
  fs.writeFileSync(CALLS_FILE, JSON.stringify(calls, null, 2), 'utf8');
}

/**
 * Insert or update a call by callId. A single call produces several events
 * (offer → accept/terminate); we merge them into one record so status and
 * duration reflect the latest known state.
 */
export function upsertCall(partial: Partial<CallRecord> & { callId: string }): CallRecord {
  const calls = readCalls();
  const idx = calls.findIndex((c) => c.callId === partial.callId);

  if (idx >= 0) {
    const merged: CallRecord = { ...calls[idx], ...stripUndefined(partial) };
    calls[idx] = merged;
    writeCalls(calls);
    return merged;
  }

  const record: CallRecord = {
    id: partial.callId,
    callId: partial.callId,
    waId: partial.waId ?? '',
    jid: partial.jid ?? '',
    name: partial.name,
    direction: partial.direction ?? 'inbound',
    status: partial.status ?? 'ringing',
    isVideo: partial.isVideo ?? false,
    timestamp: partial.timestamp ?? Math.floor(Date.now() / 1000),
    durationSeconds: partial.durationSeconds ?? 0,
  };
  calls.unshift(record);
  writeCalls(calls);
  return record;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}
