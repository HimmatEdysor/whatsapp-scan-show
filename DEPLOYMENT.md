# Deployment Guide

This guide will help you deploy the WhatsApp Scan & Show application to production.

## Prerequisites

- Node.js 16+ and npm
- A server running Ubuntu 20.04 LTS or later
- Docker and Docker Compose installed
- SSL certificate (from Let's Encrypt)

## Option 1: Deploy on Ubuntu with PM2

### Step 1: Prepare the Server

```bash
# SSH into your server
ssh ubuntu@YOUR_SERVER_IP

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### Step 2: Clone and Setup

```bash
# Create app directory
sudo mkdir -p /opt/whatsapp-app
cd /opt/whatsapp-app

# Clone repository
sudo git clone https://github.com/yourusername/whatsapp-scan-show.git .

# Install dependencies
sudo npm install

# Create .env.local
sudo nano .env.local
# Add your environment variables

# Build the application
sudo npm run build
```

### Step 3: Start with PM2

```bash
# Start the application
sudo pm2 start npm --name "whatsapp-app" -- start

# Save PM2 startup script
sudo pm2 startup
sudo pm2 save

# Verify it's running
sudo pm2 status
```

### Step 4: Setup Nginx Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/whatsapp-app

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/whatsapp-app \
         /etc/nginx/sites-enabled/whatsapp-app

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 5: Get SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot certonly --nginx -d your-domain.com \
  --non-interactive --agree-tos --email your-email@example.com
```

## Option 2: Deploy with Docker

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  whatsapp-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_WUZ_API_BASE_URL=${WUZ_API_BASE_URL}
      - WUZ_API_KEY=${WUZ_API_KEY}
    restart: unless-stopped
```

### Step 3: Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f whatsapp-app

# Stop
docker-compose down
```

## Monitoring and Maintenance

### Check Application Status

```bash
# Using PM2
pm2 status

# Using Docker
docker-compose ps
```

### View Logs

```bash
# PM2 logs
pm2 logs whatsapp-app

# Docker logs
docker-compose logs -f whatsapp-app
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart whatsapp-app

# Or restart with Docker
docker-compose down && docker-compose up -d
```

## Performance Optimization

1. **Enable Gzip Compression** in Nginx
2. **Use CDN** for static assets
3. **Enable caching** headers for images and styles
4. **Monitor** with PM2 Plus or other monitoring tools
5. **Use load balancer** for scaling across multiple servers

## Security Best Practices

1. Keep `.env.local` secrets secure
2. Use HTTPS only
3. Enable firewall rules
4. Regular security updates
5. Monitor logs for unusual activity
6. Use strong API keys

## Troubleshooting

### Application won't start

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Check error logs
pm2 logs whatsapp-app
```

### Connection to Wuz API fails

```bash
# Verify environment variables
echo $WUZ_API_BASE_URL

# Test API connectivity
curl https://wuzapi.guaranteeadmit.com/health
```

### SSL certificate issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```
