type Json = Record<string, any>;

function baseUrl(): string {
  const base = process.env.WUZAPI_BASE_URL || process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || '';
  if (!base) throw new Error('WUZAPI_BASE_URL is missing');
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function token(): string {
  const t = process.env.WUZAPI_TOKEN || process.env.WUZ_API_KEY || '';
  if (!t) throw new Error('WUZAPI_TOKEN is missing');
  return t;
}

async function wuzFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Token: token(),
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

export async function connectSession(): Promise<void> {
  await wuzFetch('/session/connect', {
    method: 'POST',
    body: JSON.stringify({ Subscribe: ['Message'], Immediate: true }),
  });
}

export async function getQr(): Promise<string> {
  const res = await wuzFetch('/session/qr', { method: 'GET' });
  if (!res.ok) throw new Error(`WUZAPI /session/qr failed: ${res.status}`);
  const data: Json = await res.json();
  return data.data?.QRCode || data.QRCode || '';
}

export async function getStatus(): Promise<{ connected: boolean; phone?: string }> {
  const res = await wuzFetch('/session/status', { method: 'GET' });
  if (!res.ok) return { connected: false };
  const data: Json = await res.json();
  const s = data.data || data;
  const connected = Boolean(s.LoggedIn || s.Connected);
  return { connected, phone: s.Jid };
}

export async function getContacts(): Promise<Record<string, any>> {
  const res = await wuzFetch('/user/contacts', { method: 'GET' });
  if (!res.ok) throw new Error(`WUZAPI /user/contacts failed: ${res.status}`);
  const data: Json = await res.json();
  return data.data || data || {};
}

export async function getChatHistory(chatId: string): Promise<any[]> {
  const url = `/chat/history?Phone=${encodeURIComponent(chatId)}`;
  const res = await wuzFetch(url, { method: 'GET' });
  if (!res.ok) return [];
  const data: Json = await res.json();
  return data.data || data.messages || [];
}

export async function sendText(chatId: string, message: string): Promise<string | undefined> {
  const phone = String(chatId).split('@')[0];
  const res = await wuzFetch('/chat/send/text', {
    method: 'POST',
    body: JSON.stringify({ Phone: phone, Body: message }),
  });
  if (!res.ok) throw new Error(`WUZAPI send failed: ${res.status}`);
  const data: Json = await res.json();
  return data.data?.Id || data.Id;
}

