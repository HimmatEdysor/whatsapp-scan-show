# CRM Integration Guide

This guide explains how to integrate the WhatsApp Scan & Show application with your Laravel CRM.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
├──────────────────────────────────────────┬──────────────────┤
│   WhatsApp Scan & Show (Next.js)         │  Laravel CRM     │
│   - QR Code Generation                   │  - User Dashboard│
│   - Chat Display                         │  - Contact Mgmt  │
│   - Message Management                   │  - Task Tracking │
├──────────────────────────────────────────┴──────────────────┤
│                    Wuz API Server                            │
│        (WhatsApp Web Connection & Message Relay)            │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. QR Code Generation & Session Management

The WhatsApp Scan & Show app manages QR code generation through the Wuz API.

**Flow:**
1. User visits `/my-whatsapp` in CRM
2. CRM redirects to WhatsApp Scan & Show UI
3. User clicks "Generate QR Code"
4. Session is created in Wuz API
5. QR code is generated and displayed
6. Session ID is tracked in database

### 2. Webhook Integration

Wuz API sends incoming messages to your CRM via webhooks.

**Configuration in CRM .env:**
```env
WUZ_API_BASE_URL=https://wuzapi.guaranteeadmit.com
WUZ_API_KEY=your_user_token
WEBHOOK_URL=https://guaranteeadmit.com/api/whatsapp-web/incoming
```

**Webhook Payload Example:**
```json
{
  "type": "message",
  "sessionId": "session_123",
  "chatId": "1234567890@c.us",
  "sender": "919876543210@c.us",
  "message": {
    "id": "msg_123",
    "body": "Hello!",
    "timestamp": 1693456789,
    "type": "text"
  },
  "contact": {
    "name": "John Doe",
    "number": "919876543210"
  }
}
```

### 3. Database Schema

In your CRM, create tables for WhatsApp data:

```sql
-- Sessions table
CREATE TABLE whatsapp_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    qr_code TEXT,
    status ENUM('pending', 'connected', 'expired', 'disconnected'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Chats table
CREATE TABLE whatsapp_chats (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_number VARCHAR(20),
    last_message TEXT,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id)
);

-- Messages table
CREATE TABLE whatsapp_messages (
    id VARCHAR(255) PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL,
    sender VARCHAR(20),
    sender_name VARCHAR(255),
    message_body TEXT,
    message_type ENUM('text', 'image', 'video', 'audio', 'document'),
    is_own BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES whatsapp_chats(id)
);

-- Contacts table
CREATE TABLE whatsapp_contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    contact_name VARCHAR(255),
    avatar_url VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id)
);
```

### 4. Laravel Controller Setup

Create a WhatsApp controller in your CRM:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WhatsappSession;
use App\Models\WhatsappChat;
use App\Models\WhatsappMessage;
use Illuminate\Support\Facades\Http;

class WhatsappController extends Controller
{
    protected $wuzApiUrl;
    protected $wuzApiKey;

    public function __construct()
    {
        $this->wuzApiUrl = config('envvariables.WUZ_API_BASE_URL');
        $this->wuzApiKey = config('envvariables.WUZ_API_KEY');
    }

    /**
     * Show WhatsApp interface
     */
    public function show()
    {
        return view('whatsapp.show');
    }

    /**
     * Handle incoming webhooks from Wuz API
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();

        try {
            switch ($payload['type'] ?? null) {
                case 'message':
                    $this->handleMessage($payload);
                    break;
                case 'status':
                    $this->handleStatus($payload);
                    break;
                case 'connection':
                    $this->handleConnection($payload);
                    break;
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Log::error('WhatsApp Webhook Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Handle incoming messages
     */
    protected function handleMessage($payload)
    {
        $chat = WhatsappChat::firstOrCreate(
            [
                'id' => $payload['chatId'],
                'session_id' => $payload['sessionId'],
            ],
            [
                'contact_name' => $payload['contact']['name'] ?? 'Unknown',
                'contact_number' => $payload['contact']['number'] ?? null,
            ]
        );

        WhatsappMessage::create([
            'id' => $payload['message']['id'],
            'chat_id' => $chat->id,
            'sender' => $payload['sender'],
            'sender_name' => $payload['contact']['name'] ?? 'Unknown',
            'message_body' => $payload['message']['body'],
            'message_type' => $payload['message']['type'] ?? 'text',
            'is_own' => false,
        ]);

        // Trigger any business logic
        event(new \App\Events\WhatsappMessageReceived($chat, $payload['message']));
    }

    /**
     * Handle connection status updates
     */
    protected function handleConnection($payload)
    {
        $session = WhatsappSession::find($payload['sessionId']);
        if ($session) {
            $session->update([
                'status' => $payload['status'] ?? 'connected',
            ]);
        }
    }

    /**
     * Get user's active session
     */
    public function getSession(Request $request)
    {
        $session = auth()->user()
            ->whatsappSessions()
            ->where('status', 'connected')
            ->latest()
            ->first();

        return response()->json($session);
    }

