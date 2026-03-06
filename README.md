# ⚠️ IMPORTANT LEGAL DISCLAIMER ⚠️

**THIS IS A PRIVATE PILOT-ONLY P2P SPORTS BETTING PLATFORM**
- **NO REAL MONEY INVOLVED** - Virtual KES balances only
- **INVITE-ONLY** - Friends and family testing phase
- **KENYAN GAMBLING CONTROL ACT 2025 COMPLIANCE REQUIRED**
- **UNLICENSED REAL-MONEY OPERATION IS ILLEGAL**

---

# P2P Sports Betting Platform

A private, invite-only peer-to-peer sports betting platform built for pilot testing with virtual balances only.

## 🚨 WARNING: PILOT PHASE ONLY

This platform operates with **virtual currency only**. No real money transactions are processed. This is a pilot/testing environment for friends and family.

## 📋 Features

### Core Functionality
- ✅ Invite-only registration with email/password + Google OAuth
- ✅ Virtual KES wallet (10,000 KES starting balance)
- ✅ P2P betting proposals and counter-offers
- ✅ Real-time notifications via Socket.io
- ✅ Admin settlement system
- ✅ Mobile-responsive modern UI

### Security & Compliance
- ✅ JWT authentication with refresh tokens
- ✅ bcrypt password hashing
- ✅ Rate limiting and security headers
- ✅ Input validation and sanitization
- ✅ Comprehensive audit logging

## 🛠 Tech Stack

### Backend
- **Node.js + Express + TypeScript**
- **PostgreSQL + Prisma ORM**
- **JWT + bcrypt authentication**
- **Socket.io for real-time features**
- **Winston logging**
- **Zod validation**

### Frontend
- **React 18 + TypeScript**
- **Vite + Tailwind CSS**
- **Zustand state management**
- **React Router v6**
- **Axios for API calls**
- **React Hook Form + Zod**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd p2p-betting-platform
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment setup**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database URL and secrets

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your API URL
```

4. **Database setup**
```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

5. **Start development servers**
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database Studio: `npm run db:studio` (backend)

## 📱 Default Accounts

After running the seed script:

| Role | Email | Password | Balance |
|------|-------|----------|---------|
| Admin | admin@p2pbetting.com | admin123 | 100,000 KES |
| Demo User 1 | demo1@p2pbetting.com | user123 | 10,000 KES |
| Demo User 2 | demo2@p2pbetting.com | user123 | 10,000 KES |

## 🏗 Project Structure

```
p2p-betting-platform/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation, etc.
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts         # Database seeding
│   └── package.json
├── frontend/                # React + TypeScript SPA
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand state
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper functions
│   └── package.json
└── docs/                   # Documentation
```

## 🔧 Development

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/p2p_betting"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (.env)
```env
VITE_API_URL="http://localhost:3001/api"
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# View database
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

### Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get user profile

### Betting Endpoints
- `GET /api/bets/proposals` - Browse bet proposals
- `POST /api/bets/proposals` - Create bet proposal
- `POST /api/bets/accept` - Accept bet
- `POST /api/bets/settle` - Settle bet (admin only)

### Wallet Endpoints
- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/deposit` - Request deposit
- `POST /api/wallet/withdraw` - Request withdrawal

## 🚨 Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** in production
3. **Enable HTTPS** in production
4. **Regular security updates** for all dependencies
5. **Rate limiting** is enabled by default
6. **Input validation** on all endpoints

## 📋 TODO: Production Requirements

Before any real-money deployment:

- [ ] Obtain Kenyan Gambling License
- [ ] Implement KYC/AML verification
- [ ] Add real payment processing (M-Pesa, Stripe)
- [ ] Enhanced security auditing
- [ ] Load testing and optimization
- [ ] Legal terms and privacy policy
- [ ] Customer support system
- [ ] Backup and disaster recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact the development team

---

**⚠️ REMINDER: This is a pilot platform with virtual currency only. No real money betting is supported.**
