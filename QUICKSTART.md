# Quick Start Guide

Get the WhatsApp Scan & Show application running in minutes!

## Prerequisites

- Node.js 16+ and npm
- Git (for cloning)
- Docker (optional, for containerized deployment)

## Option 1: Quick Setup (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/whatsapp-scan-show.git
cd whatsapp-scan-show
```

### Step 2: Run Setup Script

```bash
# Make script executable (if needed)
chmod +x setup.sh

# Run setup
./setup.sh
```

The setup script will:
- ✅ Check Node.js and npm installation
- ✅ Install dependencies
- ✅ Create and configure .env.local
- ✅ Build the application
- ✅ Verify everything is working

### Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Option 2: Manual Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/whatsapp-scan-show.git
cd whatsapp-scan-show
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit with your settings
nano .env.local
```

Update these values:
```env
NEXT_PUBLIC_WUZ_API_BASE_URL=https://wuzapi.guaranteeadmit.com
WUZ_API_KEY=your_api_key_here
```

### Step 4: Build Application

```bash
npm run build
```

### Step 5: Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Option 3: Docker Setup

### Step 1: Build Docker Image

```bash
npm run docker:build
```

### Step 2: Start Container

```bash
# With environment variables in .env.local
npm run docker:up
```

Or manually:
```bash
docker-compose up -d
```

### Step 3: View Logs

```bash
npm run docker:logs
```

### Step 4: Stop Container

```bash
npm run docker:down
```

## First Time Using the App?

1. **Open the application**
   - Go to [http://localhost:3000](http://localhost:3000)
   - You'll see the scan page

2. **Generate QR Code**
   - Click "Generate QR Code" button
   - A pulsing QR code will appear

3. **Scan with Phone**
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices
   - Use your phone camera to scan the QR code

4. **View Inbox**
   - After scanning, the page will auto-redirect
   - You'll see your WhatsApp chats

5. **Send Messages**
   - Click on any chat
   - Type and send messages directly

## Available Commands

```bash
# Development
npm run dev              # Start dev server (hot reload)

# Production
npm run build            # Build for production
npm start                # Start production server

# Testing & Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
npm test                 # Run tests
npm test:watch          # Run tests in watch mode
npm test:coverage       # Generate coverage report

# Formatting
npm run format           # Format code with Prettier

# Docker
npm run docker:build     # Build Docker image
npm run docker:up        # Start Docker container
npm run docker:down      # Stop Docker container
npm run docker:logs      # View container logs
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
sudo lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### API Connection Error

1. **Check Wuz API is running**
   ```bash
   curl https://wuzapi.guaranteeadmit.com/health
   ```

2. **Verify API key in .env.local**
   ```bash
   grep WUZ_API_KEY .env.local
   ```

3. **Check API URL**
   ```bash
   grep WUZ_API_BASE_URL .env.local
   ```

### Build Fails

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Docker Issues

```bash
# Remove old containers/images
docker-compose down --rmi all

# Rebuild
npm run docker:build

# Start fresh
npm run docker:up
```

## Project Structure

```
whatsapp-scan-show/
├── pages/                  # Next.js pages and API routes
│   ├── index.tsx          # Main page
│   ├── _app.tsx           # App wrapper
│   ├── _document.tsx      # HTML document
│   └── api/               # API endpoints
├── components/            # React components
│   ├── Header.tsx         # Top header
│   ├── QRCode.tsx         # QR scanning view
│   ├── InboxView.tsx      # Chat inbox
│   ├── ChatList.tsx       # Chat sidebar
│   ├── MessageBubble.tsx  # Message display
│   └── Skeleton.tsx       # Loading skeletons
├── styles/
│   └── globals.css        # Global styles
├── lib/                   # Utility functions
│   ├── wuzApi.ts         # Wuz API wrapper
│   └── useInbox.ts       # Custom hook
├── types/                 # TypeScript types
│   └── index.ts          # Type definitions
├── public/                # Static assets
├── .env.local.example     # Environment template
├── tailwind.config.ts     # Tailwind config
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WUZ_API_BASE_URL` | Yes | Wuz API endpoint URL |
| `WUZ_API_KEY` | Yes | API authentication key |
| `NODE_ENV` | No | Set to `production` for build |

## Next Steps

- 📖 Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- 🧪 Check [TESTING.md](./TESTING.md) for testing setup
- 💻 Review components in `components/` for customization
- 🎨 Modify colors in `tailwind.config.ts`

## Support

- 🐛 Found a bug? Open an issue on GitHub
- 💡 Have a feature idea? Create a discussion
- 📧 Email: support@example.com

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [WhatsApp Web API (Wuz)](https://github.com/asternic/wuzapi)

---

**Happy coding! 🚀**
