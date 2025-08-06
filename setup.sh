#!/bin/bash

# CLGEN Setup Script
echo "🚀 Setting up CLGEN - AI Cover Letter Generator"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) is installed${NC}"

# Navigate to backend directory
cd backend

# Install dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cat > .env << EOF
# CLGEN Backend Environment Variables

# Google Gemini API Key
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_PATH=./database.sqlite

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=../uploads
EOF
    echo -e "${YELLOW}⚠️  Please edit .env file and add your Gemini API key${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create uploads directory
cd ..
if [ ! -d "uploads" ]; then
    mkdir -p uploads
    echo -e "${GREEN}✅ Created uploads directory${NC}"
else
    echo -e "${GREEN}✅ Uploads directory already exists${NC}"
fi

# Generate PNG icons from SVG
echo -e "${BLUE}🎨 Generating extension icons...${NC}"
cd extension/icons

# Check if ImageMagick is available for icon generation
if command -v convert &> /dev/null; then
    # Generate different sizes
    convert -background transparent -resize 16x16 icon.svg icon16.png
    convert -background transparent -resize 32x32 icon.svg icon32.png
    convert -background transparent -resize 48x48 icon.svg icon48.png
    convert -background transparent -resize 128x128 icon.svg icon128.png
    echo -e "${GREEN}✅ Extension icons generated${NC}"
else
    echo -e "${YELLOW}⚠️  ImageMagick not found. Please manually convert icon.svg to PNG files:${NC}"
    echo "   - icon16.png (16x16)"
    echo "   - icon32.png (32x32)"
    echo "   - icon48.png (48x48)"
    echo "   - icon128.png (128x128)"
fi

cd ../..

echo ""
echo -e "${GREEN}🎉 CLGEN setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Edit backend/.env and add your API key"
echo "3. Start the backend server: cd backend && npm start"
echo "4. Load the extension in Chrome:"
echo "   - Go to chrome://extensions/"
echo "   - Enable Developer mode"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'extension' folder"
echo ""
echo -e "${GREEN}🚀 Happy cover letter generating!${NC}" 