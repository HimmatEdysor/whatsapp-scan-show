'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface QRCodeComponentProps {
  onQRGenerated: (sessionId: string) => void;
  onScanComplete: () => void;
}

export default function QRCodeComponent({ onQRGenerated, onScanComplete }: QRCodeComponentProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'scanned'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Auto-generate QR on component mount
  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    setIsGenerating(true);
    setStatus('generating');
    setError(null);
    setQrCode(null);

    try {
      const response = await fetch('/api/whatsapp/generate-qr', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      setSessionId(data.sessionId);

      // If connected, move directly.
      if (data.isConnected) {
        onQRGenerated(data.sessionId);
        setStatus('scanned');
        setTimeout(() => onScanComplete(), 500);
        return;
      }

      // If no QR returned, stop spinner and show a clear message.
      // This happens when Wuz API is not running / not reachable / misconfigured.
      if (!data.qrCode) {
        setStatus('idle');
        setError(
          'QR not available. Start Wuz API and set WUZAPI_BASE_URL + WUZAPI_TOKEN in .env.local (then restart npm run dev).',
        );
        return;
      }

      setQrCode(data.qrCode);
      onQRGenerated(data.sessionId);
      setStatus('waiting');
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
    }, 2000);

    // Clear interval after 2 minutes (QR codes typically expire)
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
              Use one of the methods below to connect WhatsApp in CRM.
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { step: 1, text: 'Open WhatsApp Web in browser' },
              { step: 2, text: 'On phone: WhatsApp → Linked Devices' },
              { step: 3, text: 'Tap Link a Device' },
              { step: 4, text: 'Scan WhatsApp Web QR on web.whatsapp.com' },
              { step: 5, text: 'Return to CRM and click Continue' },
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
              className="flex gap-3 p-4 bg-amber-500/15 border border-amber-500/30 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-amber-100 text-sm font-medium">QR not available yet</p>
                <p className="text-amber-200/80 text-xs leading-relaxed">
                  {error}
                </p>
                <p className="text-amber-200/70 text-xs">
                  Start Wuz API and set <code className="text-amber-100">WUZAPI_BASE_URL</code> + <code className="text-amber-100">WUZAPI_TOKEN</code> in <code className="text-amber-100">.env.local</code>, then restart <code className="text-amber-100">npm run dev</code>.
                </p>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <a
              href="https://web.whatsapp.com/"
              target="_blank"
              rel="noreferrer"
              className="block text-center px-4 py-3 rounded-xl bg-green-500 text-white font-semibold"
            >
              Open WhatsApp Web
            </a>
            <button
              onClick={() => {
                if (!sessionId) return;
                onQRGenerated(sessionId);
                onScanComplete();
              }}
              disabled={!sessionId}
              className="w-full text-center px-4 py-3 rounded-xl bg-white/10 text-white font-semibold disabled:opacity-50"
            >
              Continue in CRM
            </button>
          </div>
        </div>

        {/* Right Side - QR Code */}
        <motion.div
          className="flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {!qrCode ? (
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <Loader2 className={`w-16 h-16 ${isGenerating ? 'text-green-400' : 'text-slate-600'}`} />
              </motion.div>
              <p className="text-slate-300 text-lg">
                {isGenerating ? 'Generating QR Code...' : error ? 'QR not available' : 'Connecting to WhatsApp...'}
              </p>
              {error && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 max-w-sm mx-auto">
                    {error}
                  </div>
                  <button
                    onClick={generateQR}
                    className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}
            </motion.div>
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
                  {/* Display QR from Wuz API (base64 image) */}
                  {qrCode.startsWith('data:image') || qrCode.startsWith('iVBOR') ? (
                    <img
                      src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
                      alt="WhatsApp QR Code"
                      width={256}
                      height={256}
                      className="block"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center text-slate-600 text-sm text-center p-4">
                      QR Code data: {qrCode.substring(0, 50)}...
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Refresh QR Button */}
              <button
                onClick={generateQR}
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh QR Code
              </button>

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
