import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Trophy, 
  Target,
  MessageSquare,
  Share2,
  Bookmark,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import ChatSystem from '../components/chat/ChatSystem';

interface Bet {
  id: string;
  title: string;
  description: string;
  category: string;
  stakeAmount: number;
  potentialWin: number;
  odds: number;
  status: 'OPEN' | 'ACCEPTED' | 'SETTLED';
  creator: {
    id: string;
    username: string;
    avatar?: string;
    level: number;
  };
  bettor?: {
    id: string;
    username: string;
    avatar?: string;
    level: number;
  };
  winner?: 'creator' | 'bettor';
  expiresAt: string;
  createdAt: string;
  settledAt?: string;
  views: number;
  tags: string[];
}

export default function BetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { notifyChallengeViewed, updateViewCount } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (id) {
      fetchBetDetails(id);
      // Notify that this challenge was viewed
      notifyChallengeViewed(id, bet?.creator?.id || '');
      // Update view count
      updateViewCount(id, 1);
    }
  }, [id]);

  const fetchBetDetails = async (betId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bets/${betId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const betData = await response.json();
        setBet(betData);
      } else {
        setError('Bet not found');
      }
    } catch (error) {
      setError('Failed to load bet details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBet = async () => {
    if (!bet) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bets/${bet.id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchBetDetails(bet.id);
      }
    } catch (error) {
      console.error('Failed to accept bet:', error);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark functionality
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: bet?.title,
        text: bet?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-green-500';
      case 'ACCEPTED': return 'text-yellow-500';
      case 'SETTLED': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <Target className="w-4 h-4" />;
      case 'ACCEPTED': return <Clock className="w-4 h-4" />;
      case 'SETTLED': return <Trophy className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bet) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Bet Not Found</h1>
          <p className="text-gray-400 mb-4">{error || 'This bet does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/browse-bets')}
            className="px-4 py-2 bg-neon-green text-dark-bg rounded-lg hover:bg-neon-green/90 transition-colors"
          >
            Browse Other Bets
          </button>
        </div>
      </div>
    );
  }

  const isCreator = bet.creator.id === 'current-user'; // Would come from auth context
  const canAccept = bet.status === 'OPEN' && !isCreator && !bet.bettor;

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b border-dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked ? 'bg-neon-green text-dark-bg' : 'hover:bg-dark-card text-gray-400'
                }`}
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 hover:bg-dark-card rounded-lg transition-colors text-gray-400"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bet Header */}
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">{bet.title}</h1>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bet.status)}`}>
                      {getStatusIcon(bet.status)}
                      <span>{bet.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                    <span className="px-2 py-1 bg-dark-card rounded-lg">{bet.category}</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{bet.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeRemaining(bet.expiresAt)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed">{bet.description}</p>
                </div>
              </div>

              {/* Tags */}
              {bet.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {bet.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-neon-green/10 border border-neon-green/30 rounded-full text-xs text-neon-green"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {canAccept && (
                <button
                  onClick={handleAcceptBet}
                  className="w-full py-3 bg-neon-green text-dark-bg rounded-lg font-semibold hover:bg-neon-green/90 transition-colors"
                >
                  Accept Bet - KES {bet.stakeAmount.toLocaleString()}
                </button>
              )}
            </div>

            {/* Participants */}
            <div className="glass-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>
              
              <div className="space-y-4">
                {/* Creator */}
                <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {bet.creator.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{bet.creator.username}</p>
                      <p className="text-sm text-gray-400">Level {bet.creator.level} • Creator</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">KES {bet.stakeAmount.toLocaleString()}</p>
                    {bet.winner === 'creator' && (
                      <div className="flex items-center space-x-1 text-green-500 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Won</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bettor */}
                {bet.bettor ? (
                  <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-neon-green to-neon-blue rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {bet.bettor.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{bet.bettor.username}</p>
                        <p className="text-sm text-gray-400">Level {bet.bettor.level} • Challenger</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">KES {bet.stakeAmount.toLocaleString()}</p>
                      {bet.winner === 'bettor' && (
                        <div className="flex items-center space-x-1 text-green-500 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Won</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 border-2 border-dashed border-dark-border rounded-lg">
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-gray-400">Waiting for challenger</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <ChatSystem betId={bet.id} type="bet" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bet Details */}
            <div className="glass-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bet Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stake Amount</span>
                  <span className="font-medium text-white">KES {bet.stakeAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Potential Win</span>
                  <span className="font-medium text-green-500">KES {bet.potentialWin.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Odds</span>
                  <span className="font-medium text-white">{bet.odds.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Pot</span>
                  <span className="font-medium text-neon-green">KES {(bet.stakeAmount * (bet.bettor ? 2 : 1)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-neon-green rounded-full mt-2" />
                  <div>
                    <p className="text-sm text-white">Created</p>
                    <p className="text-xs text-gray-400">{formatDate(bet.createdAt)}</p>
                  </div>
                </div>
                
                {bet.bettor && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm text-white">Accepted by {bet.bettor.username}</p>
                      <p className="text-xs text-gray-400">{formatDate(bet.createdAt)}</p>
                    </div>
                  </div>
                )}
                
                {bet.status === 'SETTLED' && bet.settledAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm text-white">Settled</p>
                      <p className="text-xs text-gray-400">{formatDate(bet.settledAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Expiry Info */}
            {bet.status === 'OPEN' && (
              <div className="glass-card rounded-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-white">Expires Soon</h3>
                </div>
                <p className="text-gray-300 mb-2">{getTimeRemaining(bet.expiresAt)}</p>
                <p className="text-sm text-gray-400">
                  If no one accepts this bet before it expires, it will be automatically cancelled.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
