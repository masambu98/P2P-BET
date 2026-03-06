#!/bin/bash

# P2P Betting Platform - Quick Start Script
# This script sets up the entire development environment

echo "🚀 Starting P2P Betting Platform Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    echo "Visit: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Create database if it doesn't exist
echo "📊 Setting up database..."
createdb p2p_betting 2>/dev/null || echo "Database already exists"

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
if [ ! -d "node_modules" ]; then
    npm install
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials"
fi

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database
npm run db:seed

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    npm install
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Please edit frontend/.env with your API URL"
fi

# Go back to root
cd ..

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit backend/.env with your database credentials"
echo "2. Edit frontend/.env with your API URL (usually http://localhost:3001/api)"
echo "3. Start the development servers:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "👤 Default Accounts:"
echo "   Admin: admin@p2pbetting.com / admin123"
echo "   User:  demo1@p2pbetting.com / user123"
echo ""
echo "📚 For detailed setup, see SETUP_GUIDE.md"
echo ""
echo "⚠️  REMINDER: This is a pilot platform with virtual currency only!"
