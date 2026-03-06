import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  User, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Target,
  DollarSign,
  Star,
  Users,
  FollowButton,
  MessageCircle,
  Share2,
  Award,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  avatar?: string
  email?: string
  joinedAt: string
  totalBets: number
  wonBets: number
  lostBets: number
  winRate: number
  totalWon: number
  totalWagered: number
  biggestWin: number
  favouriteSport?: string
  currentStreak: number
  bestStreak: number
  isFollowing?: boolean
  followersCount: number
  followingCount: number
}

interface PublicBet {
  id: string
  title: string
  sport: string
  stakeAmount: number
  odds: number
  status: 'PENDING' | 'ACTIVE' | 'SETTLED' | 'CANCELLED'
  result?: 'WON' | 'LOST'
  createdAt: string
  settledAt?: string
  potentialWin: number
}

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentBets, setRecentBets] = useState<PublicBet[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (!username) return

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${username}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const profileData = await response.json()
          setProfile(profileData.user)
          setRecentBets(profileData.recentBets || [])
          setIsFollowing(profileData.user.isFollowing || false)
        } else if (response.status === 404) {
          // User not found
          navigate('/404')
        } else if (response.status === 401) {
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username, token, navigate])

  const handleFollow = async () => {
    if (!user || !token) {
      window.location.href = '/login'
      return
    }

    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const response = await fetch(`/api/users/${profile?.id}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setIsFollowing(!isFollowing)
        setProfile(prev => prev ? {
          ...prev,
          followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        } : null)
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const getBetResultIcon = (bet: PublicBet) => {
    if (bet.status !== 'SETTLED') return null
    if (bet.result === 'WON') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (bet.result === 'LOST') return <XCircle className="w-4 h-4 text-red-500" />
    return null
  }

  const getBetResultColor = (bet: PublicBet) => {
    if (bet.status !== 'SETTLED') return 'text-gray-400'
    if (bet.result === 'WON') return 'text-green-500'
    if (bet.result === 'LOST') return 'text-red-500'
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">User not found</h2>
          <Link to="/feed" className="btn btn-primary">
            Back to Feed
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-r from-neon-blue to-purple-600 rounded-full flex items-center justify-center">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-300">{profile.username}</h1>
                  {isOwnProfile && (
                    <span className="badge badge-success">You</span>
                  )}
                </div>
                <p className="text-gray-500 mb-4">
                  Joined {formatDate(profile.joinedAt)}
                </p>

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="font-bold text-gray-300">{profile.followersCount}</span>
                    <span className="text-gray-500 ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-300">{profile.followingCount}</span>
                    <span className="text-gray-500 ml-1">following</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-300">{profile.totalBets}</span>
                    <span className="text-gray-500 ml-1">bets</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} flex items-center space-x-2`}
                >
                  <Users className="w-4 h-4" />
                  <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                </button>
              )}
              <button className="btn btn-secondary flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </button>
              <button className="btn btn-secondary flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              {isOwnProfile && (
                <Link to="/settings" className="btn btn-primary">
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-green to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-neon-green mb-1">
              {profile.winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Win Rate</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-yellow-500 mb-1">
              {formatCurrency(profile.totalWon)}
            </p>
            <p className="text-sm text-gray-500">Total Won</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-purple-500 mb-1">
              {formatCurrency(profile.biggestWin)}
            </p>
            <p className="text-sm text-gray-500">Biggest Win</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-blue-500 mb-1">
              {profile.bestStreak}W
            </p>
            <p className="text-sm text-gray-500">Best Streak</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-neon-green" />
              Performance Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Bets</span>
                <span className="font-medium text-gray-300">{profile.totalBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Won Bets</span>
                <span className="font-medium text-green-500">{profile.wonBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lost Bets</span>
                <span className="font-medium text-red-500">{profile.lostBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Streak</span>
                <span className="font-medium text-gray-300">
                  {profile.currentStreak > 0 ? `${profile.currentStreak}W` : 
                   profile.currentStreak < 0 ? `${Math.abs(profile.currentStreak)}L` : '-'}
                </span>
              </div>
              {profile.favouriteSport && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Favourite Sport</span>
                  <span className="font-medium text-gray-300">{profile.favouriteSport}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-500" />
              Financial Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Won</span>
                <span className="font-medium text-green-500">{formatCurrency(profile.totalWon)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Wagered</span>
                <span className="font-medium text-gray-300">{formatCurrency(profile.totalWagered)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Profit/Loss</span>
                <span className={`font-medium ${profile.totalWon - profile.totalWagered >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(profile.totalWon - profile.totalWagered)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Biggest Win</span>
                <span className="font-medium text-yellow-500">{formatCurrency(profile.biggestWin)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bet History */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-300 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-neon-blue" />
              Recent Bet History
            </h3>
            {isOwnProfile && (
              <Link to="/my-bets" className="btn btn-secondary text-sm">
                View All
              </Link>
            )}
          </div>

          {recentBets.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No public bets yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBets.map((bet) => (
                <div key={bet.id} className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-300 mb-1">{bet.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{bet.sport}</span>
                        <span>KES {bet.stakeAmount.toLocaleString()}</span>
                        <span>{bet.odds}x odds</span>
                        <span>{formatTimeAgo(bet.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className={`font-medium ${getBetResultColor(bet)}`}>
                          {bet.status === 'SETTLED' ? bet.result : bet.status}
                        </p>
                        {bet.status === 'SETTLED' && (
                          <p className="text-sm text-gray-500">
                            {bet.result === 'WON' ? '+' : '-'}{formatCurrency(bet.potentialWin)}
                          </p>
                        )}
                      </div>
                      {getBetResultIcon(bet)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
