import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, PlusCircle, List, Wallet, User, LogOut, Settings,
  Menu, X, TrendingUp, ShieldCheck, Bell, MessageSquare, Share,
  Trophy, Star, Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const token = useAuthStore(state => state.token);
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const addNotification = useNotificationStore(state => state.addNotification);
  const markAsRead = useNotificationStore(state => state.markAsRead);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/browse-bets', label: 'Browse Bets', icon: Search },
    { path: '/feed', label: 'Social Feed', icon: Share },
    { path: '/create-bet', label: 'Create Bet', icon: PlusCircle },
    { path: '/rooms', label: 'Rooms', icon: MessageSquare },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/tipsters', label: 'Tipsters', icon: Star },
    { path: '/my-bets', label: 'My Bets', icon: List },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
    ...(user?.role === 'ADMIN' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheck }] : [])
  ];

  // Fetch balance ONCE on mount then poll every 60 seconds
  useEffect(() => {
    if (!user || !token) return;

    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/wallet/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 429) return; // rate limited — silent skip
        if (res.status === 401) return; // token expired — silent skip
        if (!res.ok) return;
        const data = await res.json();
        setBalance(data.balance ?? 0);
      } catch {
        // silent fail — never setState on error
      }
    };

    fetchBalance(); // once on mount
    const interval = setInterval(fetchBalance, 60000); // then every 60s
    return () => clearInterval(interval);
  }, []); // EMPTY — registers once, never re-registers

  // Real-time balance updates from socket events
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      const newBalance = event.detail?.balance ?? 0;
      setBalance(newBalance);
    };

    const handleNewBet = (event: CustomEvent) => {
      addNotification({
        type: 'bet',
        title: '🔥 Bet Created',
        message: event.detail?.description || 'Your bet is now live!'
      });
    };

    const handleBetAccepted = () => {
      addNotification({
        type: 'bet',
        title: '⚡ Bet Accepted',
        message: 'Someone accepted your bet! Good luck!'
      });
    };

    const handleNotification = (event: CustomEvent) => {
      addNotification(event.detail);
    };

    window.addEventListener('balance_update', handleBalanceUpdate as EventListener);
    window.addEventListener('new_bet', handleNewBet as EventListener);
    window.addEventListener('bet_accepted', handleBetAccepted as EventListener);
    window.addEventListener('notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('balance_update', handleBalanceUpdate as EventListener);
      window.removeEventListener('new_bet', handleNewBet as EventListener);
      window.removeEventListener('bet_accepted', handleBetAccepted as EventListener);
      window.removeEventListener('notification', handleNotification as EventListener);
    };
  }, []); // EMPTY — registers once

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'balance': return <Wallet className="w-4 h-4 text-green-500" />;
      case 'bet': return <Trophy className="w-4 h-4 text-blue-500" />;
      case 'challenge': return <Share className="w-4 h-4 text-purple-500" />;
      case 'win': return <Zap className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-dark-bg" />
              </div>
              <span className="text-xl font-bold glow-text group-hover:text-neon-green transition-colors">
                P2P Betting
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-neon-green bg-neon-green/10 border border-neon-green/30'
                      : 'text-gray-300 hover:text-white hover:bg-dark-card/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side: notifications + balance + profile */}
          <div className="hidden md:flex items-center space-x-4">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-dark-card/50 transition-colors group"
              >
                <Bell className="w-5 h-5 text-gray-300 group-hover:text-neon-green transition-colors" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-xl border border-dark-border max-h-96 overflow-y-auto z-50">
                  <div className="p-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification: any) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-dark-border hover:bg-dark-card/30 cursor-pointer transition-all duration-200 ${
                            !notification.read ? 'bg-neon-green/5 border-l-2 border-l-neon-green' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-300">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Balance */}
            <div className="glass-card px-4 py-2 rounded-xl relative overflow-hidden">
              <div className="flex items-center space-x-2 relative z-10">
                <Wallet className="w-4 h-4 text-neon-green" />
                <span className="text-sm text-gray-400">Balance</span>
                <span className="text-lg font-bold text-neon-green">
                  KES {balance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-card/50 transition-all duration-300 group"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {user?.username || 'User'}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-xl border border-dark-border z-50">
                  <div className="p-2">
                    <Link
                      to={`/profile/${user?.username}`}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-dark-card/50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-dark-card/50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-dark-card/50 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-gray-300" /> : <Menu className="w-6 h-6 text-gray-300" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-border">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-neon-green bg-neon-green/10 border border-neon-green/30'
                        : 'text-gray-300 hover:text-white hover:bg-dark-card/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 p-3 glass-card rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-neon-green" />
                  <span className="text-sm text-gray-400">Balance</span>
                </div>
                <span className="text-lg font-bold text-neon-green">KES {balance.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}