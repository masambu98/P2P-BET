import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { 
  Star, 
  Trophy, 
  TrendingUp, 
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Eye,
  Lock,
  ShoppingCart,
  Crown,
  Award,
  Target,
  Calendar
} from 'lucide-react'

interface Tipster {
  id: string
  userId: string
  username: string
  avatar?: string
  bio?: string
  pricePerPick: number
  totalPicks: number
  winningPicks: number
  winRate: number
  totalRevenue: number
  totalTips: number
  approvedAt?: string
}

interface Tip {
  id: string
  title: string
  description: string
  sport: string
  category: string
  prediction: string
  odds: number
  stakeAmount: number
  price: number
  status: string
  result?: string
  analysis?: string
  expiresAt: string
  createdAt: string
  isPurchased: boolean
  tipster: {
    id: string
    username: string
    avatar?: string
    pricePerPick: number
    winRate: number
  }
}

export default function Tipsters() {
  const { user, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'tipsters' | 'tips' | 'my-tips'>('tipsters')
  const [tipsters, setTipsters] = useState<Tipster[]>([])
  const [tips, setTips] = useState<Tip[]>([])
  const [myTips, setMyTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState('all')
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null)
  const [applicationForm, setApplicationForm] = useState({
    bio: '',
    pricePerPick: 100
  })

  useEffect(() => {
    if (!user || !token) {
      window.location.href = '/login'
      return
    }

    if (activeTab === 'tipsters') {
      fetchTipsters()
    } else if (activeTab === 'tips') {
      fetchTips()
    } else if (activeTab === 'my-tips') {
      fetchMyTips()
    }
  }, [user, token, activeTab])

  const fetchTipsters = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tipsters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const tipstersData = await response.json()
        setTipsters(tipstersData)
      }
    } catch (error) {
      console.error('Failed to fetch tipsters:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTips = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedSport !== 'all') params.append('sport', selectedSport)
      
      const response = await fetch(`/api/tipsters/tips?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const tipsData = await response.json()
        setTips(tipsData)
      }
    } catch (error) {
      console.error('Failed to fetch tips:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyTips = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tipsters/my-tips', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const myTipsData = await response.json()
        setMyTips(myTipsData)
      }
    } catch (error) {
      console.error('Failed to fetch my tips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyForTipster = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/tipsters/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationForm)
      })
      
      if (response.ok) {
        setShowApplicationModal(false)
        setApplicationForm({ bio: '', pricePerPick: 100 })
        // Show success message
        alert('Application submitted successfully! Pending admin approval.')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Failed to apply for tipster:', error)
      alert('Failed to submit application')
    }
  }

  const handlePurchaseTip = async (tipId: string) => {
    try {
      const response = await fetch('/api/tipsters/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipId })
      })
      
      if (response.ok) {
        const result = await response.json()
        // Show tip details in modal
        setSelectedTip({
          ...result.tip,
          tipster: {
            id: '',
            username: '',
            avatar: '',
            pricePerPick: 0,
            winRate: 0
          }
        })
        setShowTipModal(true)
        // Refresh tips
        fetchTips()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to purchase tip')
      }
    } catch (error) {
      console.error('Failed to purchase tip:', error)
      alert('Failed to purchase tip')
    }
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`
  }

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

  const filteredTipsters = tipsters.filter(tipster =>
    tipster.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sports = ['all', ...Array.from(new Set(tips.map(tip => tip.sport)))]

  const TipsterCard = ({ tipster }: { tipster: Tipster }) => (
    <div className="card group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-purple-600 rounded-full flex items-center justify-center">
            {tipster.avatar ? (
              <img src={tipster.avatar} alt={tipster.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">
                {tipster.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-300">{tipster.username}</h3>
              <Crown className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500">Approved Tipster</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold text-neon-green">
            {tipster.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Win Rate</p>
        </div>
      </div>

      {tipster.bio && (
        <p className="text-gray-400 text-sm mb-4">{tipster.bio}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card p-3 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Total Picks</p>
          <p className="font-bold text-gray-300">{tipster.totalPicks}</p>
        </div>
        <div className="glass-card p-3 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Price/Pick</p>
          <p className="font-bold text-neon-green">{formatCurrency(tipster.pricePerPick)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-gray-500">
          <Trophy className="w-4 h-4 inline mr-1" />
          {tipster.totalTips} tips posted
        </span>
        <span className="text-gray-500">
          <DollarSign className="w-4 h-4 inline mr-1" />
          {formatCurrency(tipster.totalRevenue)} earned
        </span>
      </div>

      <button className="btn btn-primary w-full">
        View Tips
      </button>
    </div>
  )

  const TipCard = ({ tip }: { tip: Tip }) => {
    const isExpired = new Date(tip.expiresAt) < new Date()
    
    return (
      <div className="card group hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-purple-600 rounded-full flex items-center justify-center">
              {tip.tipster.avatar ? (
                <img src={tip.tipster.avatar} alt={tip.tipster.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {tip.tipster.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-300">{tip.tipster.username}</h3>
              <p className="text-xs text-gray-500">{tip.winRate.toFixed(1)}% WR</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-neon-green">{formatCurrency(tip.price)}</p>
            <p className="text-xs text-gray-500">per tip</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-200 mb-2">{tip.title}</h4>
          <p className="text-gray-400 text-sm mb-3">{tip.description}</p>
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="badge badge-info">{tip.sport}</span>
            <span className="badge badge-secondary">{tip.category}</span>
            {tip.isExpired && <span className="badge badge-danger">Expired</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Odds</p>
            <p className="font-bold text-neon-blue">{tip.odds}x</p>
          </div>
          <div className="glass-card p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Expires</p>
            <p className="font-bold text-warning">{formatTimeAgo(tip.expiresAt)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>
            <Clock className="w-4 h-4 inline mr-1" />
            {formatTimeAgo(tip.createdAt)}
          </span>
          <span>
            <Users className="w-4 h-4 inline mr-1" />
            Popular
          </span>
        </div>

        {tip.isPurchased ? (
          <button 
            onClick={() => {
              setSelectedTip(tip)
              setShowTipModal(true)
            }}
            className="btn btn-success w-full flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Tip</span>
          </button>
        ) : (
          <button 
            onClick={() => handlePurchaseTip(tip.id)}
            disabled={isExpired}
            className={`btn w-full flex items-center justify-center space-x-2 ${
              isExpired ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary'
            }`}
          >
            {isExpired ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Expired</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Unlock for {formatCurrency(tip.price)}</span>
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 glow-text">Tipster Marketplace 🌟</h1>
              <p className="text-gray-400">Get expert betting picks from verified tipsters</p>
            </div>
            <button
              onClick={() => setShowApplicationModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Award className="w-4 h-4" />
              <span>Become a Tipster</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-dark-card rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('tipsters')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'tipsters'
                  ? 'bg-neon-green text-dark-bg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Tipsters
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'tips'
                  ? 'bg-neon-green text-dark-bg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Available Tips
            </button>
            <button
              onClick={() => setActiveTab('my-tips')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'my-tips'
                  ? 'bg-neon-green text-dark-bg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              My Tips
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {activeTab === 'tipsters' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tipsters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-card border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
              />
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="flex flex-wrap gap-2 mb-8">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

        {/* Content */}
        {activeTab === 'tipsters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTipsters.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No tipsters found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search' : 'No tipsters available yet'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="btn btn-primary"
                  >
                    Become the First Tipster
                  </button>
                )}
              </div>
            ) : (
              filteredTipsters.map((tipster) => (
                <TipsterCard key={tipster.id} tipster={tipster} />
              ))
            )}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No tips available</h3>
                <p className="text-gray-500">Check back later for new expert tips</p>
              </div>
            ) : (
              tips.map((tip) => (
                <TipCard key={tip.id} tip={tip} />
              ))
            )}
          </div>
        )}

        {activeTab === 'my-tips' && (
          <div className="space-y-6">
            {myTips.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No tips yet</h3>
                <p className="text-gray-500 mb-6">Start sharing your expert picks with the community</p>
                <button className="btn btn-primary">
                  Create Your First Tip
                </button>
              </div>
            ) : (
              myTips.map((tip) => (
                <div key={tip.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-300 text-lg">{tip.title}</h3>
                      <p className="text-gray-500">{formatTimeAgo(tip.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neon-green">{formatCurrency(tip.price)}</p>
                      <p className="text-xs text-gray-500">{tip.purchaseCount} purchases</p>
                    </div>
                  </div>
                  <p className="text-gray-400 mb-4">{tip.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`badge ${
                      tip.status === 'ACTIVE' ? 'badge-success' :
                      tip.status === 'SETTLED_WON' ? 'badge-success' :
                      tip.status === 'SETTLED_LOST' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {tip.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      Revenue: {formatCurrency(tip.price * tip.purchaseCount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">Become a Tipster</h2>
            <form onSubmit={handleApplyForTipster}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  required
                  value={applicationForm.bio}
                  onChange={(e) => setApplicationForm({ ...applicationForm, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green resize-none"
                  rows={4}
                  placeholder="Tell us about your betting expertise..."
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price per Pick (KES)
                </label>
                <input
                  type="number"
                  min="100"
                  max="500"
                  required
                  value={applicationForm.pricePerPick}
                  onChange={(e) => setApplicationForm({ ...applicationForm, pricePerPick: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tip Details Modal */}
      {showTipModal && selectedTip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-300">{selectedTip.title}</h2>
              <button
                onClick={() => setShowTipModal(false)}
                className="text-gray-500 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 mb-4">{selectedTip.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="glass-card p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Sport</p>
                  <p className="font-semibold text-gray-300">{selectedTip.sport}</p>
                </div>
                <div className="glass-card p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-semibold text-gray-300">{selectedTip.category}</p>
                </div>
                <div className="glass-card p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Odds</p>
                  <p className="font-semibold text-neon-blue">{selectedTip.odds}x</p>
                </div>
                <div className="glass-card p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Stake Suggested</p>
                  <p className="font-semibold text-gray-300">{formatCurrency(selectedTip.stakeAmount)}</p>
                </div>
              </div>
              
              <div className="bg-dark-bg rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-300 mb-2">Prediction</h3>
                <p className="text-gray-300">{selectedTip.prediction}</p>
              </div>
              
              {selectedTip.analysis && (
                <div className="bg-dark-bg rounded-lg p-4">
                  <h3 className="font-semibold text-gray-300 mb-2">Analysis</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedTip.analysis}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowTipModal(false)}
              className="btn btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
