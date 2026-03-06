import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalBets: number;
  totalVolume: number;
  pendingReports: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  totalBets: number;
  totalWinnings: number;
  status: 'active' | 'suspended' | 'banned';
  joinedAt: Date;
  lastActive: Date;
}

interface Bet {
  id: string;
  creator: string;
  bettor?: string;
  amount: number;
  status: string;
  category: string;
  createdAt: Date;
}

interface Report {
  id: string;
  type: 'user' | 'bet' | 'content';
  targetId: string;
  reason: string;
  description: string;
  reporter: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBets: 0,
    totalVolume: 0,
    pendingReports: 0,
    systemHealth: 'healthy'
  });

  const [users, setUsers] = useState<User[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bets' | 'reports' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Fetch bets
      const betsResponse = await fetch('/api/admin/bets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (betsResponse.ok) {
        const betsData = await betsResponse.json();
        setBets(betsData);
      }

      // Fetch reports
      const reportsResponse = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'activate') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData();
      }
    } catch (error) {
      console.error('Failed to perform user action:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reports/${reportId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData();
      }
    } catch (error) {
      console.error('Failed to handle report:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'suspended': return 'text-yellow-500';
      case 'banned': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-neon-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Manage your P2P betting platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getHealthColor(stats.systemHealth)}`}>
              <div className={`w-2 h-2 rounded-full bg-current`} />
              <span className="text-sm font-medium capitalize">{stats.systemHealth}</span>
            </div>
            <button
              onClick={fetchAdminData}
              className="p-2 hover:bg-dark-card rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-dark-card rounded-lg p-1">
          {(['overview', 'users', 'bets', 'reports', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-neon-green text-dark-bg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-neon-green" />
                </div>
              </div>

              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Bets</p>
                    <p className="text-2xl font-bold text-white">{stats.totalBets.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Volume</p>
                    <p className="text-2xl font-bold text-white">KES {stats.totalVolume.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Pending Reports Alert */}
            {stats.pendingReports > 0 && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-500">{stats.pendingReports} Pending Reports</p>
                    <p className="text-sm text-red-400">Review and take action on reported content</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-lg">
            <div className="p-6 border-b border-dark-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">User Management</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white placeholder-gray-500"
                    />
                  </div>
                  <button className="p-2 hover:bg-dark-card rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left p-4 text-gray-400">User</th>
                    <th className="text-left p-4 text-gray-400">Level</th>
                    <th className="text-left p-4 text-gray-400">Bets</th>
                    <th className="text-left p-4 text-gray-400">Winnings</th>
                    <th className="text-left p-4 text-gray-400">Status</th>
                    <th className="text-left p-4 text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(user => 
                      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(user => (
                    <tr key={user.id} className="border-b border-dark-border hover:bg-dark-card/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">{user.level}</td>
                      <td className="p-4">{user.totalBets}</td>
                      <td className="p-4">KES {user.totalWinnings.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {user.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleUserAction(user.id, 'suspend')}
                                className="p-1 hover:bg-dark-card rounded transition-colors"
                                title="Suspend"
                              >
                                <Clock className="w-4 h-4 text-yellow-500" />
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, 'ban')}
                                className="p-1 hover:bg-dark-card rounded transition-colors"
                                title="Ban"
                              >
                                <Ban className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                          {(user.status === 'suspended' || user.status === 'banned') && (
                            <button
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="p-1 hover:bg-dark-card rounded transition-colors"
                              title="Activate"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          <button className="p-1 hover:bg-dark-card rounded transition-colors">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Report Management</h2>
            {reports.map(report => (
              <div key={report.id} className="glass-card rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.type === 'user' ? 'bg-blue-500/20 text-blue-500' :
                        report.type === 'bet' ? 'bg-green-500/20 text-green-500' :
                        'bg-purple-500/20 text-purple-500'
                      }`}>
                        {report.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        report.status === 'resolved' ? 'bg-green-500/20 text-green-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium text-white mb-1">{report.reason}</p>
                    <p className="text-gray-400 text-sm mb-2">{report.description}</p>
                    <p className="text-sm text-gray-500">Reported by: {report.reporter}</p>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReportAction(report.id, 'resolve')}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'dismiss')}
                        className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
