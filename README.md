# WhatsApp Scan & Show - Modern Web UI

A beautiful, modern web application for scanning WhatsApp QR codes and displaying messages in real-time. Built with Next.js, React, Tailwind CSS, and Framer Motion.

## Features

✨ **Beautiful UI**
- Modern glassmorphism design with smooth animations
- Responsive layout that works on all devices
- Real-time message updates with smooth transitions
- Dark mode with gradient accents

🔄 **Core Functionality**
- QR code generation and scanning
- Real-time chat inbox view
- Message display with sender avatars
- Search chats functionality
- Unread message badges
- Send/receive message simulation
- Active status indicators

🚀 **Performance**
- Optimized animations with Framer Motion
- Lazy loading of messages
- Efficient state management
- Fast initial page load

## Tech Stack

- **Frontend Framework:** Next.js 14
- **UI Library:** React 18
- **Styling:** Tailwind CSS + PostCSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **QR Code:** qrcode.react
- **Language:** TypeScript

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whatsapp-scan-show.git
cd whatsapp-scan-show
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_WUZ_API_BASE_URL=https://wuzapi.guaranteeadmit.com
WUZ_API_KEY=your_api_key_here
```

## Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
whatsapp-scan-show/
├── pages/
│   ├── index.tsx           # Main page
│   └── api/
│       └── whatsapp/
│           ├── generate-qr.ts
│           ├── session-status/[sessionId].ts
│           └── messages/[chatId].ts
├── components/
│   ├── Header.tsx          # App header
│   ├── QRCode.tsx          # QR scan view
│   ├── InboxView.tsx       # Main chat inbox
│   ├── ChatList.tsx        # Sidebar chat list
│   └── MessageBubble.tsx   # Individual message
├── styles/
│   └── globals.css         # Global styles and animations
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## Features in Detail

### QR Code Scanning
- Click "Generate QR Code" button
- Displays animated QR code with pulsing glow
- Real-time status updates
- Auto-redirects to inbox on successful scan

### Chat Interface
- Left sidebar with chat list
- Searchable chat history
- Unread message badges
- Active status indicators
- Real-time message updates

### Message View
- Smooth message animations
- Sender avatars and timestamps
- Different styling for own vs. received messages
- Message input with send button
- Attachment button

## API Integration

The application provides API endpoints for:

### Generate QR Code
```
POST /api/whatsapp/generate-qr
Response: { sessionId, qrCode }
```

### Check Session Status
```
GET /api/whatsapp/session-status/[sessionId]
Response: { sessionId, isConnected, status }
```

### Fetch Messages
```
GET /api/whatsapp/messages/[chatId]
Response: { messages: [] }
```

## Customization

### Colors
Edit `tailwind.config.ts` to customize the green WhatsApp color scheme or other colors.

### Animations
Adjust animation timings in component files or `styles/globals.css`.

### Messages
Replace mock data in components with real API calls to your backend.

## Environment Variables

- `NEXT_PUBLIC_WUZ_API_BASE_URL` - Wuz API base URL
- `WUZ_API_KEY` - API authentication key

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
