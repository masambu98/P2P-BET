# 🚀 P2P Betting Platform - START HERE

## ⚠️ CRITICAL LEGAL DISCLAIMER

**THIS PLATFORM REQUIRES KENYAN GAMBLING LICENSE**
- **Gambling Control Act 2025** compliance mandatory
- **30% Kenyan ownership** required
- **KSh 100M guarantee** required
- **GRA approval** essential before real-money operation

**PILOT PHASE ONLY:**
- ✅ Virtual balances ONLY (no real money)
- ✅ Friends & family testing
- ✅ Private invite-only access
- ❌ NO public deployment without license

---

## 🎯 5-Minute Quick Start

### Prerequisites
- Node.js 18+ & PostgreSQL 14+
- M-Pesa Production API access
- Stripe Test API keys

### Step 1: Clone & Install
```bash
git clone <your-repo>
cd p2p-betting-platform
chmod +x quick-start.sh
./quick-start.sh
```

### Step 2: Configure Environment
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with REAL credentials

# Frontend  
cd ../frontend
cp .env.example .env
# Edit with API URL
```

### Step 3: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend  
npm run dev
```

### Step 4: Access Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: `npm run db:studio` (backend)

### Default Accounts
| Role | Email | Password | Balance |
|-------|--------|----------|---------|
| Admin | admin@yourdomain.com | change-this-password | 100,000 KES |
| User | demo1@yourdomain.com | user123 | 1,000 KES |
| User | demo2@yourdomain.com | user123 | 1,000 KES |

---

## 🔧 Complete Setup Guide

### 1. Database Configuration

#### PostgreSQL Setup
```bash
# Create database
createdb p2p_betting

# Test connection
psql postgresql://username:password@localhost:5432/p2p_betting
```

#### Backend Environment (.env)
```env
# REQUIRED - Database
DATABASE_URL="postgresql://username:password@localhost:5432/p2p_betting"

# REQUIRED - JWT Secrets (generate strong random strings)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-characters"

# REQUIRED - Server
PORT=3001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"

# REQUIRED - M-Pesa Production (REAL MONEY)
MPESA_ENV="production"
MPESA_CONSUMER_KEY="your-safaricom-production-consumer-key"
MPESA_CONSUMER_SECRET="your-safaricom-production-consumer-secret" 
MPESA_PASSKEY="your-safaricom-production-passkey"
MPESA_SHORTCODE="your-production-paybill-number"
MPESA_CALLBACK_URL="https://yourdomain.com/api/payments/mpesa/callback"

# REQUIRED - Stripe Test
STRIPE_SECRET_KEY="sk_test_your-stripe-test-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-test-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Optional - Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"
```

### 2. M-Pesa Production Setup

#### Get Production Credentials
1. **Visit**: [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. **Create App**: Register your application
3. **Get Credentials**:
   - Consumer Key
   - Consumer Secret  
   - Passkey
   - PayBill/Till Number

#### Test M-Pesa Integration
```bash
# Test STK Push (from backend)
curl -X POST http://localhost:3001/api/payments/mpesa/deposit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 1000
  }'
```

#### Real M-Pesa Test Numbers
- **Safaricom**: Use actual Kenyan numbers
- **Airtel**: 0757xxxxxx formats work
- **Telkom**: 0772xxxxxx formats work

### 3. Stripe Test Setup

#### Get Test Keys
1. **Visit**: [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. **Copy**: Test keys (not live keys)
3. **Configure**: Webhook endpoint

#### Test Stripe Cards
```
# Visa (Success)
4242424242424242

# Visa (Declined)
4000000000000002

# Mastercard (Success)
5555555555554444
```

### 4. Database Migration & Seeding

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test data
npm run db:seed

# Create admin user (alternative)
npm run create-admin
```

---

## 🎮 Testing Flow

### Complete User Journey

#### 1. Registration & Login
```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser"
  }'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "password123"
  }'
```

#### 2. Real Money Deposit (M-Pesa)
1. **Login** to platform
2. **Navigate** to Wallet → Deposit
3. **Enter** phone number and amount
4. **Complete** M-Pesa STK Push on phone
5. **Verify** balance updates

#### 3. Create & Accept Bets
```bash
# Create bet proposal
curl -X POST http://localhost:3000/api/bets/proposals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Man United vs Liverpool",
    "description": "Premier League match",
    "sport": "Football",
    "event": "Man United vs Liverpool",
    "marketType": "yes_no", 
    "proposedOutcome": "yes",
    "stakeAmount": 5000,
    "expiryDate": "2024-12-25T20:00:00Z"
  }'

# Accept bet (as different user)
curl -X POST http://localhost:3000/api/bets/accept \
  -H "Authorization: Bearer ACCEPTOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "proposal_id_here",
    "stakeAmount": 5000
  }'
```

#### 4. Admin Settlement
1. **Login** as admin
2. **Navigate** to Admin Dashboard
3. **Find** active bets
4. **Settle** with winner selection
5. **Auto-payout** to winner's wallet

---

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Database Connection Failed
```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql postgresql://username:password@localhost:5432/p2p_betting
```

#### M-Pesa Callback Not Working
```bash
# Check callback URL accessibility
curl -X POST https://yourdomain.com/api/payments/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{"ResultCode": 0}'

# Verify ngrok for local testing
ngrok http 3001
```

#### JWT Token Issues
```bash
# Verify JWT secrets are set
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET

# Regenerate tokens
npm run db:seed
```

#### Port Already in Use
```bash
# Kill processes on ports 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### Frontend Build Errors
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

