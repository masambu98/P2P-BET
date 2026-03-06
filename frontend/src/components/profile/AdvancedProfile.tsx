import { useState, useEffect } from 'react';
import { 
  User, 
  Trophy, 
  TrendingUp, 
  Calendar,
  MapPin, 
  Link as LinkIcon,
  Twitter,
  Instagram,
  Edit,
  Share2,
  MessageSquare,
  Users,
  Award,
  Target,
  CheckCircle,
  Camera
} from 'lucide-react';
import { useParams } from 'react-router-dom';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  level: number;
  experience: number;
  stats: {
    totalBets: number;
    totalWins: number;
    winRate: number;
    totalWinnings: number;
    currentStreak: number;
    bestStreak: number;
    followers: number;
    following: number;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
  }>;
  badges: string[];
  socialLinks: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  location?: string;
  joinedAt: Date;
  isVerified: boolean;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

interface RecentActivity {
  id: string;
  type: 'bet' | 'win' | 'achievement' | 'follow';
  description: string;
  timestamp: Date;
  metadata?: any;
}

export default function AdvancedProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'activity'>('overview');

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const targetUsername = username || 'current-user';
      
      const [profileResponse, activityResponse] = await Promise.all([
        fetch(`/api/users/${targetUsername}/profile`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }),
        fetch(`/api/users/${targetUsername}/activity`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
      ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${profile.id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          isFollowing: !prev.isFollowing,
          stats: {
            ...prev.stats,
            followers: prev.isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1
          }
        } : null);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-purple-500';
    if (level >= 25) return 'text-yellow-500';
    if (level >= 10) return 'text-blue-500';
    return 'text-gray-400';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return 'text-green-500';
    if (winRate >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Cover Photo and Profile Header */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-neon-green to-neon-blue opacity-20" />
        
        {/* Profile Info */}
        <div className="max-w-6xl mx-auto px-6 -mt-16">
          <div className="flex items-end space-x-6 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full border-4 border-dark-bg overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              {profile.isOwnProfile && (
                <button className="absolute bottom-0 right-0 p-2 bg-neon-green text-dark-bg rounded-full hover:bg-neon-green/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
              {profile.isVerified && (
                <div className="absolute top-0 right-0 p-1 bg-blue-500 rounded-full">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {profile.displayName}
                </h1>
                <span className="text-gray-400">@{profile.username}</span>
                {profile.isVerified && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              
              <p className="text-gray-300 mb-3 max-w-2xl">{profile.bio}</p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(profile.joinedAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span className={getLevelColor(profile.level)}>
                    Level {profile.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {!profile.isOwnProfile && (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      profile.isFollowing
                        ? 'bg-dark-card text-white hover:bg-dark-border'
                        : 'bg-neon-green text-dark-bg hover:bg-neon-green/90'
                    }`}
                  >
                    {profile.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="p-2 bg-dark-card hover:bg-dark-border rounded-lg transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </>
              )}
              <button className="p-2 bg-dark-card hover:bg-dark-border rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              {profile.isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 bg-dark-card hover:bg-dark-border rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.stats.totalBets}</p>
              <p className="text-sm text-gray-400">Total Bets</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${getWinRateColor(profile.stats.winRate)}`}>
                {profile.stats.winRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                KES {profile.stats.totalWinnings.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Total Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">
                {profile.stats.currentStreak}
              </p>
              <p className="text-sm text-gray-400">Current Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.stats.followers}</p>
              <p className="text-sm text-gray-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.stats.following}</p>
              <p className="text-sm text-gray-400">Following</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-dark-card rounded-lg p-1 mb-6">
            {(['overview', 'stats', 'achievements', 'activity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-neon-green text-dark-bg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Badges */}
              {profile.badges.length > 0 && (
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-neon-green/20 to-neon-blue/20 border border-neon-green/30 rounded-full text-sm font-medium text-neon-green"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-dark-card/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'win' ? 'bg-green-500/20 text-green-500' :
                        activity.type === 'bet' ? 'bg-blue-500/20 text-blue-500' :
                        activity.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-purple-500/20 text-purple-500'
                      }`}>
                        {activity.type === 'win' ? <Trophy className="w-4 h-4" /> :
                         activity.type === 'bet' ? <Target className="w-4 h-4" /> :
                         activity.type === 'achievement' ? <Award className="w-4 h-4" /> :
                         <Users className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{activity.description}</p>
                        <p className="text-sm text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Social Links */}
              {Object.values(profile.socialLinks).some(link => link) && (
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
                  <div className="space-y-3">
                    {profile.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${profile.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                        <span>@{profile.socialLinks.twitter}</span>
                      </a>
                    )}
                    {profile.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${profile.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-gray-400 hover:text-pink-500 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        <span>@{profile.socialLinks.instagram}</span>
                      </a>
                    )}
                    {profile.socialLinks.website && (
                      <a
                        href={profile.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 text-gray-400 hover:text-neon-green transition-colors"
                      >
                        <LinkIcon className="w-5 h-5" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Experience</span>
                    <span className="text-white font-medium">{profile.experience.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Best Streak</span>
                    <span className="text-yellow-500 font-medium">{profile.stats.bestStreak}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Achievements</span>
                    <span className="text-purple-500 font-medium">{profile.achievements.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Detailed Statistics</h3>
            {/* Stats content would go here */}
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">Detailed statistics visualization would be displayed here</p>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.achievements.map(achievement => (
                <div key={achievement.id} className="bg-dark-card/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <h4 className="font-medium text-white">{achievement.name}</h4>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Unlocked {formatDate(achievement.unlockedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">All Activity</h3>
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center space-x-3 p-4 bg-dark-card/50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'win' ? 'bg-green-500/20 text-green-500' :
                    activity.type === 'bet' ? 'bg-blue-500/20 text-blue-500' :
                    activity.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-purple-500/20 text-purple-500'
                  }`}>
                    {activity.type === 'win' ? <Trophy className="w-5 h-5" /> :
                     activity.type === 'bet' ? <Target className="w-5 h-5" /> :
                     activity.type === 'achievement' ? <Award className="w-5 h-5" /> :
                     <Users className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.description}</p>
                    <p className="text-sm text-gray-400">{formatDate(activity.timestamp)} at {new Date(activity.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
