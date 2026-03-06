import { TransactionType, TransactionStatus } from '@prisma/client';

export interface WalletResponse {
  id: string;
  balance: number;
  currency: string;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  description: string;
  status: TransactionStatus;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRequest {
  amount: number;
  reference?: string;
  paymentMethod: 'mpesa' | 'bank';
}

export interface WithdrawRequest {
  amount: number;
  destination: string;
  paymentMethod: 'mpesa' | 'bank';
}

export interface AdminTransactionRequest {
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
}
