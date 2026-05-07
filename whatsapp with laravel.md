# WhatsApp (Wuz API) + Laravel Integration (Enterprise Guide)

This guide shows how to run **Wuz API + Postgres in Docker**, while **Laravel owns the UI + your internal API**. WhatsApp sessions and QR generation are handled by Wuz API (containerized). Laravel consumes Wuz API and stores messages/chats in **your app Postgres** via a **webhook**.

## Goals

- **Docker manages WhatsApp sessions** (Wuz API + its Postgres).
- **Laravel** serves:
  - the **UI** (QR screen + inbox)
  - an **internal API** that your UI calls
  - a **webhook endpoint** that receives WhatsApp events and persists to your DB.
- **Postgres** for both:
  - Wuz API DB (sessions/users, internal Wuz state)
  - Laravel app DB (enterprise data model, audit, reporting, multi-tenant, etc.)

## Architecture

### Services

- **wuzapi**: `asternic/wuzapi`
- **wuzapi-db**: Postgres for Wuz API
- **app**: your Laravel app
- **app-db**: Postgres for Laravel

### Data flow

1. Laravel calls Wuz API `/session/connect` + `/session/qr` to get a QR image.
2. User scans QR → Wuz API connects to WhatsApp.
3. Wuz API sends webhook events (Message, ReadReceipt, etc.) → Laravel webhook route.
4. Laravel stores events/messages into your app Postgres → UI reads from Laravel DB (fast, queryable).

## Docker Compose (recommended)

Put this `docker-compose.yml` in your **Laravel project** (adjust container names/ports as needed).

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: crm-app
    depends_on:
      - app-db
      - wuzapi
    environment:
      APP_ENV: local
      APP_DEBUG: "true"
      APP_URL: http://localhost:8000

      DB_CONNECTION: pgsql
      DB_HOST: app-db
      DB_PORT: 5432
      DB_DATABASE: crm
      DB_USERNAME: crm
      DB_PASSWORD: crm

      # Wuz API (internal docker network)
      WUZAPI_BASE_URL: http://wuzapi:8080
      WUZAPI_TOKEN: ${WUZAPI_TOKEN}

      # Simple shared secret for webhook verification
      WUZAPI_WEBHOOK_SECRET: ${WUZAPI_WEBHOOK_SECRET}
    ports:
      - "8000:8000"
    networks:
      - crm-net

  app-db:
    image: postgres:16
    container_name: crm-db
    environment:
      POSTGRES_DB: crm
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: crm
    volumes:
      - crm_db:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    networks:
      - crm-net

  wuzapi-db:
    image: postgres:16
    container_name: wuzapi-db
    environment:
      POSTGRES_DB: wuzapi
      POSTGRES_USER: wuzapi
      POSTGRES_PASSWORD: wuzapi
    volumes:
      - wuzapi_db:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - crm-net

  wuzapi:
    image: asternic/wuzapi:latest
    container_name: wuzapi
    depends_on:
      - wuzapi-db
    environment:
      DB_HOST: wuzapi-db
      DB_PORT: 5432
      DB_NAME: wuzapi
      DB_USER: wuzapi
      DB_PASSWORD: wuzapi

      # IMPORTANT: Fix these values (do NOT rely on auto-generated) or you lose encrypted data on restart
      WUZAPI_ADMIN_TOKEN: ${WUZAPI_ADMIN_TOKEN}
      WUZAPI_GLOBAL_ENCRYPTION_KEY: ${WUZAPI_GLOBAL_ENCRYPTION_KEY}
      WUZAPI_GLOBAL_HMAC_KEY: ${WUZAPI_GLOBAL_HMAC_KEY}
    ports:
      - "8080:8080"
    networks:
      - crm-net

networks:
  crm-net:
    driver: bridge

volumes:
  crm_db:
  wuzapi_db:
```

Create a project-root `.env` (for **docker compose**) with secure values:

```env
WUZAPI_ADMIN_TOKEN=change_me_admin_token
WUZAPI_GLOBAL_ENCRYPTION_KEY=change_me_32_chars_minimum________
WUZAPI_GLOBAL_HMAC_KEY=change_me_32_chars_minimum______________

# Token your Laravel app uses to call Wuz API (user token)
WUZAPI_TOKEN=change_me_user_token

