import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Toggle,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    betUpdates: true,
    socialActivity: true,
    promotions: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessages: true,
    showBettingHistory: true
  });

  const [appearance, setAppearance] = useState({
    theme: 'dark',
    language: 'en',
    currency: 'KES',
    timezone: 'Africa/Nairobi'
  });

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'about', label: 'Help & About', icon: HelpCircle }
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              defaultValue="John Doe"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              defaultValue="johndoe"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              defaultValue="john@example.com"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              rows={3}
              defaultValue="Passionate bettor and sports enthusiast"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white resize-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-2 pr-10 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
            />
          </div>
        </div>
      </div>

      <button className="px-6 py-2 bg-neon-green text-dark-bg rounded-lg font-medium hover:bg-neon-green/90 transition-colors">
        Save Changes
      </button>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-white">Email Notifications</p>
              <p className="text-sm text-gray-400">Receive updates via email</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              notifications.email ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              notifications.email ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-white">Push Notifications</p>
              <p className="text-sm text-gray-400">Receive push notifications on your device</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              notifications.push ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              notifications.push ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-white">Bet Updates</p>
              <p className="text-sm text-gray-400">Get notified about your bet activities</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, betUpdates: !prev.betUpdates }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              notifications.betUpdates ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              notifications.betUpdates ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-white">Social Activity</p>
              <p className="text-sm text-gray-400">Notifications about follows, comments, etc.</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, socialActivity: !prev.socialActivity }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              notifications.socialActivity ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              notifications.socialActivity ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Trophy className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-white">Promotions</p>
              <p className="text-sm text-gray-400">Receive promotional offers and bonuses</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, promotions: !prev.promotions }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              notifications.promotions ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              notifications.promotions ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Privacy & Security</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
          <select
            value={privacy.profileVisibility}
            onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div>
            <p className="font-medium text-white">Show Online Status</p>
            <p className="text-sm text-gray-400">Let others see when you're online</p>
          </div>
          <button
            onClick={() => setPrivacy(prev => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              privacy.showOnlineStatus ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div>
            <p className="font-medium text-white">Allow Messages</p>
            <p className="text-sm text-gray-400">Let other users send you messages</p>
          </div>
          <button
            onClick={() => setPrivacy(prev => ({ ...prev, allowMessages: !prev.allowMessages }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              privacy.allowMessages ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              privacy.allowMessages ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
          <div>
            <p className="font-medium text-white">Show Betting History</p>
            <p className="text-sm text-gray-400">Display your betting activity on your profile</p>
          </div>
          <button
            onClick={() => setPrivacy(prev => ({ ...prev, showBettingHistory: !prev.showBettingHistory }))}
            className={`w-12 h-6 rounded-full transition-colors ${
              privacy.showBettingHistory ? 'bg-neon-green' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              privacy.showBettingHistory ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      <div className="border-t border-dark-border pt-6">
        <h4 className="text-md font-semibold text-white mb-4">Security</h4>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
            <span className="text-white">Two-Factor Authentication</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
            <span className="text-white">Login History</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
            <span className="text-white">Connected Devices</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
          <select
            value={appearance.theme}
            onChange={(e) => setAppearance(prev => ({ ...prev, theme: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
          <select
            value={appearance.language}
            onChange={(e) => setAppearance(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
          >
            <option value="en">English</option>
            <option value="sw">Swahili</option>
            <option value="fr">French</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
          <select
            value={appearance.currency}
            onChange={(e) => setAppearance(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
          >
            <option value="KES">Kenyan Shilling (KES)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
          <select
            value={appearance.timezone}
            onChange={(e) => setAppearance(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white"
          >
            <option value="Africa/Nairobi">East Africa Time (EAT)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
      
      <div className="space-y-3">
        <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-white">M-Pesa</p>
              <p className="text-sm text-gray-400">•••• 1234</p>
            </div>
          </div>
          <span className="text-xs text-green-500">Default</span>
        </button>
        
        <button className="w-full text-left px-4 py-3 border-2 border-dashed border-dark-border rounded-lg hover:border-neon-green transition-colors flex items-center justify-center space-x-2">
          <CreditCard className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">Add Payment Method</span>
        </button>
      </div>

      <div className="border-t border-dark-border pt-6">
        <h4 className="text-md font-semibold text-white mb-4">Transaction History</h4>
        <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
          <span className="text-white">View All Transactions</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );

  const renderAboutSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Help & About</h3>
      
      <div className="space-y-3">
        <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
          <span className="text-white">Help Center</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        
        <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
          <span className="text-white">Terms of Service</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        
        <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
          <span className="text-white">Privacy Policy</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        
        <button className="w-full text-left px-4 py-3 bg-dark-card/50 rounded-lg hover:bg-dark-card transition-colors flex items-center justify-between">
          <span className="text-white">Contact Support</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="border-t border-dark-border pt-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-neon-green to-neon-blue rounded-lg flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-1">P2P Betting Platform</h4>
          <p className="text-sm text-gray-400 mb-2">Version 1.0.0</p>
          <p className="text-xs text-gray-500">© 2026 P2P Betting Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSettings();
      case 'notifications': return renderNotificationSettings();
      case 'privacy': return renderPrivacySettings();
      case 'appearance': return renderAppearanceSettings();
      case 'payments': return renderPaymentSettings();
      case 'about': return renderAboutSettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <button className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="glass-card rounded-lg p-4">
              <ul className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-neon-green text-dark-bg'
                            : 'text-gray-400 hover:text-white hover:bg-dark-card'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{section.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-lg p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
