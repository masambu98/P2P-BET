p2p-betting-platform/
├── README.md
├── START_HERE.md
├── SETUP_GUIDE.md
├── .env.example
├── .gitignore
├── package.json
├── quick-start.sh
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── jwt.ts
│   │   │   ├── mpesa.ts
│   │   │   ├── stripe.ts
│   │   │   └── socket.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── betController.ts
│   │   │   ├── walletController.ts
│   │   │   ├── paymentController.ts
│   │   │   └── adminController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── bets.ts
│   │   │   ├── wallet.ts
│   │   │   ├── payments.ts
│   │   │   └── admin.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── betService.ts
│   │   │   ├── walletService.ts
│   │   │   ├── mpesaService.ts
│   │   │   ├── stripeService.ts
│   │   │   ├── socketService.ts
│   │   │   └── emailService.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── bet.ts
│   │   │   ├── wallet.ts
│   │   │   └── payment.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── validation.ts
│   │       ├── helpers.ts
│   │       └── constants.ts
│   └── dist/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── LoadingSpinner.tsx
│       │   │   └── Alert.tsx
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── Footer.tsx
│       │   ├── auth/
│       │   │   ├── LoginForm.tsx
│       │   │   ├── RegisterForm.tsx
│       │   │   └── GoogleAuthButton.tsx
│       │   ├── bets/
│       │   │   ├── CreateBetForm.tsx
│       │   │   ├── BetCard.tsx
│       │   │   ├── BetList.tsx
│       │   │   ├── BetDetails.tsx
│       │   │   ├── CounterOfferForm.tsx
│       │   │   └── SettleBetModal.tsx
│       │   ├── wallet/
│       │   │   ├── WalletBalance.tsx
│       │   │   ├── DepositForm.tsx
│       │   │   ├── WithdrawForm.tsx
│       │   │   ├── MpesaDeposit.tsx
│       │   │   ├── StripeDeposit.tsx
│       │   │   └── TransactionHistory.tsx
│       │   └── admin/
│       │       ├── AdminDashboard.tsx
│       │       ├── UserManagement.tsx
│       │       ├── BetSettlement.tsx
│       │       ├── WithdrawalRequests.tsx
│       │       ├── DepositRequests.tsx
│       │       └── SystemStats.tsx
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── CreateBet.tsx
│       │   ├── BrowseBets.tsx
│       │   ├── MyBets.tsx
│       │   ├── Wallet.tsx
│       │   ├── Profile.tsx
│       │   └── AdminDashboard.tsx
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useSocket.ts
│       │   ├── useWallet.ts
│       │   ├── useBets.ts
│       │   └── usePayments.ts
│       ├── store/
│       │   ├── authStore.ts
│       │   ├── betStore.ts
│       │   ├── walletStore.ts
│       │   └── notificationStore.ts
│       ├── services/
│       │   ├── api.ts
│       │   ├── socket.ts
│       │   ├── auth.ts
│       │   ├── bets.ts
│       │   ├── wallet.ts
│       │   └── payments.ts
│       ├── types/
│       │   ├── auth.ts
│       │   ├── bet.ts
│       │   ├── wallet.ts
│       │   ├── payment.ts
│       │   └── api.ts
│       └── utils/
│           ├── constants.ts
│           ├── helpers.ts
│           ├── validation.ts
│           └── formatters.ts
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    ├── MPESA_INTEGRATION.md
    ├── STRIPE_INTEGRATION.md
    ├── SECURITY.md
    └── LEGAL.md
