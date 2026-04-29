'use client';

import React, { useState } from 'react';
import QRCodeComponent from '@/components/QRCode';
import InboxView from '@/components/InboxView';
import Header from '@/components/Header';

export default function Home() {
  const [stage, setStage] = useState<'scan' | 'inbox'>('scan');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleQRGenerated = (id: string) => {
    setSessionId(id);
  };

  const handleScanComplete = () => {
    setStage('inbox');
  };

  const handleBackToScan = () => {
    setStage('scan');
    setSessionId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {stage === 'scan' ? (
          <QRCodeComponent 
            onQRGenerated={handleQRGenerated}
            onScanComplete={handleScanComplete}
          />
        ) : (
          <InboxView 
            sessionId={sessionId}
            onBackToScan={handleBackToScan}
          />
        )}
      </main>
    </div>
  );
}