# Webhook verification secret (checked by Laravel)
WUZAPI_WEBHOOK_SECRET=change_me_webhook_secret
```

Bring everything up:

```bash
docker compose up -d --build
```

## Wuz API Authentication (important)

Wuz API supports different headers on different endpoints. In practice:

- **Session/chat/user endpoints**: use `Token: <user_token>`
- **Admin endpoints**: use `Authorization: <admin_token>`

This repository’s Next.js integration uses `Token` for Wuz requests.

## One-time setup: create the Wuz API user token

Create a user in Wuz API with the same token you’ll put into Laravel `WUZAPI_TOKEN`.

```bash
curl -X POST "http://localhost:8080/admin/users" \
  -H "Authorization: ${WUZAPI_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"name":"crm","token":"'"${WUZAPI_TOKEN}"'","events":"Message,ReadReceipt"}'
```

Verify:

```bash
curl -s -H "Token: ${WUZAPI_TOKEN}" http://localhost:8080/session/status
```

## Webhook: Wuz API → Laravel

### Set webhook URL

Inside Docker, Wuz API can reach Laravel by service name `app`. Use:

`http://app:8000/api/webhooks/wuzapi?secret=<WUZAPI_WEBHOOK_SECRET>`

```bash
curl -X POST "http://localhost:8080/webhook" \
  -H "Token: ${WUZAPI_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"webhookURL":"http://app:8000/api/webhooks/wuzapi?secret='"${WUZAPI_WEBHOOK_SECRET}"'"}'
```

### Laravel webhook route

`routes/api.php`:

```php
use App\Http\Controllers\WuzWebhookController;

Route::post('/webhooks/wuzapi', [WuzWebhookController::class, 'handle']);
```

