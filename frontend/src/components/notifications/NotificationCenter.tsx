import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Settings, 
  Filter,
  Trash2,
  Archive,
  Star,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  AlertTriangle,
  Gift,
  Zap
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'bet' | 'social' | 'system' | 'achievement' | 'promotion' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All', icon: Bell },
  { value: 'bet', label: 'Bets', icon: TrendingUp },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'system', label: 'System', icon: AlertTriangle },
  { value: 'achievement', label: 'Achievements', icon: Star },
  { value: 'promotion', label: 'Promotions', icon: Gift }
];

const PRIORITY_COLORS = {
  low: 'text-gray-400',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500'
};

const TYPE_ICONS = {
  bet: TrendingUp,
  social: Users,
  system: AlertTriangle,
  achievement: Star,
  promotion: Gift,
  reminder: Clock
};

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const toggleStar = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${notificationId}/star`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, starred: !n.starred } : n)
      );
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false;
    if (filter !== 'all' && n.type !== filter) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return !n.archived;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="absolute right-4 top-4 w-96 max-h-[80vh] glass-card rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-neon-green" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-neon-green text-dark-bg text-xs rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-dark-card rounded-lg transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-dark-card rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-dark-border space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white placeholder-gray-500 text-sm"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Type Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {NOTIFICATION_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    filter === type.value
                      ? 'bg-neon-green text-dark-bg'
                      : 'bg-dark-card text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`text-xs font-medium transition-colors ${
                showUnreadOnly ? 'text-neon-green' : 'text-gray-400 hover:text-white'
              }`}
            >
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-neon-green hover:text-neon-green/90 transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50" />
              <p className="text-gray-400">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {filteredNotifications.map(notification => {
                const Icon = TYPE_ICONS[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-dark-card/30 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-neon-green/5' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'bet' ? 'bg-blue-500/20 text-blue-500' :
                        notification.type === 'social' ? 'bg-purple-500/20 text-purple-500' :
                        notification.type === 'system' ? 'bg-red-500/20 text-red-500' :
                        notification.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-500' :
                        notification.type === 'promotion' ? 'bg-green-500/20 text-green-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={`text-sm font-medium ${
                                notification.read ? 'text-gray-300' : 'text-white font-semibold'
                              }`}>
                                {notification.title}
                              </h3>
                              <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[notification.priority]}`} />
                            </div>
                            <p className={`text-sm ${
                              notification.read ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                            {notification.actionUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = notification.actionUrl;
                                }}
                                className="text-xs text-neon-green hover:text-neon-green/90 mt-2 transition-colors"
                              >
                                {notification.actionText || 'View Details'}
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(notification.id);
                              }}
                              className={`p-1 rounded transition-colors ${
                                notification.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${notification.starred ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-600">
                            {formatTime(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-neon-green rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={() => window.location.href = '/notifications/settings'}
            className="w-full py-2 bg-dark-card hover:bg-dark-border rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
            Notification Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification Settings Component
export function NotificationSettings() {
  const [settings, setSettings] = useState({
    betNotifications: true,
    socialNotifications: true,
    systemNotifications: true,
    achievementNotifications: true,
    promotionNotifications: false,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
      
      <div className="glass-card rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Notification Types</h3>
        
        {Object.entries(settings).filter(([key]) => key.includes('Notifications')).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium capitalize">
                {key.replace('Notifications', ' Notifications')}
              </p>
              <p className="text-sm text-gray-400">
                Get notified about {key.replace('Notifications', '').toLowerCase()} activities
              </p>
            </div>
            <button
              onClick={() => updateSetting(key, !value)}
              className={`w-12 h-6 rounded-full transition-colors ${
                value ? 'bg-neon-green' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                value ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Delivery Methods</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Email Notifications</p>
            <p className="text-sm text-gray-400">Receive notifications via email</p>
          </div>
          <button
            onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.emailNotifications ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Push Notifications</p>
            <p className="text-sm text-gray-400">Receive push notifications in browser</p>
          </div>
          <button
            onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.pushNotifications ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Sound Effects</p>
            <p className="text-sm text-gray-400">Play sound for new notifications</p>
          </div>
          <button
            onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.soundEnabled ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}
