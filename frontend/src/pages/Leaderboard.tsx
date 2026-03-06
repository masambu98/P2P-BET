import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { 
  Trophy, 
  Crown, 
  Medal, 
  TrendingUp, 
  Award,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  Star,
  Target,
  DollarSign
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar?: string
  winRate: number
  totalWon: number
  biggestWin: number
  totalBets: number
  wonBets: number
  lostBets: number
  profitLoss: number
  currentStreak: number
  bestStreak: number
}

export default function Leaderboard() {
  const { user, token } = useAuthStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'weekly' | 'all-time'>('all-time')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/login'
      return
    }

    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const leaderboardData = await response.json()
          setLeaderboard(leaderboardData)
        } else if (response.status === 401) {
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    fetchLeaderboard()
  }, [user, token, timeframe])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const leaderboardData = await response.json()
        setLeaderboard(leaderboardData)
      }
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-dark-bg'
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-dark-bg'
    if (rank === 3) return 'bg-gradient-to-r from-orange-600 to-orange-700 text-dark-bg'
    return 'bg-gray-800 text-gray-300'
  }

  const LeaderboardCard = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => {
    const isPositivePL = entry.profitLoss > 0
    const isNegativePL = entry.profitLoss < 0

    return (
      <div className={`card group hover:scale-[1.02] transition-all duration-300 ${
        isCurrentUser ? 'neon-glow border-neon-green' : ''
      }`}>
        {/* Rank and Avatar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadge(entry.rank)}`}>
              {getRankIcon(entry.rank)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-300 text-lg">
                  {entry.username}
                </h3>
                {isCurrentUser && (
                  <span className="badge badge-success text-xs">You</span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {entry.totalBets} bets • {entry.wonBets} wins
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-neon-green">
              {entry.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-4 h-4 text-neon-green" />
              <span className="text-xs text-gray-500">Total Won</span>
            </div>
            <p className="font-bold text-neon-green text-lg">
              {formatCurrency(entry.totalWon)}
            </p>
          </div>

          <div className="glass-card p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Biggest Win</span>
            </div>
            <p className="font-bold text-yellow-500 text-lg">
              {formatCurrency(entry.biggestWin)}
            </p>
          </div>

          <div className="glass-card p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className={`w-4 h-4 ${isPositivePL ? 'text-green-500' : isNegativePL ? 'text-red-500' : 'text-gray-500'}`} />
              <span className="text-xs text-gray-500">P&L</span>
            </div>
            <p className={`font-bold text-lg ${isPositivePL ? 'text-green-500' : isNegativePL ? 'text-red-500' : 'text-gray-500'}`}>
              {isPositivePL ? '+' : ''}{formatCurrency(entry.profitLoss)}
            </p>
          </div>

          <div className="glass-card p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <Target className="w-4 h-4 text-neon-blue" />
              <span className="text-xs text-gray-500">Best Streak</span>
            </div>
            <p className="font-bold text-neon-blue text-lg">
              {entry.bestStreak}W
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-500">
            <span>W: {entry.wonBets}</span>
            <span>L: {entry.lostBets}</span>
            <span>Current: {entry.currentStreak > 0 ? `${entry.currentStreak}W` : entry.currentStreak < 0 ? `${Math.abs(entry.currentStreak)}L` : '-'}</span>
          </div>
          
          {isCurrentUser && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 text-xs">Your Rank</span>
            </div>
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
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  const currentUserRank = leaderboard.findIndex(entry => entry.userId === user?.id) + 1
  const topThree = leaderboard.slice(0, 3)
  const restOfLeaderboard = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 glow-text">Leaderboard 🏆</h1>
              <p className="text-gray-400">Top performers and betting champions</p>
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

          {/* Timeframe Tabs */}
          <div className="flex bg-dark-card rounded-xl p-1 w-fit">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                timeframe === 'weekly'
                  ? 'bg-neon-green text-dark-bg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('all-time')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                timeframe === 'all-time'
                  ? 'bg-neon-green text-dark-bg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              All-Time
            </button>
          </div>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topThree.map((entry, index) => (
              <div key={entry.userId} className="relative">
                {index === 0 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />
                  </div>
                )}
                <LeaderboardCard 
                  entry={entry} 
                  isCurrentUser={entry.userId === user?.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Current User Position (if not in top 3) */}
        {currentUserRank > 3 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Your Position</h3>
            <LeaderboardCard 
              entry={leaderboard[currentUserRank - 1]} 
              isCurrentUser={true}
            />
          </div>
        )}

        {/* Rest of Leaderboard */}
        {restOfLeaderboard.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">All Rankings</h3>
            <div className="space-y-4">
              {restOfLeaderboard.map((entry) => (
                <LeaderboardCard 
                  key={entry.userId} 
                  entry={entry} 
                  isCurrentUser={entry.userId === user?.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No rankings yet</h3>
            <p className="text-gray-500 mb-6">
              Start placing bets to appear on the leaderboard!
            </p>
            <button className="btn btn-primary">
              Create Bet
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