### Log Locations
```bash
# Backend logs
tail -f backend/logs/app.log

# Database queries
tail -f backend/logs/combined.log

# Error logs
tail -f backend/logs/error.log
```

---

## 📊 Database Schema Overview

### Core Tables
- **users**: User accounts & profiles
- **wallets**: User balances & transactions
- **bet_proposals**: Betting proposals created by users
- **bets**: Matched bets between users
- **transactions**: All financial transactions
- **settlements**: Bet settlements & payouts
- **withdrawal_requests**: User withdrawal requests
- **deposit_requests**: User deposit requests
- **notifications**: User notifications

### Key Relationships
```
Users → Wallets (1:1)
Users → Bet Proposals (1:many)
Users → Bets (proposed/accepted) (1:many)
Bets → Settlements (1:1)
Wallets → Transactions (1:many)
```

---

## 🔒 Security Notes

### Production Security Checklist
- [ ] **Strong JWT secrets** (32+ chars, random)
- [ ] **HTTPS enabled** (SSL certificates)
- [ ] **Rate limiting** configured
- [ ] **CORS properly set** to frontend domain
- [ ] **Environment variables** secured (not in git)
- [ ] **Database encryption** enabled
- [ ] **API input validation** on all endpoints
- [ ] **SQL injection prevention** (Prisma ORM)
- [ ] **XSS protection** (Helmet.js)
- [ ] **Audit logging** enabled

### Monitoring & Alerts
```bash
# Monitor failed logins
grep "Failed login" backend/logs/app.log

# Monitor large transactions
grep "amount.*[0-9]{4,}" backend/logs/app.log

# Monitor M-Pesa callbacks
grep "mpesa" backend/logs/app.log
```

---

## 🚀 Production Deployment

### Environment Configuration
```env
# Production
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://yourdomain.com"

# Database (Production)
DATABASE_URL="postgresql://user:pass@prod-host:5432/p2p_betting"

# M-Pesa (Production - REAL MONEY)
MPESA_ENV="production"
MPESA_CALLBACK_URL="https://yourdomain.com/api/payments/mpesa/callback"

# Stripe (Live - REAL MONEY)  
STRIPE_SECRET_KEY="sk_live_your-live-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-live-webhook-secret"
```

### Deployment Commands
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build

# Start production servers
npm start
```

---

## 📋 Launch Checklist

### Pre-Launch Requirements
- [ ] **Kenyan Gambling License** obtained from GRA
- [ ] **30% Kenyan ownership** verified
- [ ] **KSh 100M guarantee** deposited with GRA
- [ ] **M-Pesa Production API** fully tested
- [ ] **Stripe Live API** configured
- [ ] **SSL certificates** installed
- [ ] **Domain & hosting** configured
- [ ] **Bank accounts** setup for payouts
- [ ] **Terms of service** legally drafted
- [ ] **Privacy policy** implemented
- [ ] **KYC/AML procedures** documented
- [ ] **Customer support** system ready
- [ ] **Backup strategy** implemented
- [ ] **Monitoring tools** configured

### Testing Checklist
- [ ] **M-Pesa deposits** working with real money
- [ ] **Stripe deposits** working with test cards
- [ ] **Bet creation** functioning properly
- [ ] **Bet acceptance** working between users
- [ ] **Admin settlement** processing correctly
- [ ] **Wallet balances** updating accurately
- [ ] **Notifications** sending properly
- [ ] **Error handling** graceful for all scenarios
- [ ] **Performance** acceptable under load

---

## 🎯 You're Ready to Launch Your Pilot!

### Final Verification Steps
1. **Start all services**: Backend, Frontend, Database
2. **Test complete flow**: Register → Deposit → Bet → Settle
3. **Verify payments**: M-Pesa and Stripe working
4. **Check security**: All security measures active
5. **Monitor logs**: No critical errors
6. **Test admin panel**: Full functionality working

### Go Live Checklist
- ✅ All environment variables configured
- ✅ Database migrated and seeded
- ✅ SSL certificates installed
- ✅ Payment gateways tested
- ✅ Admin account created
- ✅ Monitoring enabled
- ✅ Backup systems ready
- ✅ Legal compliance verified

### Success Metrics to Track
- **User registration rate**
- **Deposit success rate** (M-Pesa vs Stripe)
- **Bet creation volume**
- **Settlement processing time**
- **System uptime** (target: 99.9%)
- **Response times** (target: <200ms)

### Support & Monitoring
```bash
# Real-time logs
tail -f backend/logs/app.log

# System resources
htop
df -h

# Network connectivity
ping yourdomain.com
```

---

## 🆘 Emergency Procedures

### Service Recovery
```bash
# Restart all services
sudo systemctl restart your-app

# Database recovery
pg_ctl restart

# Clear caches
npm run cache:clear
```

### Security Incident Response
1. **Immediate**: Block suspicious IPs
2. **Investigate**: Review logs for patterns
3. **Communicate**: Notify users of issues
4. **Remediate**: Patch vulnerabilities
5. **Document**: Record incident details

---

## 📞 Support & Resources

### Quick Help
- **Setup Issues**: Check SETUP_GUIDE.md
- **API Documentation**: docs/API.md
- **Database Issues**: `npm run db:studio`
- **Payment Problems**: Review payment gateway logs

### Contact Development
- **Issues**: Create GitHub issue
- **Security**: Report to security@yourdomain.com
- **Business**: Contact admin@yourdomain.com

---

**🎉 CONGRATULATIONS! Your P2P Betting Platform is ready for pilot testing!**

**Remember**: This is a PILOT platform with virtual currency only. Real-money operation requires full Kenyan gambling license and compliance.

**Good luck with your launch! 🚀**
