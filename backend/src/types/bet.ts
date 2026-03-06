import { ProposalStatus, BetStatus } from '@prisma/client';

export interface CreateProposalRequest {
  title: string;
  description?: string;
  sport: string;
  event: string;
  marketType: string;
  proposedOutcome: string;
  stakeAmount: number;
  maxStakeAmount?: number;
  odds?: number;
  expiryDate: string;
  isPublic?: boolean;
}

export interface CreateBetRequest {
  proposalId: string;
  stakeAmount: number;
  odds?: number;
}

export interface CounterOfferRequest {
  betId: string;
  stakeAmount: number;
  odds: number;
}

export interface SettleBetRequest {
  betId: string;
  result: 'proposer_wins' | 'acceptor_wins' | 'push' | 'void';
  notes?: string;
}

export interface BetProposalResponse {
  id: string;
  title: string;
  description?: string;
  sport: string;
  event: string;
  marketType: string;
  proposedOutcome: string;
  stakeAmount: number;
  maxStakeAmount: number;
  odds: number;
  expiryDate: string;
  isPublic: boolean;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  proposer: {
    id: string;
    username: string;
  };
  _count: {
    bets: number;
  };
}

export interface BetResponse {
  id: string;
  stakeAmount: number;
  odds: number;
  proposerOutcome: string;
  acceptorOutcome: string;
  status: BetStatus;
  settlementResult?: string;
  settledAt?: string;
  houseFee: number;
  createdAt: string;
  updatedAt: string;
  proposal: {
    id: string;
    title: string;
    sport: string;
    event: string;
  };
  proposer: {
    id: string;
    username: string;
  };
  acceptor: {
    id: string;
    username: string;
  };
}

export interface BetFilters {
  sport?: string;
  status?: ProposalStatus;
  minStake?: number;
  maxStake?: number;
  limit?: number;
  offset?: number;
}
