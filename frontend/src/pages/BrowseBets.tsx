import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Circle, 
  Flag, 
  Award,
  Timer,
  User,
  TrendingUp,
  Eye,
  Clock,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react'

interface Bet {
  id: string
  title: string
  sport: string
  event: string
  marketType: string
  proposedOutcome: string
  stakeAmount: number
  maxStakeAmount: number
  status: string
  proposer: { username: string; id: string }
  createdAt: string
  expiryDate?: string
  odds?: number
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

export default function BrowseBets() {
  const { user, token } = useAuthStore()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/login'
      return
    }

    const fetchBets = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/bets', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const betsData = await response.json()
          setBets(betsData)
        } else if (response.status === 401) {
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Failed to fetch bets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBets()

    // Set up real-time event listeners
    const handleNewBet = (event: any) => {
      setBets(prev => [event.detail, ...prev])
    }

    const handleBetAccepted = (event: any) => {
      // Remove or update the accepted bet
      setBets(prev => prev.map(bet => 
        bet.id === event.detail.betId 
          ? { ...bet, status: 'ACCEPTED' }
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

  const formatField = (field: string) => {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/yesvsno/gi, 'Yes vs No').replace(/novsyes/gi, 'No vs Yes')
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid Date'
    }
  }

  const handleCopyLink = async (betId: string) => {
    const challengeUrl = `${window.location.origin}/challenge/${betId}`
    try {
      await navigator.clipboard.writeText(challengeUrl)
      // You could add a toast notification here
      console.log('Challenge link copied to clipboard')
    } catch (error) {
      console.error('Failed to copy link')
    }
  }

  const CountdownTimer = ({ expiryDate }: { expiryDate: string }) => {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
      const timer = setInterval(() => {
        try {
          const now = new Date().getTime()
          const expiry = new Date(expiryDate).getTime()
          const difference = expiry - now

          if (difference > 0) {
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((difference % (1000 * 60)) / 1000)
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
          } else {
            setTimeLeft('Expired')
          }
        } catch {
          setTimeLeft('Invalid Date')
        }
      }, 1000)

      return () => clearInterval(timer)
    }, [expiryDate])

    return (
      <div className={`flex items-center space-x-1 text-sm ${
        timeLeft === 'Expired' ? 'text-danger' : 
        timeLeft.includes('h') && parseInt(timeLeft) < 2 ? 'text-warning animate-pulse' : 
        'text-neon-green'
      }`}>
        <Timer className="w-4 h-4" />
        <span className="font-mono">{timeLeft}</span>
      </div>
    )
  }

  const BetCard = ({ bet }: { bet: Bet }) => {
    const SportIcon = sportIcons[bet.sport] || Football
    const isHot = bet.stakeAmount >= 5000
    const isExpiringSoon = bet.expiryDate && new Date(bet.expiryDate).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000

    return (
      <div className={`card group hover:scale-105 transition-all duration-300 relative ${
        isHot ? 'neon-glow' : ''
      }`}>
        {isHot && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-warning to-orange-600 text-dark-bg text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            🔥 HOT
          </div>
        )}
        
        {/* Sport Icon and Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${sportColors[bet.sport]} rounded-lg flex items-center justify-center`}>
              <SportIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-300 group-hover:text-neon-green transition-colors">
                {bet.sport}
              </h3>
              <p className="text-xs text-gray-500">{bet.event}</p>
            </div>
          </div>
          {isExpiringSoon && (
            <AlertCircle className="w-5 h-5 text-warning animate-pulse" />
          )}
        </div>

        {/* Bet Title */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-200 mb-2 line-clamp-2">
            {formatField(bet.title)}
          </h4>
          <div className="flex items-center space-x-2">
            <span className={`badge ${
              bet.proposedOutcome === 'yes' ? 'badge-success' : 'badge-danger'
            }`}>
              {bet.proposedOutcome.toUpperCase()}
            </span>
            <span className="text-gray-500 text-sm">vs</span>
            <span className={`badge ${
              bet.proposedOutcome === 'yes' ? 'badge-danger' : 'badge-success'
            }`}>
              {bet.proposedOutcome === 'yes' ? 'NO' : 'YES'}
            </span>
          </div>
        </div>

        {/* Stake and Odds */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Stake Amount</p>
            <p className="font-bold text-neon-green">KES {bet.stakeAmount.toLocaleString()}</p>
          </div>
          <div className="glass-card p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Max Stake</p>
            <p className="font-bold text-neon-blue">KES {bet.maxStakeAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Odds */}
        {bet.odds && (
          <div className="glass-card p-3 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Odds</p>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-neon-green" />
                <span className="font-bold text-neon-green">{bet.odds}x</span>
              </div>
            </div>
          </div>
        )}

        {/* Proposer and Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">{bet.proposer.username}</span>
          </div>
          {bet.expiryDate && (
            <CountdownTimer expiryDate={bet.expiryDate} />
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-4">
          <span className={`badge ${
            bet.status === 'PENDING' ? 'badge-warning' : 'badge-success'
          }`}>
            {bet.status}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(bet.createdAt)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={() => handleCopyLink(bet.id)}
            className="btn btn-secondary text-sm px-3"
            title="Copy challenge link"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button className="btn btn-success flex-1 text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Accept
          </button>
          <button className="btn btn-secondary flex-1 text-sm">
            <Eye className="w-4 h-4 mr-1" />
            View
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading bets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 glow-text">
            Browse Bet Proposals 🔥
          </h1>
          <p className="text-gray-400 mb-6">
            Find and accept exciting betting challenges from other users
          </p>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {showFilters && (
              <div className="flex flex-wrap gap-2 animate-slide-up">
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
                    {sport === 'all' ? 'All Sports' : sport}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
            <p className="mt-4 text-gray-400">Loading available bets...</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-400">
                Showing <span className="font-bold text-neon-green">{filteredBets.length}</span> bet{filteredBets.length !== 1 ? 's' : ''}
                {selectedSport !== 'all' && ` in ${selectedSport}`}
              </p>
            </div>

            {/* Bets Grid */}
            {filteredBets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No bets found</h3>
                <p className="text-gray-500 mb-6">
                  {selectedSport !== 'all' 
                    ? `No ${selectedSport} bets available at the moment.`
                    : 'No bets available at the moment.'
                  }
                </p>
                {selectedSport !== 'all' && (
                  <button
                    onClick={() => setSelectedSport('all')}
                    className="btn btn-primary"
                  >
                    Show All Sports
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
