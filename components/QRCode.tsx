'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode.react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface QRCodeComponentProps {
  onQRGenerated: (sessionId: string) => void;
  onScanComplete: () => void;
}

export default function QRCodeComponent({ onQRGenerated, onScanComplete }: QRCodeComponentProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'scanned'>('idle');
  const [error, setError] = useState<string | null>(null);

  const generateQR = async () => {
    setIsGenerating(true);
    setStatus('generating');
    setError(null);

    try {
      // Simulate API call to Wuz API
      const response = await fetch('/api/whatsapp/generate-qr', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setQrCode(data.qrCode);
      onQRGenerated(data.sessionId);
      setStatus('waiting');

      // Simulate polling for scan completion
      pollForScanCompletion(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const pollForScanCompletion = (sid: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/session-status/${sid}`);
        const data = await response.json();

        if (data.isConnected) {
          setStatus('scanned');
          clearInterval(interval);
          setTimeout(() => {
            onScanComplete();
          }, 1500);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1000);

    // Clear interval after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const pulseVariants = {
    animate: {
      boxShadow: [
        '0 0 20px rgba(34, 197, 94, 0.3)',
        '0 0 40px rgba(34, 197, 94, 0.6)',
        '0 0 20px rgba(34, 197, 94, 0.3)',
      ],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Instructions */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Connect Your WhatsApp</span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Scan the QR code with your phone to link your WhatsApp account. Your messages will appear instantly.
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { step: 1, text: 'Click Generate QR button' },
              { step: 2, text: 'Open WhatsApp on your phone' },
              { step: 3, text: 'Settings → Linked Devices' },
              { step: 4, text: 'Scan the QR code' },
              { step: 5, text: 'View your chats instantly' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{item.step}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-300">{item.text}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {error && (
            <motion.div
              className="flex gap-3 p-4 bg-red-500/20 border border-red-500/40 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-200 text-sm">{error}</span>
            </motion.div>
          )}
        </div>

        {/* Right Side - QR Code */}
        <motion.div
          className="flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {!qrCode ? (
            <motion.button
              onClick={generateQR}
              disabled={isGenerating}
              className="group relative px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate QR Code
                  </>
                )}
              </span>
            </motion.button>
          ) : (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* QR Code Container */}
              <motion.div
                className="p-6 glass rounded-3xl"
                variants={status === 'waiting' ? pulseVariants : {}}
                animate={status === 'waiting' ? 'animate' : undefined}
              >
                <div className="p-4 bg-white rounded-2xl">
                  <QRCode
                    value={qrCode}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </motion.div>

              {/* Status Indicator */}
              <div className="space-y-3">
                {status === 'waiting' && (
                  <motion.div
                    className="text-center space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-6 h-6 text-green-400" />
                      </motion.div>
                    </div>
                    <p className="text-slate-300">Waiting for scan...</p>
                  </motion.div>
                )}

                {status === 'scanned' && (
                  <motion.div
                    className="text-center space-y-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      className="flex justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    >
                      <Check className="w-8 h-8 text-green-400" />
                    </motion.div>
                    <p className="text-green-300 font-semibold">Connected! Loading inbox...</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
