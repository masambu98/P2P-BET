import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlusCircle, 
  MessageSquare, 
  User, 
  Menu,
  X,
  Bell,
  Wallet,
  TrendingUp,
  ChevronUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [balance, setBalance] = useState(0);
  
  const location = useLocation();
  const { isConnected } = useSocket({ autoConnect: true });
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/browse-bets', label: 'Browse', icon: Search },
    { path: '/create-bet', label: 'Create', icon: PlusCircle },
    { path: '/feed', label: 'Feed', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  // Handle scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/wallet/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance || 0);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-dark-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-dark-card rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-dark-bg" />
              </div>
              <span className="text-lg font-bold glow-text">P2P Betting</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>

            {/* Notifications */}
            <Link to="/notifications" className="relative p-2 hover:bg-dark-card rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Quick Balance */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-dark-card rounded-lg">
              <Wallet className="w-4 h-4 text-neon-green" />
              <span className="text-sm font-bold text-neon-green">
                {balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div className="glass-card w-80 h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-dark-card rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Section */}
              <div className="flex items-center space-x-3 p-3 bg-dark-card rounded-lg mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">{user?.username || 'User'}</div>
                  <div className="text-sm text-gray-400">Level 12</div>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-neon-green/20 text-neon-green border-l-4 border-neon-green'
                          : 'hover:bg-dark-card text-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Additional Options */}
              <div className="mt-6 pt-6 border-t border-dark-border space-y-2">
                <Link
                  to="/wallet"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-dark-card text-gray-300 transition-colors"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Wallet</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-dark-card text-gray-300 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card border-t border-dark-border z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  active
                    ? 'text-neon-green'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className={`relative ${active ? 'animate-pulse' : ''}`}>
                  <Icon className="w-5 h-5" />
                  {item.path === '/feed' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-50 p-3 bg-neon-green text-dark-bg rounded-full shadow-lg hover:bg-neon-green/90 transition-all duration-300 animate-bounce"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-red-500/20 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm text-center">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span>Connection lost. Reconnecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile-specific components
export function MobileCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

export function MobileButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-neon-green text-dark-bg hover:bg-neon-green/90',
    secondary: 'bg-dark-card text-white hover:bg-dark-border',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function MobileInput({ 
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error = '',
  className = ''
}: {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-dark-card border rounded-lg focus:outline-none focus:border-neon-green text-white placeholder-gray-500 ${
          error ? 'border-red-500' : 'border-dark-border'
        }`}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
