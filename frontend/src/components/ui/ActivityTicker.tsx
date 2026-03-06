import { useEffect, useState, useRef } from 'react';
import { Activity, TrendingUp, Trophy, Users, Eye, Zap } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface LiveActivity {
  id: string;
  type: 'win' | 'bet' | 'join' | 'achievement' | 'challenge_viewed';
  username: string;
  amount?: number;
  message: string;
  timestamp: Date;
  userId?: string;
}

export default function ActivityTicker() {
  const { liveActivities, isConnected } = useSocket({ autoConnect: true });
  const [visibleActivities, setVisibleActivities] = useState<LiveActivity[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    setVisibleActivities(liveActivities.slice(-10)); // Show last 10 activities
  }, [liveActivities]);

  // Auto-scroll animation
  useEffect(() => {
    const scroll = () => {
      if (scrollRef.current) {
        const scrollAmount = 1;
        scrollRef.current.scrollLeft += scrollAmount;
        
        // Reset scroll when reaching the end
        if (scrollRef.current.scrollLeft >= scrollRef.current.scrollWidth - scrollRef.current.clientWidth) {
          scrollRef.current.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(scroll);
    };

    // Start scrolling if there are activities
    if (visibleActivities.length > 3) {
      animationRef.current = requestAnimationFrame(scroll);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visibleActivities.length]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'win':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'bet':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'join':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'achievement':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'challenge_viewed':
        return <Eye className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '';
    if (amount >= 1000) {
      return `KES ${(amount / 1000).toFixed(1)}k`;
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (!isConnected || visibleActivities.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-dark-card/80 backdrop-blur-sm border-t border-dark-border py-2 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Waiting for live activity...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-card/90 backdrop-blur-sm border-t border-dark-border py-3 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Activity className="w-4 h-4 text-neon-green animate-pulse" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Live Activity
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-hidden"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex space-x-6 animate-scroll">
              {[...visibleActivities, ...visibleActivities].map((activity, index) => (
                <div 
                  key={`${activity.id}-${index}`}
                  className="flex items-center space-x-2 whitespace-nowrap text-sm animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {getActivityIcon(activity.type)}
                  
                  <span className="text-gray-300 font-medium">
                    {activity.username}
                  </span>
                  
                  <span className="text-gray-500">
                    {activity.message}
                  </span>
                  
                  {activity.amount && (
                    <span className="text-neon-green font-bold">
                      {formatAmount(activity.amount)}
                    </span>
                  )}
                  
                  <span className="text-gray-600 text-xs">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Connection indicator */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500">
              {visibleActivities.length} active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
