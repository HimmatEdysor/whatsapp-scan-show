'use client';

import React, { useState, useEffect } from 'react';
import QRCodeComponent from '@/components/QRCode';
import InboxView from '@/components/InboxView';
import Header from '@/components/Header';

export default function Home() {
  const [stage, setStage] = useState<'connect' | 'inbox'>('connect');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if WhatsApp session is already connected
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const savedSessionId = localStorage.getItem('whatsappSessionId');
      if (!savedSessionId) return;

      // Verify the session is still connected
      const response = await fetch(`/api/whatsapp/session-status/${savedSessionId}`);
      const data = await response.json();

      if (data.isConnected) {
        setSessionId(savedSessionId);
        setStage('inbox');
      } else {
        // Session expired, clear it
        localStorage.removeItem('whatsappSessionId');
      }
    } catch (err) {
      console.error('Failed to check existing connection:', err);
    }
  };

  const handleQRGenerated = (id: string) => {
    setSessionId(id);
    localStorage.setItem('whatsappSessionId', id);
  };

  const handleScanComplete = () => {
    setStage('inbox');
  };

  const handleDisconnect = () => {
    setSessionId(null);
    localStorage.removeItem('whatsappSessionId');
    setStage('connect');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {stage === 'connect' ? (
          <QRCodeComponent 
            onQRGenerated={handleQRGenerated}
            onScanComplete={handleScanComplete}
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