    /**
     * List all chats for user
     */
    public function getChats(Request $request)
    {
        $session = auth()->user()
            ->whatsappSessions()
            ->where('status', 'connected')
            ->latest()
            ->first();

        if (!$session) {
            return response()->json(['error' => 'No active session'], 404);
        }

        $chats = $session->chats()
            ->with('messages')
            ->latest('last_message_at')
            ->get();

        return response()->json($chats);
    }

    /**
     * Get messages for a chat
     */
    public function getMessages($chatId)
    {
        $chat = WhatsappChat::with('messages')
            ->findOrFail($chatId);

        return response()->json($chat->messages()->latest()->get());
    }

    /**
     * Send a message
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'chat_id' => 'required|string',
            'message' => 'required|string',
        ]);

        $session = auth()->user()
            ->whatsappSessions()
            ->where('status', 'connected')
            ->latest()
            ->first();

        if (!$session) {
            return response()->json(['error' => 'No active session'], 404);
        }

        try {
            // Send via Wuz API
            $response = Http::withToken($this->wuzApiKey)
                ->post("{$this->wuzApiUrl}/sessions/{$session->id}/messages", [
                    'chatId' => $request->chat_id,
                    'message' => $request->message,
                ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to send message');
            }

            // Store in database
            WhatsappMessage::create([
                'id' => $response->json('messageId'),
                'chat_id' => $request->chat_id,
                'sender' => auth()->user()->phone,
                'sender_name' => auth()->user()->name,
                'message_body' => $request->message,
                'message_type' => 'text',
                'is_own' => true,
            ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
```

### 5. Routes Configuration

Add to `routes/api.php`:

```php
Route::middleware('auth:api')->group(function () {
    Route::prefix('whatsapp-web')->group(function () {
        // WhatsApp endpoints
        Route::get('/session', [WhatsappController::class, 'getSession']);
        Route::get('/chats', [WhatsappController::class, 'getChats']);
        Route::get('/messages/{chatId}', [WhatsappController::class, 'getMessages']);
        Route::post('/messages/send', [WhatsappController::class, 'sendMessage']);
        
        // Webhook (no auth required)
        Route::post('/incoming', [WhatsappController::class, 'webhook'])->withoutMiddleware('auth:api');
    });
});
```

### 6. View Integration

In your CRM Blade template (`resources/views/whatsapp/show.blade.php`):

```blade
@extends('layouts.app')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h1>WhatsApp Messages</h1>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <!-- Embed WhatsApp Scan & Show in iframe -->
            <iframe 
                src="{{ env('WHATSAPP_APP_URL', 'http://localhost:3000') }}" 
                width="100%" 
                height="600px"
                frameborder="0"
                allowfullscreen>
            </iframe>
        </div>
    </div>
</div>
@endsection
```

Or create a separate modal/popup:

```blade
<div id="whatsapp-modal" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">WhatsApp</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <iframe 
                    id="whatsapp-frame"
                    src="" 
                    width="100%" 
                    height="600px"
                    frameborder="0">
                </iframe>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('open-whatsapp-btn').addEventListener('click', function() {
    document.getElementById('whatsapp-frame').src = '{{ env("WHATSAPP_APP_URL") }}';
    new bootstrap.Modal(document.getElementById('whatsapp-modal')).show();
});
</script>
```

## Environment Variables

In your CRM `.env`:

```env
# WhatsApp Configuration
WHATSAPP_APP_URL=http://localhost:3000
WUZ_API_BASE_URL=https://wuzapi.guaranteeadmit.com
WUZ_API_KEY=user_token_from_wuz_dashboard
WUZ_WEBHOOK_SECRET=your_webhook_secret
```

## Testing Integration

```bash
# Test webhook
curl -X POST https://guaranteeadmit.com/api/whatsapp-web/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "sessionId": "test_123",
    "chatId": "1234567890@c.us",
    "sender": "919876543210@c.us",
    "message": {
      "id": "msg_123",
      "body": "Test message",
      "timestamp": 1693456789,
      "type": "text"
    },
    "contact": {
      "name": "John Doe",
      "number": "919876543210"
    }
  }'
```

## Troubleshooting

### Webhook not receiving messages

1. Check Wuz API webhook configuration:
   ```
   WUZAPI_GLOBAL_WEBHOOK=https://guaranteeadmit.com/api/whatsapp-web/incoming
   ```

2. Verify CRM can receive POST requests:
   ```bash
   curl -X POST https://guaranteeadmit.com/api/whatsapp-web/incoming \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

3. Check CRM logs:
   ```bash
   tail -f storage/logs/laravel.log | grep WhatsApp
   ```

### Messages not appearing

1. Check database entries:
   ```sql
   SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 10;
   ```

2. Verify session is connected:
   ```sql
   SELECT * FROM whatsapp_sessions WHERE status = 'connected';
   ```

### API connection fails

1. Test Wuz API health:
   ```bash
   curl https://wuzapi.guaranteeadmit.com/health
   ```

2. Verify API key is correct:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
     https://wuzapi.guaranteeadmit.com/sessions
   ```

## Support

For issues, check:
- Wuz API logs
- CRM laravel.log
- Browser console for frontend errors
- Database for data persistence
