#!/bin/bash

# WhatsApp Scan & Show - Setup Script

echo "🚀 WhatsApp Scan & Show - Initial Setup"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm --version) found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    
    # Prompt for configuration
    echo ""
    echo "⚙️  Please configure your environment:"
    echo ""
    read -p "Enter Wuz API Base URL (default: https://wuzapi.guaranteeadmit.com): " WUZ_API_URL
    WUZ_API_URL=${WUZ_API_URL:-https://wuzapi.guaranteeadmit.com}
    
    read -p "Enter Wuz API Key: " WUZ_API_KEY
    
    # Update .env.local
    sed -i "" "s|^NEXT_PUBLIC_WUZ_API_BASE_URL=.*|NEXT_PUBLIC_WUZ_API_BASE_URL=$WUZ_API_URL|" .env.local
    sed -i "" "s|^WUZ_API_KEY=.*|WUZ_API_KEY=$WUZ_API_KEY|" .env.local
    
    echo "✅ .env.local created successfully"
else
    echo "✅ .env.local already exists"
fi

# Build the project
echo ""
echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Development:  npm run dev"
echo "   2. Production:   npm start"
echo "   3. Testing:      npm test"
echo "   4. Docker:       docker-compose up -d"
echo ""
echo "🌐 Visit: http://localhost:3000"
echo ""
