'use client';

import React, { useState, useEffect } from 'react';
import QRCodeComponent from '@/components/QRCode';
import InboxView from '@/components/InboxView';
import Header from '@/components/Header';

const SESSION_KEY = 'whatsappSessionId';
const DEFAULT_SESSION = 'wuzapi';

export default function Home() {
  const [stage, setStage] = useState<'loading' | 'connect' | 'inbox'>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState<string | null>(null);

  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const savedSessionId = localStorage.getItem(SESSION_KEY) || DEFAULT_SESSION;
      const response = await fetch(`/api/whatsapp/session-status/${savedSessionId}`);
      const data = await response.json();

      if (data.isConnected) {
        localStorage.setItem(SESSION_KEY, savedSessionId);
        setSessionId(savedSessionId);
        setPhone(data.phone || null);
        setStage('inbox');
        return;
      }

      localStorage.removeItem(SESSION_KEY);
      setStage('connect');
    } catch (err) {
      console.error('Failed to check existing connection:', err);
      setStage('connect');
    }
  };

  const handleQRGenerated = (id: string, meta?: { baseUrl?: string }) => {
    setSessionId(id);
    localStorage.setItem(SESSION_KEY, id);
    if (meta?.baseUrl) setApiBase(meta.baseUrl);
  };

  const handleScanComplete = () => {
    setStage('inbox');
    // Refresh phone from status
    fetch(`/api/whatsapp/session-status/${sessionId || DEFAULT_SESSION}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.phone) setPhone(data.phone);
      })
      .catch(() => undefined);
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
    } catch {
      // ignore — still clear UI
    }
    setSessionId(null);
    setPhone(null);
    localStorage.removeItem(SESSION_KEY);
    setStage('connect');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header
        connected={stage === 'inbox'}
        phone={phone}
        apiBase={apiBase}
      />

      <main className="container mx-auto px-4 py-8">
        {stage === 'loading' ? (
          <div className="text-center text-slate-400 py-20">Checking WhatsApp session...</div>
        ) : stage === 'connect' ? (
          <QRCodeComponent
            onQRGenerated={handleQRGenerated}
            onScanComplete={handleScanComplete}
            onBaseUrl={(url) => setApiBase(url)}
          />
        ) : (
          <InboxView
            sessionId={sessionId}
            onDisconnect={handleDisconnect}
          />
        )}
      </main>
    </div>
  );
}