Controller (minimal; validate secret, then persist):

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WuzWebhookController extends Controller
{
    public function handle(Request $request)
    {
        if ($request->query('secret') !== env('WUZAPI_WEBHOOK_SECRET')) {
            return response()->json(['ok' => false], 401);
        }

        $payload = $request->all();

        // Persist to Postgres here (recommended: store raw_json + normalized fields)
        Log::info('Wuz webhook', $payload);

        return response()->json(['ok' => true]);
    }
}
```

## Laravel internal API (your UI calls this, NOT Wuz directly)

Recommended approach:

- Your UI calls Laravel endpoints (`/api/whatsapp/*`)
- Laravel calls Wuz API with the configured base url + token
- Laravel returns normalized data to UI
- Webhooks populate your DB; UI reads primarily from DB for speed and filtering.

### Config

`config/wuzapi.php`:

```php
<?php

return [
    'base_url' => env('WUZAPI_BASE_URL', 'http://wuzapi:8080'),
    'token' => env('WUZAPI_TOKEN'),
];
```

### Service wrapper

`app/Services/WuzApi.php`:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class WuzApi
{
    public static function req()
    {
        return Http::baseUrl(config('wuzapi.base_url'))
            ->withHeaders([
                'Token' => config('wuzapi.token'),
                'Content-Type' => 'application/json',
            ])
            ->acceptJson()
            ->timeout(20);
    }
}
```

### Endpoints you typically need

#### 1) Generate QR

Laravel flow:
- call `/session/connect`
- call `/session/qr`
- return QRCode base64 (Wuz returns `data:image/png;base64,...`)

```php
public function qr()
{
    \App\Services\WuzApi::req()->post('/session/connect', [
        'Subscribe' => ['Message'],
        'Immediate' => true,
    ]);

    return \App\Services\WuzApi::req()->get('/session/qr')->json();
}
```

#### 2) Poll status

```php
public function status()
{
    return \App\Services\WuzApi::req()->get('/session/status')->json();
}
```

#### 3) Contacts (chat list seed)

```php
public function contacts()
{
    return \App\Services\WuzApi::req()->get('/user/contacts')->json();
}
```

#### 4) Chat history (fallback / backfill)

```php
public function history(Request $request)
{
    $phone = $request->query('phone');
    abort_unless($phone, 422, 'phone is required');
    return \App\Services\WuzApi::req()->get('/chat/history', ['Phone' => $phone])->json();
}
```

#### 5) Send message

```php
public function send(Request $request)
{
    $data = $request->validate([
        'phone' => ['required','string'],
        'body' => ['required','string'],
    ]);

    return \App\Services\WuzApi::req()->post('/chat/send/text', [
        'Phone' => $data['phone'],
        'Body' => $data['body'],
    ])->json();
}
```

## Database model (Laravel Postgres) – recommended tables

Store **raw webhook payload** + normalized fields. This keeps you upgrade-safe as Wuz payloads evolve.

- `wa_accounts`
  - `id`, `tenant_id` (optional), `display_name`, `token_id` (reference), `connected_at`, `jid`
- `wa_chats`
  - `id`, `wa_account_id`, `chat_jid`/`phone`, `name`, `last_message_at`, `last_message_preview`
- `wa_messages`
  - `id`, `wa_account_id`, `wa_chat_id`, `message_id` (dedupe), `from_me` (bool), `from` (jid/phone), `to`, `body`, `timestamp`, `raw_json` (jsonb)
- `wa_webhook_events`
  - `id`, `wa_account_id`, `event_type`, `payload` (jsonb), `received_at`

Enterprise notes:
- Add a **unique index** on `(wa_account_id, message_id)` for deduping.
- Use `jsonb` for `raw_json`/`payload`.
- Use queue workers to process webhooks asynchronously.

## UI in Laravel (replace Next.js)

You have two choices:

### Option A: Laravel Blade / Livewire (fastest to implement)
- Blade page shows QR image returned by Laravel `/api/whatsapp/qr`
- Poll `/api/whatsapp/status` until connected
- Inbox reads from your DB and updates via polling or websockets (Reverb/Pusher)

### Option B: Laravel + Inertia (React/Vue)
- Keep the modern UI approach (React/Vue) but serve it from Laravel.
- Your UI makes calls to Laravel endpoints only.

Porting from this repo:
- The QR screen logic maps 1:1 to Laravel endpoint `POST /api/whatsapp/qr`.
- Inbox view should read from Laravel DB (preferred) + optional backfill via `/api/whatsapp/history`.

## API Reference (payloads + responses)

This section lists:
- **Laravel internal API**: what your UI calls
- **Wuz API**: what Laravel calls (Docker service)

### A) Laravel internal API (UI → Laravel)

These are recommended endpoints for an enterprise setup. Your UI should call **only Laravel** (never Wuz directly).

#### 1) Generate QR (and ensure session is connected)

- **POST** `/api/whatsapp/qr`
- **Headers**: `Accept: application/json`
- **Body**: empty

Example response (200):

```json
{
  "code": 200,
  "data": { "QRCode": "data:image/png;base64,..." },
  "success": true
}
```

#### 2) Status (poll until connected)

- **GET** `/api/whatsapp/status`
- **Body**: empty

Example response (200):

```json
{
  "code": 200,
  "data": {
    "connected": false,
    "loggedIn": false,
    "jid": "",
    "qrcode": ""
  },
  "success": true
}
```

#### 3) Contacts / chats

- **GET** `/api/whatsapp/contacts`
- **Body**: empty

Example response (200):

```json
{
  "code": 200,
  "data": [
    {
      "id": "911234567890@s.whatsapp.net",
      "name": "John"
    }
  ],
  "success": true
}
```

#### 4) Chat history (backfill/fallback)

- **GET** `/api/whatsapp/history?phone=<jid_or_phone>`
- **Body**: empty

Example response (200):

```json
{
  "code": 200,
  "data": [
    {
      "id": "MESSAGE_ID",
      "body": "Hello"
    }
  ],
  "success": true
}
```

#### 5) Send message

- **POST** `/api/whatsapp/send`
- **Headers**: `Content-Type: application/json`
- **Body**

```json
{ "phone": "911234567890", "body": "Hello" }
```

Example response (200):

```json
{ "code": 200, "data": { "Id": "..." }, "success": true }
```

#### 6) Webhook receiver (Wuz → Laravel)

- **POST** `/api/webhooks/wuzapi?secret=<WUZAPI_WEBHOOK_SECRET>`
- **Headers**: `Content-Type: application/json`
- **Body**: Wuz event payload (varies by event type)

Example response:

```json
{ "ok": true }
```

### B) Wuz API (Laravel → Wuz)

Base URL in Docker: `http://wuzapi:8080`  
Base URL on your host: `http://localhost:8080`

#### Authentication headers

- **Admin endpoints**: `Authorization: <WUZAPI_ADMIN_TOKEN>`
- **User/session endpoints**: `Token: <WUZAPI_TOKEN>`

> In practice, `/session/*`, `/chat/*`, `/user/*`, `/webhook` accept the `Token` header (user token). `/admin/*` requires `Authorization` (admin token).

#### 1) Create user (required once)

- **POST** `/admin/users`
- **Headers**:
  - `Authorization: <WUZAPI_ADMIN_TOKEN>`
  - `Content-Type: application/json`
- **Body**

```json
{
  "name": "crm",
  "token": "your_user_token_here",
  "webhook": "",
  "events": "Message,ReadReceipt"
}
```

Example response (201):

```json
{
  "code": 201,
  "data": {
    "id": "c8bbb077cc5a4a0e13c4563d969fc02b",
    "name": "crm",
    "token": "your_user_token_here",
    "events": "Message"
  },
  "success": true
}
```

#### 2) Connect session (start WhatsApp connection)

- **POST** `/session/connect`
- **Headers**:
  - `Token: <WUZAPI_TOKEN>`
  - `Content-Type: application/json`
- **Body**

```json
{ "Subscribe": ["Message"], "Immediate": true }
```

Example response (200):

```json
{
  "code": 200,
  "data": { "details": "Connected!", "events": "Message", "jid": "", "webhook": "" },
  "success": true
}
```

#### 3) Get QR code (image data URL)

- **GET** `/session/qr`
- **Headers**: `Token: <WUZAPI_TOKEN>`

Example response (200):

```json
{
  "code": 200,
  "data": { "QRCode": "data:image/png;base64,..." },
  "success": true
}
```

#### 4) Session status (poll)

- **GET** `/session/status`
- **Headers**: `Token: <WUZAPI_TOKEN>`

Example response (200):

```json
{
  "code": 200,
  "data": {
    "connected": false,
    "loggedIn": false,
    "jid": "",
    "qrcode": ""
  },
  "success": true
}
```

#### 5) Contacts

- **GET** `/user/contacts`
- **Headers**: `Token: <WUZAPI_TOKEN>`

Example response (200; shape varies by Wuz version):

```json
{ "code": 200, "data": [ /* contacts */ ], "success": true }
```

#### 6) Chat history

- **GET** `/chat/history?Phone=<jid_or_phone>`
- **Headers**: `Token: <WUZAPI_TOKEN>`

Example response (200):

```json
{ "code": 200, "data": [ /* messages */ ], "success": true }
```

#### 7) Send text

- **POST** `/chat/send/text`
- **Headers**:
  - `Token: <WUZAPI_TOKEN>`
  - `Content-Type: application/json`
- **Body**

```json
{ "Phone": "911234567890", "Body": "Hello" }
```

Example response (200):

```json
{ "code": 200, "data": { "Id": "..." }, "success": true }
```

#### 8) Configure webhook (Wuz → Laravel)

- **POST** `/webhook`
- **Headers**:
  - `Token: <WUZAPI_TOKEN>`
  - `Content-Type: application/json`
- **Body**

```json
{ "webhookURL": "http://app:8000/api/webhooks/wuzapi?secret=YOUR_SECRET" }
```

Example response (200):

```json
{ "code": 200, "data": { "webhookURL": "..." }, "success": true }
```

## Production / enterprise checklist

- **Secrets**: store tokens in a secrets manager (do not commit `.env`).
- **HTTPS**: terminate TLS at your reverse proxy (Nginx/Traefik) for Laravel and Wuz API.
- **Webhook security**: verify a secret; optionally whitelist Wuz API IP / internal network only.
- **Queue**: process webhooks using Laravel queue (Redis recommended).
- **Observability**: log webhook failures + retry policy; add metrics.
- **Backfill**: if webhook downtime happens, backfill chat history using `/chat/history`.
- **Multi-tenant**: run one Wuz API per tenant or use a token-per-tenant approach and map token → tenant in Laravel.

## Quick troubleshooting

- `401 unauthorized` from Wuz API:
  - create the user via `/admin/users`
  - ensure you send `Token: <user_token>` on session/chat endpoints
- QR is empty:
  - call `/session/connect` first, then `/session/qr`
  - wait a second and retry if needed (QR sometimes appears shortly after connect)
- Webhook not received:
  - ensure webhook URL points to `http://app:8000/...` (docker internal)
  - check Laravel route is reachable from inside the network

  