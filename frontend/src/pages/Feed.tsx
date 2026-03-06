import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Filter, 
  RefreshCw,
  MessageCircle,
  Share2,
  Heart,
  BarChart3,
  Clock,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface FeedBet {
  id: string
  title: string
  description: string
  sport: string
  category: string
  stakeAmount: number
  odds: number
  potentialWin: number
  status: 'PENDING' | 'ACTIVE' | 'SETTLED' | 'CANCELLED'
  proposer: {
    id: string
    username: string
    avatar?: string
    winRate?: number
    totalWon?: number
  }
  createdAt: string
  expiresAt?: string
  acceptCount?: number
  viewCount?: number
}

const sportIcons: { [key: string]: any } = {
  Football: Trophy,
  Basketball: Trophy,
  Tennis: Trophy,
  Cricket: Trophy,
  Volleyball: Trophy,
  Rugby: Trophy,
  Baseball: Trophy,
  Hockey: Trophy,
}

const sportColors: { [key: string]: string } = {
  Football: 'from-green-500 to-emerald-600',
  Basketball: 'from-orange-500 to-red-600',
  Tennis: 'from-yellow-500 to-orange-600',
  Cricket: 'from-blue-500 to-indigo-600',
  Volleyball: 'from-purple-500 to-pink-600',
}

export default function Feed() {
  const { user, token } = useAuthStore()
  const [bets, setBets] = useState<FeedBet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/login'
      return
    }

    const fetchFeed = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/feed', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const feedData = await response.json()
          setBets(feedData)
        } else if (response.status === 401) {
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Failed to fetch feed:', error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    fetchFeed()

    // Set up real-time event listeners
    const handleNewBet = (event: any) => {
      setBets(prev => [event.detail, ...prev])
    }

    const handleBetAccepted = (event: any) => {
      setBets(prev => prev.map(bet => 
        bet.id === event.detail.betId 
          ? { ...bet, status: 'ACTIVE', acceptCount: (bet.acceptCount || 0) + 1 }
          : bet
      ))
    }

    window.addEventListener('new_bet', handleNewBet)
    window.addEventListener('bet_accepted', handleBetAccepted)

    return () => {
      window.removeEventListener('new_bet', handleNewBet)
      window.removeEventListener('bet_accepted', handleBetAccepted)
    }
  }, [user, token])

  const filteredBets = selectedSport === 'all' 
    ? bets 
    : bets.filter(bet => bet.sport === selectedSport)

  const sports = ['all', ...Array.from(new Set(bets.map(bet => bet.sport)))]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // Refetch feed
    try {
      const response = await fetch('/api/feed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const feedData = await response.json()
        setBets(feedData)
      }
    } catch (error) {
      console.error('Failed to refresh feed:', error)
    }
  }

  const handleAcceptBet = async (betId: string) => {
    try {
      const response = await fetch(`/api/bets/${betId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        // Bet accepted successfully
        setBets(prev => prev.map(bet => 
          bet.id === betId 
            ? { ...bet, status: 'ACTIVE', acceptCount: (bet.acceptCount || 0) + 1 }
            : bet
        ))
      }
    } catch (error) {
      console.error('Failed to accept bet:', error)
    }
  }

  const FeedCard = ({ bet }: { bet: FeedBet }) => {
    const SportIcon = sportIcons[bet.sport] || Trophy
    const isExpired = bet.expiresAt && new Date(bet.expiresAt) < new Date()
    const isHot = bet.acceptCount && bet.acceptCount >= 3

    return (
      <div className={`card group hover:scale-[1.02] transition-all duration-300 ${
        isHot ? 'neon-glow' : ''
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {bet.proposer.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-300">{bet.proposer.username}</h3>
                {bet.proposer.winRate && (
                  <span className="text-xs text-neon-green">
                    {bet.proposer.winRate}% WR
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{formatTimeAgo(bet.createdAt)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 bg-gradient-to-r ${sportColors[bet.sport]} rounded-lg flex items-center justify-center`}>
              <SportIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-gray-500">{bet.sport}</span>
          </div>
        </div>

        {/* Bet Content */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-200 mb-2 text-lg">
            {bet.title}
          </h4>
          {bet.description && (
            <p className="text-gray-400 text-sm mb-3">{bet.description}</p>
          )}
          
          {/* Category Badge */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="badge badge-info">{bet.category}</span>
            {isHot && (
              <span className="badge badge-warning animate-pulse">🔥 Hot</span>
            )}
            {isExpired && (
              <span className="badge badge-danger">Expired</span>
            )}
          </div>
        </div>

        {/* Bet Details */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="glass-card p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Stake</p>
            <p className="font-bold text-neon-green">KES {bet.stakeAmount.toLocaleString()}</p>
          </div>
          <div className="glass-card p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Odds</p>
            <p className="font-bold text-neon-blue">{bet.odds}x</p>
          </div>
          <div className="glass-card p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">To Win</p>
            <p className="font-bold text-warning">KES {bet.potentialWin.toLocaleString()}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              {bet.acceptCount || 0} accepts
            </span>
            <span className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-1" />
              {bet.viewCount || 0} views
            </span>
          </div>
          
          {bet.expiresAt && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatTimeAgo(bet.expiresAt)}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-4">
          <span className={`badge ${
            bet.status === 'PENDING' ? 'badge-warning' : 
            bet.status === 'ACTIVE' ? 'badge-success' : 
            bet.status === 'SETTLED' ? 'badge-info' : 
            'badge-danger'
          }`}>
            {bet.status}
          </span>
          
          {bet.proposer.totalWon && (
            <span className="text-xs text-gray-500">
              Total Won: KES {bet.proposer.totalWon.toLocaleString()}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button className="btn btn-secondary flex-1 text-sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </button>
          <button className="btn btn-secondary flex-1 text-sm">
            <MessageCircle className="w-4 h-4 mr-1" />
            Comment
          </button>
          {bet.status === 'PENDING' && !isExpired && (
            <button 
              onClick={() => handleAcceptBet(bet.id)}
              className="btn btn-primary flex-1 text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 glow-text">Social Feed 📱</h1>
              <p className="text-gray-400">Discover and engage with the betting community</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Sport Filter */}
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedSport === sport
                    ? 'bg-neon-green text-dark-bg'
                    : 'glass-card text-gray-300 hover:text-white hover:border-neon-green/50'
                }`}
              >
                {sport === 'all' ? '🔥 All Sports' : sport}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {filteredBets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No bets yet</h3>
              <p className="text-gray-500 mb-6">
                {selectedSport === 'all' 
                  ? 'Be the first to create a bet!' 
                  : `No ${selectedSport} bets available.`
                }
              </p>
              <button className="btn btn-primary">
                Create Bet
              </button>
            </div>
          ) : (
            filteredBets.map((bet) => (
              <FeedCard key={bet.id} bet={bet} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
