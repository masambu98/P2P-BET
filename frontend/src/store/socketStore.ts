import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface SocketState {
  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  socketId?: string;
  
  // Live data
  liveActivities: any[];
  onlineUsers: Set<string>;
  
  // Room state
  currentRoom?: string;
  roomUsers: any[];
  roomMessages: any[];
  
  // Bet updates
  recentBets: any[];
  betUpdates: any[];
  
  // Notifications
  notifications: any[];
  
  // Actions
  setConnectionStatus: (connected: boolean, connecting?: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
  setSocketId: (id?: string) => void;
  
  addLiveActivity: (activity: any) => void;
  setLiveActivities: (activities: any[]) => void;
  
  setCurrentRoom: (roomId?: string) => void;
  addRoomUser: (user: any) => void;
  removeRoomUser: (userId: string) => void;
  addRoomMessage: (message: any) => void;
  setRoomMessages: (messages: any[]) => void;
  
  addRecentBet: (bet: any) => void;
  addBetUpdate: (update: any) => void;
  
  addNotification: (notification: any) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // User management
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  
  // Reset
  reset: () => void;
}

export const useSocketStore = create<SocketState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    socketId: undefined,
    
    liveActivities: [],
    onlineUsers: new Set(),
    
    currentRoom: undefined,
    roomUsers: [],
    roomMessages: [],
    
    recentBets: [],
    betUpdates: [],
    
    notifications: [],
    
    // Connection actions
    setConnectionStatus: (connected, connecting = false) => {
      set({ isConnected: connected, isConnecting: connecting });
    },
    
    setReconnectAttempts: (attempts) => {
      set({ reconnectAttempts: attempts });
    },
    
    setSocketId: (id) => {
      set({ socketId: id });
    },
    
    // Live activity actions
    addLiveActivity: (activity) => {
      set((state) => {
        const updated = [...state.liveActivities, activity];
        return {
          liveActivities: updated.slice(-50) // Keep last 50 activities
        };
      });
    },
    
    setLiveActivities: (activities) => {
      set({ liveActivities: activities.slice(-50) });
    },
    
    // Room actions
    setCurrentRoom: (roomId) => {
      set({ 
        currentRoom: roomId,
        roomUsers: [],
        roomMessages: []
      });
    },
    
    addRoomUser: (user) => {
      set((state) => ({
        roomUsers: state.roomUsers.some(u => u.id === user.id) 
          ? state.roomUsers 
          : [...state.roomUsers, user]
      }));
    },
    
    removeRoomUser: (userId) => {
      set((state) => ({
        roomUsers: state.roomUsers.filter(u => u.id !== userId)
      }));
    },
    
    addRoomMessage: (message) => {
      set((state) => ({
        roomMessages: [...state.roomMessages, message].slice(-100) // Keep last 100 messages
      }));
    },
    
    setRoomMessages: (messages) => {
      set({ roomMessages: messages.slice(-100) });
    },
    
    // Bet actions
    addRecentBet: (bet) => {
      set((state) => ({
        recentBets: [bet, ...state.recentBets].slice(-20) // Keep last 20 bets
      }));
    },
    
    addBetUpdate: (update) => {
      set((state) => {
        const existingIndex = state.betUpdates.findIndex(u => u.betId === update.betId);
        if (existingIndex >= 0) {
          const updated = [...state.betUpdates];
          updated[existingIndex] = update;
          return { betUpdates: updated };
        }
        return {
          betUpdates: [update, ...state.betUpdates].slice(-50) // Keep last 50 updates
        };
      });
    },
    
    // Notification actions
    addNotification: (notification) => {
      set((state) => ({
        notifications: [
          { ...notification, id: notification.id || Date.now().toString(), read: false },
          ...state.notifications
        ].slice(-50) // Keep last 50 notifications
      }));
    },
    
    markNotificationAsRead: (id) => {
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      }));
    },
    
    clearNotifications: () => {
      set({ notifications: [] });
    },
    
    // User management
    addOnlineUser: (userId) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId])
      }));
    },
    
    removeOnlineUser: (userId) => {
      set((state) => {
        const newUsers = new Set(state.onlineUsers);
        newUsers.delete(userId);
        return { onlineUsers: newUsers };
      });
    },
    
    // Reset
    reset: () => {
      set({
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
        socketId: undefined,
        liveActivities: [],
        onlineUsers: new Set(),
        currentRoom: undefined,
        roomUsers: [],
        roomMessages: [],
        recentBets: [],
        betUpdates: [],
        notifications: []
      });
    }
  }))
);

// Selectors for common use cases
export const useConnectionStatus = () => useSocketStore(state => ({
  isConnected: state.isConnected,
  isConnecting: state.isConnecting,
  reconnectAttempts: state.reconnectAttempts,
  socketId: state.socketId
}));

export const useLiveActivities = () => useSocketStore(state => state.liveActivities);

export const useRoomState = () => useSocketStore(state => ({
  currentRoom: state.currentRoom,
  roomUsers: state.roomUsers,
  roomMessages: state.roomMessages,
  setCurrentRoom: state.setCurrentRoom,
  addRoomUser: state.addRoomUser,
  removeRoomUser: state.removeRoomUser,
  addRoomMessage: state.addRoomMessage
}));

export const useBetUpdates = () => useSocketStore(state => ({
  recentBets: state.recentBets,
  betUpdates: state.betUpdates,
  addRecentBet: state.addRecentBet,
  addBetUpdate: state.addBetUpdate
}));

export const useSocketNotifications = () => useSocketStore(state => ({
  notifications: state.notifications,
  addNotification: state.addNotification,
  markNotificationAsRead: state.markNotificationAsRead,
  clearNotifications: state.clearNotifications,
  unreadCount: state.notifications.filter(n => !n.read).length
}));

export const useOnlineUsers = () => useSocketStore(state => ({
  onlineUsers: Array.from(state.onlineUsers),
  isUserOnline: (userId: string) => state.onlineUsers.has(userId),
  addOnlineUser: state.addOnlineUser,
  removeOnlineUser: state.removeOnlineUser
}));
