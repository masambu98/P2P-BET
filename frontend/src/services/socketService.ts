import { io, Socket } from 'socket.io-client';

interface SocketEvents {
  balance_update: { balance: number; timestamp: Date };
  new_bet: any;
  bet_accepted: any;
  bet_settled: any;
  notification: any;
  room_created: any;
  user_joined_room: any;
  user_left_room: any;
  room_message: any;
  live_activity: any;
  live_activity_feed: any[];
  challenge_viewed: any;
  view_update: any;
  near_miss: any;
  error: { message: string };
}

class SocketService {
  private socket: Socket<SocketEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  private isConnecting = false;
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set();
  private liveActivities: any[] = [];

  connect(token?: string) {
    if (!token) {
      const stored = localStorage.getItem('auth-storage')
      if (!stored) return
      
      try {
        const parsed = JSON.parse(stored)
        token = parsed?.state?.token
        if (!token) return
      } catch {
        return
      }
    }

    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.notifyConnectionChange(false);

    this.socket = io('http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: false // We handle reconnection ourselves
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.notifyConnectionChange(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
      this.notifyConnectionChange(false);
      
      // Don't reconnect if the server explicitly disconnected
      if (reason === 'io server disconnect') {
        return;
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      this.notifyConnectionChange(false);
      
      // Only try to reconnect if it's a network error, not auth error
      if (error.message !== 'Authentication error') {
        this.handleReconnect();
      }
      // Silently handle auth errors - no console spam
    });

    // Real-time events with enhanced data
    this.socket.on('balance_update', (data) => {
      window.dispatchEvent(new CustomEvent('balance_update', { detail: data }));
    });

    this.socket.on('new_bet', (data) => {
      window.dispatchEvent(new CustomEvent('new_bet', { detail: data }));
    });

    this.socket.on('bet_accepted', (data) => {
      window.dispatchEvent(new CustomEvent('bet_accepted', { detail: data }));
    });

    this.socket.on('bet_settled', (data) => {
      window.dispatchEvent(new CustomEvent('bet_settled', { detail: data }));
      
      // Trigger near-miss or celebration based on result
      if (data.result === 'lost' && this.isNearMiss(data)) {
        window.dispatchEvent(new CustomEvent('near_miss', { detail: data }));
      }
    });

    this.socket.on('notification', (data) => {
      window.dispatchEvent(new CustomEvent('notification', { detail: data }));
    });

    this.socket.on('live_activity', (activity) => {
      this.liveActivities.push(activity);
      if (this.liveActivities.length > 50) {
        this.liveActivities = this.liveActivities.slice(-50);
      }
      window.dispatchEvent(new CustomEvent('live_activity', { detail: activity }));
    });

    this.socket.on('live_activity_feed', (activities) => {
      this.liveActivities = activities;
      window.dispatchEvent(new CustomEvent('live_activity_feed', { detail: activities }));
    });

    this.socket.on('challenge_viewed', (data) => {
      window.dispatchEvent(new CustomEvent('challenge_viewed', { detail: data }));
    });

    this.socket.on('view_update', (data) => {
      window.dispatchEvent(new CustomEvent('view_update', { detail: data }));
    });

    this.socket.on('near_miss', (data) => {
      window.dispatchEvent(new CustomEvent('near_miss', { detail: data }));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      window.dispatchEvent(new CustomEvent('socket_error', { detail: error }));
    });

    // Room events
    this.socket.on('room_created', (data) => {
      window.dispatchEvent(new CustomEvent('room_created', { detail: data }));
    });

    this.socket.on('user_joined_room', (data) => {
      window.dispatchEvent(new CustomEvent('user_joined_room', { detail: data }));
    });

    this.socket.on('user_left_room', (data) => {
      window.dispatchEvent(new CustomEvent('user_left_room', { detail: data }));
    });

    this.socket.on('room_message', (data) => {
      window.dispatchEvent(new CustomEvent('room_message', { detail: data }));
    });
  }

  private isNearMiss(betData: any): boolean {
    // Simple near-miss detection - can be enhanced
    // This would ideally come from the backend with actual margin data
    return Math.random() < 0.3; // 30% chance of near-miss for demo
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        // Get fresh token from localStorage
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          try {
            const authData = JSON.parse(authStorage);
            if (authData.state?.token) {
              this.connect(authData.state.token);
            }
          } catch (error) {
            // Silently handle parsing errors
          }
        }
      }, 2000 * this.reconnectAttempts);
    }
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.notifyConnectionChange(false);
  }

  // Connection status management
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  // User room management
  joinUserRoom(userId: string) {
    this.socket?.emit('join-user-room', userId);
  }

  leaveUserRoom(userId: string) {
    this.socket?.emit('leave-user-room', userId);
  }

  // Betting events
  subscribeToBets() {
    this.socket?.emit('subscribe-to-bets');
  }

  unsubscribeFromBets() {
    this.socket?.emit('unsubscribe-from-bets');
  }

  // Room methods
  joinRoom(roomId: string) {
    this.socket?.emit('join-room', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave-room', roomId);
  }

  // Room messaging
  sendRoomMessage(roomId: string, message: string) {
    this.socket?.emit('room_message', { roomId, message });
  }

  // Challenge interactions
  notifyChallengeViewed(betId: string, creatorId: string) {
    this.socket?.emit('challenge_viewed', { betId, creatorId });
  }

  updateViewCount(betId: string, count: number) {
    this.socket?.emit('update_view_count', { betId, count });
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  isConnectingStatus(): boolean {
    return this.isConnecting;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Get live activities
  getLiveActivities(): any[] {
    return this.liveActivities;
  }

  // Utility method to emit custom events
  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  // Get socket ID for debugging
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
