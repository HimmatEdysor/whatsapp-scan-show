type Json = Record<string, any>;

function baseUrl(): string {
  const base = process.env.WUZAPI_BASE_URL || process.env.NEXT_PUBLIC_WUZ_API_BASE_URL || '';
  if (!base) throw new Error('WUZAPI_BASE_URL is missing');
  // Live host is https://whatsapp.guaranteeadmit.com (no /api). Strip accidental /api.
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return trimmed.replace(/\/api$/i, '');
}

function token(): string {
  const t = process.env.WUZAPI_TOKEN || process.env.WUZ_API_KEY || '';
  if (!t) throw new Error('WUZAPI_TOKEN is missing');
  return t;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function connectSession(): Promise<boolean> {
  try {
    const res = await wuzFetch('/session/connect', {
      method: 'POST',
      body: JSON.stringify({ Subscribe: ['Message', 'ReadReceipt'], Immediate: true }),
    });
    if (res.ok) return true;
    // Already connected is fine for QR polling.
    if (res.status === 500) {
      const data: Json = await res.json().catch(() => ({}));
      const err = String(data.error || data.message || '').toLowerCase();
      return err.includes('already connected') || err.includes('already logged in');
    }
    return false;
  } catch {
    return false;
  }
}

function extractQr(data: Json): string {
  const raw =
    data?.data?.QRCode ||
    data?.data?.qrcode ||
    data?.data?.qr ||
    data?.QRCode ||
    data?.qrcode ||
    data?.qr ||
    '';
  if (!raw || typeof raw !== 'string') return '';
  if (raw.startsWith('data:image')) return raw;
  // Base64 PNG/JPEG without data URI
  if (raw.startsWith('iVBOR') || raw.startsWith('/9j/')) {
    const mime = raw.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${raw}`;
  }
  // WhatsApp QR payload string (not an image) — leave as-is for client renderer
  return raw;
}

async function fetchQrOnce(): Promise<{ qr: string; error: string; loggedIn: boolean; needsConnect: boolean }> {
  try {
    const res = await wuzFetch('/session/qr', { method: 'GET' });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('image/')) {
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = contentType.split(';')[0] || 'image/png';
      return {
        qr: `data:${mime};base64,${buf.toString('base64')}`,
        error: '',
        loggedIn: false,
        needsConnect: false,
      };
    }

    const data: Json = await res.json().catch(() => ({}));
    const qr = extractQr(data);
    const error = String(data.error || data.message || '').toLowerCase();
    const loggedIn =
      !qr &&
      (Boolean(data.data?.LoggedIn || data.data?.loggedIn) ||
        error.includes('already logged') ||
        error.includes('logged in'));
    const needsConnect =
      !qr &&
      !loggedIn &&
      (res.status === 401 ||
        error.includes('no session') ||
        error.includes('not connected') ||
        error.includes('websocket'));

    return { qr, error, loggedIn, needsConnect };
  } catch (e) {
    return {
      qr: '',
      error: e instanceof Error ? e.message : 'qr fetch failed',
      loggedIn: false,
      needsConnect: true,
    };
  }
}

/** Connect + poll until QR PNG is ready (matches CRM MyWhatsappWuzService). */
export async function getQr(attempts = 12, sleepMs = 400): Promise<string> {
  await connectSession();

  for (let i = 0; i < attempts; i++) {
    const result = await fetchQrOnce();
    if (result.qr) return result.qr;
    if (result.loggedIn) return '';
    if (result.needsConnect) {
      await connectSession();
    }
    if (i < attempts - 1) await sleep(sleepMs);
  }
  return '';
}

export async function getStatus(): Promise<{ connected: boolean; loggedIn: boolean; phone?: string; qrcode?: string }> {
  const res = await wuzFetch('/session/status', { method: 'GET' });
  if (!res.ok) return { connected: false, loggedIn: false };
  const data: Json = await res.json();
  const s = data.data || data;
  const loggedIn = Boolean(s.LoggedIn || s.loggedIn);
  const connected = Boolean(s.Connected || s.connected || loggedIn);
  return {
    connected,
    loggedIn,
    phone: s.Jid || s.jid,
    qrcode: s.qrcode || s.QRCode || '',
  };
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

export function getConfiguredBaseUrl(): string {
  try {
    return baseUrl();
  } catch {
    return '';
  }
}
