import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';

interface UseSocketOptions {
  autoConnect?: boolean;
  subscribeToBets?: boolean;
  joinUserRoom?: boolean;
}

interface SocketStatus {
  connected: boolean;
  connecting: boolean;
  reconnectAttempts: number;
  socketId?: string;
}

interface LiveActivity {
  id: string;
  type: 'win' | 'bet' | 'join' | 'achievement' | 'challenge_viewed';
  username: string;
  amount?: number;
  message: string;
  timestamp: Date;
  userId?: string;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    subscribeToBets = false,
    joinUserRoom = false
  } = options;

  const [status, setStatus] = useState<SocketStatus>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  });

  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);

  // Update status when connection changes
  useEffect(() => {
    const unsubscribe = socketService.onConnectionChange((connected) => {
      setStatus(prev => ({
        ...prev,
        connected,
        connecting: socketService.isConnectingStatus(),
        reconnectAttempts: socketService.getReconnectAttempts(),
        socketId: socketService.getSocketId()
      }));
    });

    return unsubscribe;
  }, []);

  // Auto-connect with token
  useEffect(() => {
    if (autoConnect) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          if (authData.state?.token) {
            socketService.connect(authData.state.token);
          }
        } catch (error) {
          console.error('Failed to parse auth storage:', error);
        }
      }
    }
  }, [autoConnect]);

  // Subscribe to bet updates
  useEffect(() => {
    if (status.connected && subscribeToBets) {
      socketService.subscribeToBets();
    }
  }, [status.connected, subscribeToBets]);

  // Join user room
  useEffect(() => {
    if (status.connected && joinUserRoom) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          if (authData.state?.user?.id) {
            socketService.joinUserRoom(authData.state.user.id);
          }
        } catch (error) {
          console.error('Failed to get user ID:', error);
        }
      }
    }
  }, [status.connected, joinUserRoom]);

  // Listen for live activities
  useEffect(() => {
    const handleLiveActivity = (event: CustomEvent) => {
      setLiveActivities(prev => {
        const updated = [...prev, event.detail];
        return updated.slice(-50); // Keep only last 50 activities
      });
    };

    const handleLiveActivityFeed = (event: CustomEvent) => {
      setLiveActivities(event.detail);
    };

    window.addEventListener('live_activity', handleLiveActivity as EventListener);
    window.addEventListener('live_activity_feed', handleLiveActivityFeed as EventListener);

    return () => {
      window.removeEventListener('live_activity', handleLiveActivity as EventListener);
      window.removeEventListener('live_activity_feed', handleLiveActivityFeed as EventListener);
    };
  }, []);

  // Manual connection methods
  const connect = useCallback((token: string) => {
    socketService.connect(token);
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  // Room methods
  const joinRoom = useCallback((roomId: string) => {
    socketService.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketService.leaveRoom(roomId);
  }, []);

  const sendRoomMessage = useCallback((roomId: string, message: string) => {
    socketService.sendRoomMessage(roomId, message);
  }, []);

  // Bet methods
  const subscribeToBetsNow = useCallback(() => {
    socketService.subscribeToBets();
  }, []);

  const unsubscribeFromBets = useCallback(() => {
    socketService.unsubscribeFromBets();
  }, []);

  // Challenge methods
  const notifyChallengeViewed = useCallback((betId: string, creatorId: string) => {
    socketService.notifyChallengeViewed(betId, creatorId);
  }, []);

  const updateViewCount = useCallback((betId: string, count: number) => {
    socketService.updateViewCount(betId, count);
  }, []);

  // Utility methods
  const emit = useCallback((event: string, data: any) => {
    socketService.emit(event, data);
  }, []);

  const getSocketId = useCallback(() => {
    return socketService.getSocketId();
  }, []);

  return {
    // Status
    status,
    isConnected: status.connected,
    isConnecting: status.connecting,
    
    // Live activities
    liveActivities,
    
    // Connection methods
    connect,
    disconnect,
    
    // Room methods
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    
    // Bet methods
    subscribeToBets: subscribeToBetsNow,
    unsubscribeFromBets,
    
    // Challenge methods
    notifyChallengeViewed,
    updateViewCount,
    
    // Utilities
    emit,
    getSocketId
  };
}

// Hook for real-time balance updates
export function useBalanceUpdates() {
  const [balance, setBalance] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail.balance);
      setLastUpdate(new Date(event.detail.timestamp));
    };

    window.addEventListener('balance_update', handleBalanceUpdate as EventListener);

    return () => {
      window.removeEventListener('balance_update', handleBalanceUpdate as EventListener);
    };
  }, []);

  return { balance, lastUpdate };
}

// Hook for real-time notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      setNotifications(prev => [event.detail, ...prev].slice(0, 50)); // Keep last 50
    };

    window.addEventListener('notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('notification', handleNotification as EventListener);
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  return {
    notifications,
    clearNotifications,
    markAsRead,
    unreadCount: notifications.filter(n => !n.read).length
  };
}

// Hook for room events
export function useRoomEvents(roomId?: string) {
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [roomUsers, setRoomUsers] = useState<any[]>([]);

  useEffect(() => {
    const handleRoomMessage = (event: CustomEvent) => {
      if (event.detail.roomId === roomId) {
        setRoomMessages(prev => [...prev, event.detail]);
      }
    };

    const handleUserJoinedRoom = (event: CustomEvent) => {
      if (event.detail.roomId === roomId) {
        setRoomUsers(prev => [...prev, event.detail.user]);
      }
    };

    const handleUserLeftRoom = (event: CustomEvent) => {
      if (event.detail.roomId === roomId) {
        setRoomUsers(prev => 
          prev.filter(user => user.id !== event.detail.user.id)
        );
      }
    };

    window.addEventListener('room_message', handleRoomMessage as EventListener);
    window.addEventListener('user_joined_room', handleUserJoinedRoom as EventListener);
    window.addEventListener('user_left_room', handleUserLeftRoom as EventListener);

    return () => {
      window.removeEventListener('room_message', handleRoomMessage as EventListener);
      window.removeEventListener('user_joined_room', handleUserJoinedRoom as EventListener);
      window.removeEventListener('user_left_room', handleUserLeftRoom as EventListener);
    };
  }, [roomId]);

  const sendMessage = useCallback((message: string) => {
    if (roomId) {
      socketService.sendRoomMessage(roomId, message);
    }
  }, [roomId]);

  return {
    roomMessages,
    roomUsers,
    sendMessage
  };
}
