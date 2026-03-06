import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  Wallet, 
  TrendingUp, 
  PlusCircle, 
  Search, 
  Activity,
  Eye,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Brain,
  Target,
  BarChart3,
  Trophy
} from 'lucide-react'

export default function Dashboard() {
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)
  const hasHydrated = useAuthStore(state => state.hasHydrated)
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBets: 0,
    totalVolume: 0,
    recentActivity: []
  })

  useEffect(() => {
    if (!hasHydrated) return
    if (!user || !token) {
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false

    const loadAll = async () => {
      try {
        const stored = localStorage.getItem('auth-storage')
        if (!stored) { navigate('/login', { replace: true }); return }
        const parsed = JSON.parse(stored)
        const storedToken = parsed?.state?.token
        if (!storedToken) { navigate('/login', { replace: true }); return }
        
        // Fetch balance
        const balanceRes = await fetch('/api/wallet/balance', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        })
        if (balanceRes.status === 401) { navigate('/login', { replace: true }); return }
        if (balanceRes.status === 429) { return }
        if (balanceRes.ok && !cancelled) {
          const data = await balanceRes.json()
          setBalance(data.balance ?? 0)
        }

        // Fetch stats
        const statsRes = await fetch('/api/bets/stats', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        })
        if (statsRes.status === 429) { return }
        if (statsRes.ok && !cancelled) {
          const data = await statsRes.json()
          setStats({
            totalUsers: data.totalUsers ?? 0,
            activeBets: data.activeBets ?? 0,
            totalVolume: data.totalVolume ?? 0,
            recentActivity: data.recentActivity ?? []
          })
        }

      } catch (error) {
        // silent fail
      }
    }

    loadAll()

    const handleBalanceUpdate = (event: any) => {
      const newBalance = event.detail?.balance ?? 0
      setBalance(newBalance)
    }

    window.addEventListener('balance_update', handleBalanceUpdate)

    return () => {
      cancelled = true
      window.removeEventListener('balance_update', handleBalanceUpdate)
    }
  }, [hasHydrated, user, token, navigate])

  const quickActions = [
    { icon: Wallet, label: 'Deposit Money', description: 'Add funds to your wallet', href: '/wallet', color: 'from-neon-green to-emerald-600', pulse: true },
    { icon: PlusCircle, label: 'Create Bet', description: 'Start a new betting challenge', href: '/create-bet', color: 'from-neon-blue to-blue-600', pulse: false },
    { icon: Search, label: 'Browse Bets', description: 'Find bets to accept', href: '/browse-bets', color: 'from-neon-purple to-purple-600', pulse: false },
    { icon: Trophy, label: 'Leaderboard', description: 'View rankings', href: '/leaderboard', color: 'from-yellow-500 to-orange-600', pulse: false }
  ]

  const formatField = (field: string) => {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000)
      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      return `${Math.floor(diffMins / 1440)}d ago`
    } catch { return 'Invalid Date' }
  }


  return (
    <div className="min-h-screen bg-dark-bg pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 glow-text">
            Welcome back, {user?.username}! 🚀
          </h1>
          <p className="text-gray-400 text-lg">Track your bets and discover new opportunities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card group hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8 text-neon-green" />
              <span className="text-xs text-gray-500">Balance</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-1">
              KES {(balance ?? 0).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500">Current Balance</p>
          </div>

          <div className="card group hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-neon-blue" />
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-1">{stats.activeBets}</h3>
            <p className="text-sm text-gray-500">Active Bets</p>
            {stats.activeBets > 0 && (
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-400">Live</span>
              </div>
            )}
          </div>

          <div className="card group hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-warning" />
              <span className="text-xs text-gray-500">Volume</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-1">
              KES {(stats.totalVolume ?? 0).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500">Total Volume</p>
          </div>

          <div className="card group hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-purple-500" />
              <span className="text-xs text-gray-500">Users</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-1">{stats.totalUsers}</h3>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={index}
                  to={action.href}
                  className={`flex items-center justify-between p-4 glass-card rounded-xl hover:border-neon-green/50 transition-all duration-300 group relative overflow-hidden`}
                >
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{action.label}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 relative z-10" />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-300">Recent Activity</h2>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {(stats.recentActivity ?? []).length > 0 ? (
                (stats.recentActivity ?? []).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 glass-card rounded-xl hover:border-neon-green/50 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity?.status === 'ACTIVE' ? 'bg-success' :
                        activity?.status === 'PENDING' ? 'bg-warning' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-300">{formatField(activity?.type ?? '')}</p>
                        <p className="text-sm text-gray-500">{formatDate(activity?.createdAt ?? '')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neon-green">KES {(activity?.amount ?? 0).toLocaleString()}</p>
                      <span className={`badge badge-${
                        activity?.status === 'ACTIVE' ? 'success' :
                        activity?.status === 'PENDING' ? 'warning' : 'info'
                      }`}>
                        {activity?.status ?? 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          <AISuggestions />
        </div>
      </div>
    </div>
  )
}

function AISuggestions() {
  const token = useAuthStore(state => state.token)
  const hasHydrated = useAuthStore(state => state.hasHydrated)
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!hasHydrated) return
    if (!token) { return }
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/ai/suggestions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.status === 429) { if (!cancelled) { setMessage('Too many requests. Try again later.') }; return }
        if (res.ok && !cancelled) {
          const data = await res.json()
          if ((data.suggestions ?? []).length === 0) {
            setMessage(data.message || 'Place 5+ bets to unlock personalized suggestions')
          } else {
            setSuggestions(data.suggestions)
          }
        }
      } catch {
        if (!cancelled) setMessage('Failed to load suggestions')
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (message || suggestions.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-300">AI Suggestions 🤖</h2>
          <Brain className="w-5 h-5 text-gray-500" />
        </div>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">{message || 'No suggestions yet'}</p>
          <p className="text-sm text-gray-400">Place 5+ bets to unlock personalized suggestions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-300">Suggested For You 🎯</h2>
        <Brain className="w-5 h-5 text-gray-500" />
      </div>
      <div className="space-y-4">
        {suggestions.map((suggestion: any, index: number) => (
          <div key={index} className="p-4 glass-card rounded-xl hover:border-neon-green/50 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                (suggestion?.confidence ?? 0) > 60 ? 'bg-green-500/20 text-green-400' :
                (suggestion?.confidence ?? 0) > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {(suggestion?.confidence ?? 0) > 60 ? '🔥 High' :
                 (suggestion?.confidence ?? 0) > 40 ? '⚡ Medium' : '🎲 Low'}
              </div>
            </div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-16">
                <h3 className="font-medium text-gray-300 mb-1 group-hover:text-neon-green transition-colors">
                  {suggestion?.title ?? 'Untitled Bet'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  <span className="badge badge-info">{suggestion?.sport ?? 'Unknown'}</span>
                  <span>KES {(suggestion?.stakeAmount ?? 0).toLocaleString()}</span>
                  <span>{suggestion?.odds ?? 1}x</span>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Why this bet?</div>
              <div className="flex flex-wrap gap-1">
                {(suggestion?.suggestionReasons ?? []).map((reason: string, idx: number) => (
                  <span key={idx} className="text-xs bg-neon-green/10 text-neon-green px-2 py-1 rounded">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                by {suggestion?.proposer?.username ?? 'Anonymous'}
              </div>
              <button className="btn btn-primary text-sm">
                <Target className="w-4 h-4 mr-1" />
                View Bet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}