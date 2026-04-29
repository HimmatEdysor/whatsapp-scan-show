'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCodeComponent from '@/components/QRCode';
import InboxView from '@/components/InboxView';
import Header from '@/components/Header';

export default function Home() {
  const [stage, setStage] = useState<'scan' | 'inbox'>('inbox');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAutoConnecting, setIsAutoConnecting] = useState(true);

  useEffect(() => {
    // Auto-connect on load
    autoConnectToWhatsApp();
  }, []);

  const autoConnectToWhatsApp = async () => {
    try {
      setIsAutoConnecting(true);
      
      // Try to get existing session from localStorage
      const savedSessionId = localStorage.getItem('whatsappSessionId');
      
      if (savedSessionId) {
        // Check if session is still valid
        const response = await fetch(`/api/whatsapp/session-status/${savedSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.isConnected) {
            setSessionId(savedSessionId);
            setStage('inbox');
            setIsAutoConnecting(false);
            return;
          }
        }
      }

      // If no valid session, auto-generate new one
      const generateResponse = await fetch('/api/whatsapp/generate-qr', {
        method: 'POST',
      });

      if (generateResponse.ok) {
        const qrData = await generateResponse.json();
        setSessionId(qrData.sessionId);
        localStorage.setItem('whatsappSessionId', qrData.sessionId);
        
        // Auto-redirect to inbox after successful connection
        setTimeout(() => {
          setStage('inbox');
        }, 2000);
      }
    } catch (err) {
      console.error('Auto-connect failed:', err);
    } finally {
      setIsAutoConnecting(false);
    }
  };

  const handleQRGenerated = (id: string) => {
    setSessionId(id);
    localStorage.setItem('whatsappSessionId', id);
  };

  const handleScanComplete = () => {
    setStage('inbox');
  };

  const handleBackToScan = () => {
    setStage('scan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {isAutoConnecting ? (
          <motion.div
            className="flex items-center justify-center h-96"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-400 rounded-full mx-auto" />
              </motion.div>
              <p className="text-slate-300">Connecting to WhatsApp...</p>
            </div>
          </motion.div>
        ) : stage === 'scan' ? (
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
