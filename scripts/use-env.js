#!/usr/bin/env node
/**
 * Switch .env.local between local Wuz (:8082) and live host.
 * Usage: node scripts/use-env.js local|live
 */
const fs = require('fs');
const path = require('path');

const mode = (process.argv[2] || '').toLowerCase();
const root = path.join(__dirname, '..');
const target = path.join(root, '.env.local');

const LOCAL = `# Local Wuz API (recommended for QR)
WUZAPI_BASE_URL=http://127.0.0.1:8082
WUZAPI_TOKEN=himmat6376721036
WUZAPI_ADMIN_TOKEN=admin_himmat6376721036
NEXT_PUBLIC_WUZ_API_BASE_URL=http://127.0.0.1:8082
WUZ_API_KEY=himmat6376721036
`;

const LIVE = `# Live Wuz API host
# NOTE: if QR never appears, live Wuz is outdated — use npm run dev:local
WUZAPI_BASE_URL=https://whatsapp.guaranteeadmit.com
WUZAPI_TOKEN=himmat6376721036
WUZAPI_ADMIN_TOKEN=admin_himmat6376721036
NEXT_PUBLIC_WUZ_API_BASE_URL=https://whatsapp.guaranteeadmit.com
WUZ_API_KEY=himmat6376721036
`;

if (mode !== 'local' && mode !== 'live') {
  console.error('Usage: node scripts/use-env.js local|live');
  process.exit(1);
}

fs.writeFileSync(target, mode === 'live' ? LIVE : LOCAL);
console.log(`Wrote .env.local for ${mode} mode`);
console.log(mode === 'live' ? LIVE : LOCAL);
