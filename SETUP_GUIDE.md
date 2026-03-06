# 🚀 Setup Guide

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## Step 1: Clone & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd p2p-betting-platform

# Verify Node.js version
node --version  # Should be 18.x or higher
```

## Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file (required fields):
nano .env
```

### Backend Environment Variables (.env)

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/p2p_betting"

# JWT Secrets (REQUIRED - use strong random strings)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Server (optional)
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Logging (optional)
LOG_LEVEL="info"
```

### Database Setup

```bash
# Still in backend directory

# Generate Prisma client
npx prisma generate

# Create database (if not exists)
createdb p2p_betting

# Push schema to database
npx prisma db push

# Seed database with test users
npm run db:seed
```

## Step 3: Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

### Frontend Environment Variables (.env)

```env
# API URL (required)
VITE_API_URL="http://localhost:3001/api"
```

## Step 4: Start Development Servers

Open **two separate terminals**:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Expected output:
```
Server running on port 3001
[INFO] Database connected successfully
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Expected output:
```
  VITE v5.x.x  ready in 500ms
  ➜  Local:   http://localhost:3000/
```

## Step 5: Verify Installation

1. **Open browser** to http://localhost:3000
2. **Test login** with demo accounts:
   - Admin: `admin@p2pbetting.com` / `admin123`
   - User: `demo1@p2pbetting.com` / `user123`

## Step 6: Database Management (Optional)

```bash
# View database in browser
cd backend
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
npm run db:seed
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
Error: Can't reach database server
```
**Solution:**
- Check PostgreSQL is running: `pg_ctl status`
- Verify DATABASE_URL in .env
- Create database: `createdb p2p_betting`

#### 2. Port Already in Use
```bash
Error: listen EADDRINUSE :::3001
```
**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
# Or change PORT in .env
```

#### 3. Permission Denied
```bash
Error: EACCES: permission denied
```
**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
npm install
```

#### 4. Node.js Version
```bash
Error: Node.js version too old
```
**Solution:**
```bash
# Install Node.js 18+ using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test            # Run tests
npm run lint        # Check code style
npm run db:studio   # Open database GUI
npm run db:seed    # Seed database
```

### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm test            # Run tests
npm run lint        # Check code style
```

## Production Deployment

### Environment Variables for Production

#### Backend (.env)
```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="strong-production-secret"
JWT_REFRESH_SECRET="strong-production-refresh-secret"
FRONTEND_URL="https://yourdomain.com"
LOG_LEVEL="warn"
```

#### Frontend (.env)
```env
VITE_API_URL="https://api.yourdomain.com/api"
```

### Build Commands
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] HTTPS enabled in production
- [ ] Database credentials secured
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Environment variables not committed
- [ ] Dependencies updated regularly

## Need Help?

1. **Check logs**: Look at terminal output for errors
2. **Verify environment**: Double-check .env files
3. **Restart services**: Stop and restart both servers
4. **Check dependencies**: `npm install` in both directories
5. **Database status**: Ensure PostgreSQL is running

## Next Steps

Once setup is complete:
1. Explore the admin dashboard
2. Create test bet proposals
3. Test P2P betting flow
4. Review API documentation
5. Customize for your needs

---

**⚠️ Remember: This is a pilot platform with virtual currency only.**
