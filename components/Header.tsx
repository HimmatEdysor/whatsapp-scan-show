import React from 'react';
import { MessageCircle, Zap, WifiOff } from 'lucide-react';

type HeaderProps = {
  connected?: boolean;
  phone?: string | null;
  apiBase?: string | null;
};

export default function Header({ connected = false, phone = null, apiBase = null }: HeaderProps) {
  return (
    <header className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold gradient-text">WhatsApp Hub</h1>
              <p className="text-sm text-slate-400 truncate">
                {apiBase ? `API: ${apiBase}` : 'Scan & Manage Messages'}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border shrink-0 ${
              connected
                ? 'bg-green-500/20 border-green-500/30'
                : 'bg-slate-500/20 border-slate-500/30'
            }`}
          >
            {connected ? (
              <Zap className="w-4 h-4 text-green-400 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-slate-400" />
            )}
            <span className={`text-sm font-medium ${connected ? 'text-green-300' : 'text-slate-300'}`}>
              {connected
                ? phone
                  ? `Connected · ${String(phone).split('@')[0]}`
                  : 'Connected'
                : 'Waiting for scan'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
