import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  RefreshCw,
  Target,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface BettingStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalStaked: number;
  totalWon: number;
  netProfit: number;
  avgBetSize: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number;
  bestStreak: number;
  roi: number;
}

interface CategoryPerformance {
  category: string;
  bets: number;
  wins: number;
  winRate: number;
  profit: number;
  roi: number;
}

interface BettingAnalyticsProps {
  userId?: string;
  timeframe: '7d' | '30d' | '90d' | '1y';
}

export default function BettingAnalytics({ userId, timeframe = '30d' }: BettingAnalyticsProps) {
  const [stats, setStats] = useState<BettingStats | null>(null);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'profit' | 'wins' | 'bets'>('profit');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe, userId]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [statsResponse, categoryResponse] = await Promise.all([
        fetch(`/api/analytics/betting/stats?timeframe=${timeframe}${userId ? `&userId=${userId}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/betting/categories?timeframe=${timeframe}${userId ? `&userId=${userId}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        setCategoryPerformance(categoryData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (value: number, isPositive = true) => {
    if (value > 0 && isPositive) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return 'text-green-500';
    if (winRate >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Math.abs(amount).toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-neon-green animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">No betting data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Win Rate</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <p className={`text-2xl font-bold ${getWinRateColor(stats.winRate)}`}>
            {formatPercentage(stats.winRate)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.wonBets}/{stats.totalBets} bets
          </p>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Net Profit</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${getPerformanceColor(stats.netProfit)}`}>
            {formatCurrency(stats.netProfit)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ROI: {formatPercentage(stats.roi)}
          </p>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Current Streak</span>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <p className={`text-2xl font-bold ${getPerformanceColor(stats.currentStreak)}`}>
            {stats.currentStreak}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Best: {stats.bestStreak}
          </p>
        </div>

        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Avg Bet Size</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.avgBetSize)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total: {formatCurrency(stats.totalStaked)}
          </p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Performance Over Time</h3>
          <div className="flex items-center space-x-2">
            {(['profit', 'wins', 'bets'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metric
                    ? 'bg-neon-green text-dark-bg'
                    : 'bg-dark-card text-gray-400 hover:text-white'
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 flex items-center justify-center bg-dark-card/50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">Interactive chart would be displayed here</p>
            <p className="text-sm text-gray-500 mt-2">
              Showing {selectedMetric} over {timeframe}
            </p>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Category Performance</h3>
        
        <div className="space-y-4">
          {categoryPerformance.map((category, index) => (
            <div key={category.category} className="flex items-center justify-between p-4 bg-dark-card/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                  index === 2 ? 'bg-orange-600/20 text-orange-600' :
                  'bg-blue-500/20 text-blue-500'
                }`}>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-white">{category.category}</p>
                  <p className="text-sm text-gray-400">
                    {category.bets} bets • {category.wins} wins
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-bold ${getWinRateColor(category.winRate)}`}>
                  {formatPercentage(category.winRate)}
                </p>
                <p className={`text-sm ${getPerformanceColor(category.profit)}`}>
                  {formatCurrency(category.profit)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Performance */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Recent Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-500">Biggest Win</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats.biggestWin)}
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-500">Biggest Loss</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats.biggestLoss)}
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-500">Total Won</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats.totalWon)}
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Betting Insights</h3>
        
        <div className="space-y-3">
          {stats.winRate >= 60 && (
            <div className="flex items-start space-x-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-500">Excellent Performance</p>
                <p className="text-sm text-green-400">
                  Your win rate of {formatPercentage(stats.winRate)} is impressive!
                </p>
              </div>
            </div>
          )}

          {stats.currentStreak >= 5 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Hot Streak!</p>
                <p className="text-sm text-yellow-400">
                  You're on a {stats.currentStreak}-bet winning streak. Keep it up!
                </p>
              </div>
            </div>
          )}

          {stats.roi < 0 && (
            <div className="flex items-start space-x-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-500">Negative ROI</p>
                <p className="text-sm text-red-400">
                  Consider reviewing your betting strategy to improve returns.
                </p>
              </div>
            </div>
          )}

          {stats.avgBetSize > stats.totalStaked * 0.1 && (
            <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Target className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-500">High Roller</p>
                <p className="text-sm text-blue-400">
                  Your average bet size is quite large. Consider bankroll management.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
