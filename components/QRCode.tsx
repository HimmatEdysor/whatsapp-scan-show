'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    generateQR();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, []);

  const clearTimers = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (refreshRef.current) {
      clearInterval(refreshRef.current);
      refreshRef.current = null;
    }
  };

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
      if (data.baseUrl) setBaseUrl(data.baseUrl);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      setSessionId(data.sessionId);

      if (data.isConnected || data.loggedIn) {
        scannedRef.current = true;
        onQRGenerated(data.sessionId);
        setStatus('scanned');
        setTimeout(() => onScanComplete(), 500);
        return;
      }

      if (!data.qrCode) {
        setStatus('idle');
        setError(
          data.message ||
            'QR not available. Check WUZAPI_BASE_URL + WUZAPI_TOKEN in .env.local, then restart npm run dev.',
        );
        return;
      }

      setQrCode(data.qrCode);
      onQRGenerated(data.sessionId);
      setStatus('waiting');
      pollForScanCompletion(data.sessionId);

      // WhatsApp QR rotates — refresh every 25s while waiting
      if (refreshRef.current) clearInterval(refreshRef.current);
      refreshRef.current = setInterval(() => {
        if (!scannedRef.current) {
          generateQR();
        }
      }, 25000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const pollForScanCompletion = (sid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/session-status/${sid}`);
        const data = await response.json();

        if (data.isConnected) {
          scannedRef.current = true;
          setStatus('scanned');
          clearTimers();
          setTimeout(() => {
            onScanComplete();
          }, 1000);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000);

    // Stop polling after 3 minutes
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 180000);
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
              Scan the QR with your phone. Status updates live when the device links.
            </p>
            {baseUrl && (
              <p className="text-xs text-slate-500 mt-2 break-all">API: {baseUrl}</p>
            )}
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { step: 1, text: 'Open WhatsApp on your phone' },
              { step: 2, text: 'Go to Settings → Linked Devices' },
              { step: 3, text: 'Tap Link a Device' },
              { step: 4, text: 'Scan the QR code on the right' },
              { step: 5, text: 'Wait — inbox loads automatically' },
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
                <p className="text-amber-200/80 text-xs leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

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
                  <div className="text-xs text-slate-400 max-w-sm mx-auto">{error}</div>
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
              <motion.div
                className="p-6 glass rounded-3xl"
                variants={status === 'waiting' ? pulseVariants : {}}
                animate={status === 'waiting' ? 'animate' : undefined}
              >
                <div className="p-4 bg-white rounded-2xl">
                  {qrCode.startsWith('data:image') || qrCode.startsWith('iVBOR') || qrCode.startsWith('/9j/') ? (
                    <img
                      src={
                        qrCode.startsWith('data:image')
                          ? qrCode
                          : `data:image/${qrCode.startsWith('/9j/') ? 'jpeg' : 'png'};base64,${qrCode}`
                      }
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

              <button
                onClick={generateQR}
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh QR Code
              </button>

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
