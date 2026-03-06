import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  Trophy, 
  Copy, 
  User, 
  Calendar,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Share2
} from 'lucide-react'

interface Bet {
  id: string
  description: string
  sport: string
  stakeAmount: number
  odds: number
  status: 'PENDING' | 'ACTIVE' | 'SETTLED' | 'CANCELLED'
  proposer: {
    id: string
    username: string
  }
  acceptor?: {
    id: string
    username: string
  }
  createdAt: string
  updatedAt: string
}

export default function ChallengeBet() {
  const { betId } = useParams<{ betId: string }>()
  const navigate = useNavigate()
  const { user, token, login, register } = useAuthStore()
  const [bet, setBet] = useState<Bet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQuickRegister, setShowQuickRegister] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!betId) {
      setError('Invalid bet link')
      setLoading(false)
      return
    }

    fetchBet()
  }, [betId])

  const fetchBet = async () => {
    try {
      const response = await fetch(`/api/bets/${betId}`)
      if (!response.ok) {
        throw new Error('Bet not found')
      }
      const betData = await response.json()
      setBet(betData)
    } catch (error) {
      setError('Bet not found or no longer available')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    const challengeUrl = `${window.location.origin}/challenge/${betId}`
    try {
      await navigator.clipboard.writeText(challengeUrl)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link')
    }
  }

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register({
        email: registerForm.email,
        password: registerForm.password,
        username: registerForm.username
      })
      setShowQuickRegister(false)
      // After successful registration, accept the bet
      handleAcceptBet()
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed')
    }
  }

  const handleAcceptBet = async () => {
    if (!bet || !token) return

    setAccepting(true)
    try {
      const response = await fetch(`/api/bets/${bet.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to accept bet')
      }

      // Navigate to dashboard after accepting
      navigate('/dashboard')
    } catch (error) {
      setError('Failed to accept bet')
    } finally {
      setAccepting(false)
    }
  }

  const handleAcceptClick = () => {
    if (!user) {
      setShowQuickRegister(true)
    } else {
      handleAcceptBet()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatField = (field: string) => {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      .replace(/yesvsno/gi, 'Yes vs No')
      .replace(/novsyes/gi, 'No vs Yes')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-neon-green mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading challenge...</p>
        </div>
      </div>
    )
  }

  if (error || !bet) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Challenge Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This bet challenge is not available'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-neon-green text-dark-bg font-semibold rounded-lg hover:bg-neon-green/90 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  if (bet.status !== 'PENDING') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <CheckCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Challenge No Longer Available</h1>
          <p className="text-gray-400 mb-2">This bet has been {bet.status.toLowerCase()}</p>
          <p className="text-gray-500 text-sm mb-6">
            {bet.acceptor ? `Accepted by ${bet.acceptor.username}` : 'Bet is no longer active'}
          </p>
          <button
            onClick={() => navigate('/browse-bets')}
            className="px-6 py-3 bg-neon-green text-dark-bg font-semibold rounded-lg hover:bg-neon-green/90 transition-colors"
          >
            Browse Other Bets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-neon-green/20 to-neon-blue/20 border-b border-neon-green/30">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Bet Challenge</h1>
              <p className="text-gray-400">Accept this challenge and win big!</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-2 px-4 py-2 glass-card rounded-lg hover:bg-neon-green/10 transition-colors"
            >
              <Share2 className="w-4 h-4 text-neon-green" />
              <span className="text-sm text-gray-300">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bet Details */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 bg-neon-green/20 text-neon-green text-sm rounded-full border border-neon-green/30">
                  {bet.sport}
                </span>
                <span className="px-3 py-1 bg-warning/20 text-warning text-sm rounded-full border border-warning/30">
                  {bet.odds}x Odds
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {formatField(bet.description)}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Created by {bet.proposer.username}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(bet.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Stake Amount</p>
              <p className="text-3xl font-bold text-neon-green">KES {bet.stakeAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Accept Button */}
          <div className="border-t border-dark-border pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold mb-1">Ready to take the challenge?</p>
                <p className="text-gray-400 text-sm">
                  Accept this bet and compete against {bet.proposer.username}
                </p>
              </div>
              <button
                onClick={handleAcceptClick}
                disabled={accepting}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-green to-emerald-600 text-dark-bg font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                    <span>Accepting...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>Accept Challenge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="card">
          <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-neon-green text-sm font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Accept the Challenge</p>
                <p className="text-gray-400 text-sm">Click "Accept Challenge" to take on this bet</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-neon-green text-sm font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Stake the Amount</p>
                <p className="text-gray-400 text-sm">KES {bet.stakeAmount.toLocaleString()} will be staked from your wallet</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-neon-green text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Wait for Result</p>
                <p className="text-gray-400 text-sm">Winner takes KES {(bet.stakeAmount * 2).toLocaleString()} (minus platform fee)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Register Modal */}
      {showQuickRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Quick Register</h3>
            <p className="text-gray-400 mb-6">Create an account to accept this challenge</p>
            
            <form onSubmit={handleQuickRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
                  placeholder="Create a password"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-danger/20 border border-danger/30 rounded-lg">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowQuickRegister(false)}
                  className="flex-1 px-4 py-2 bg-dark-card border border-dark-border text-gray-300 rounded-lg hover:bg-dark-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-neon-green text-dark-bg font-semibold rounded-lg hover:bg-neon-green/90 transition-colors"
                >
                  Register & Accept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
