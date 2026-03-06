import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    username?: string;
    role?: string;
  };
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

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId
  private liveActivities: LiveActivity[] = [];
  private readonly MAX_LIVE_ACTIVITIES = 50;

  initialize(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupConnectionHandlers();
    this.startLiveActivityFeed();
    logger.info('Socket service initialized');
  }

  private setupMiddleware() {
    if (!this.io) return;

    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        logger.warn(`Socket connection rejected: No token provided for socket ${socket.id}`);
        return next(new Error('Authentication error'));
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.userId = decoded.id;
        socket.data.username = decoded.username;
        socket.data.role = decoded.role;
        
        logger.info(`Socket authenticated: ${socket.id} for user ${decoded.username} (${decoded.id})`);
        next();
      } catch (error) {
        logger.warn(`Socket authentication failed: ${error} for socket ${socket.id}`);
        return next(new Error('Authentication error'));
      }
    });
  }

  private setupConnectionHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.data.userId;
      const username = socket.data.username;
      
      logger.info(`Socket connected: ${socket.id} for user ${username} (${userId})`);

      // Track user connections
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);
      this.socketToUser.set(socket.id, userId);

      // Join user's personal room for targeted notifications
      socket.join(`user-${userId}`);
      
      // Join general activity room
      socket.join('live-activity');

      // Send current live activities to newly connected user
      socket.emit('live_activity_feed', this.liveActivities.slice(-20));

      // Handle room subscriptions
      socket.on('join-user-room', (targetUserId: string) => {
        if (targetUserId === userId) {
          socket.join(`user-${userId}`);
          logger.debug(`User ${username} joined their personal room`);
        }
      });

      socket.on('leave-user-room', (targetUserId: string) => {
        if (targetUserId === userId) {
          socket.leave(`user-${userId}`);
          logger.debug(`User ${username} left their personal room`);
        }
      });

      socket.on('subscribe-to-bets', () => {
        socket.join('bet-updates');
        logger.debug(`User ${username} subscribed to bet updates`);
      });

      socket.on('unsubscribe-from-bets', () => {
        socket.leave('bet-updates');
        logger.debug(`User ${username} unsubscribed from bet updates`);
      });

      socket.on('join-room', (roomId: string) => {
        socket.join(`room-${roomId}`);
        logger.debug(`User ${username} joined room ${roomId}`);
        
        // Notify others in the room
        socket.to(`room-${roomId}`).emit('user_joined_room', {
          roomId,
          user: { id: userId, username }
        });
      });

      socket.on('leave-room', (roomId: string) => {
        socket.leave(`room-${roomId}`);
        logger.debug(`User ${username} left room ${roomId}`);
        
        // Notify others in the room
        socket.to(`room-${roomId}`).emit('user_left_room', {
          roomId,
          user: { id: userId, username }
        });
      });

      socket.on('room_message', (data: { roomId: string; message: string }) => {
        const { roomId, message } = data;
        
        // Validate message
        if (!message || message.length > 200) {
          socket.emit('error', { message: 'Message must be 1-200 characters' });
          return;
        }

        const messageData = {
          id: Date.now().toString(),
          roomId,
          userId,
          username,
          message: message.trim(),
          timestamp: new Date()
        };

        // Broadcast to room members
        this.io!.to(`room-${roomId}`).emit('room_message', messageData);
        logger.debug(`Room message sent in ${roomId} by ${username}`);
      });

      socket.on('challenge_viewed', (data: { betId: string; creatorId: string }) => {
        const { betId, creatorId } = data;
        
        // Notify bet creator that someone viewed their challenge
        this.io!.to(`user-${creatorId}`).emit('challenge_viewed', {
          betId,
          viewer: { id: userId, username },
          timestamp: new Date()
        });

        // Add to live activity
        this.addLiveActivity({
          id: Date.now().toString(),
          type: 'challenge_viewed',
          username,
          message: `viewed a challenge`,
          timestamp: new Date(),
          userId
        });

        logger.debug(`Challenge ${betId} viewed by ${username}, notified creator ${creatorId}`);
      });

      socket.on('update_view_count', (data: { betId: string; count: number }) => {
        // Broadcast view count update to all subscribed users
        this.io!.to('bet-updates').emit('view_update', data);
      });

      socket.on('disconnect', (reason) => {
        logger.info(`Socket disconnected: ${socket.id} for user ${username} (${userId}) - Reason: ${reason}`);
        
        // Clean up user tracking
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
        this.socketToUser.delete(socket.id);
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error(`Socket error for ${username}:`, error);
      });
    });
  }

  private startLiveActivityFeed() {
    // Simulate some live activities for demonstration
    // In production, these would come from real user actions
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        const activities = [
          { type: 'win' as const, message: 'won a bet', amount: Math.floor(Math.random() * 20000) + 1000 },
          { type: 'bet' as const, message: 'placed a bet', amount: Math.floor(Math.random() * 10000) + 500 },
          { type: 'join' as const, message: 'joined the platform' },
          { type: 'achievement' as const, message: 'reached a new milestone' }
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const usernames = ['Alex', 'Grace', 'John', 'Lisa', 'Tom', 'Anna', 'Chris', 'Sophie'];
        
        this.addLiveActivity({
          id: Date.now().toString(),
          ...activity,
          username: usernames[Math.floor(Math.random() * usernames.length)],
          timestamp: new Date()
        });
      }
    }, 10000);
  }

  private addLiveActivity(activity: LiveActivity) {
    this.liveActivities.push(activity);
    
    // Keep only the latest activities
    if (this.liveActivities.length > this.MAX_LIVE_ACTIVITIES) {
      this.liveActivities = this.liveActivities.slice(-this.MAX_LIVE_ACTIVITIES);
    }

    // Broadcast to all connected users
    this.io?.to('live-activity').emit('live_activity', activity);
    logger.debug(`Live activity broadcast: ${activity.username} ${activity.message}`);
  }

  // Public methods for controllers to emit events
  emitBalanceUpdate(userId: string, balance: number) {
    this.io?.to(`user-${userId}`).emit('balance_update', { balance, timestamp: new Date() });
    logger.debug(`Balance update sent to user ${userId}: ${balance}`);
  }

  emitBetCreated(bet: any) {
    this.io?.to('bet-updates').emit('new_bet', { ...bet, timestamp: new Date() });
    
    this.addLiveActivity({
      id: Date.now().toString(),
      type: 'bet',
      username: bet.creator?.username || 'Unknown',
      message: 'created a new bet',
      amount: bet.stakeAmount,
      timestamp: new Date(),
      userId: bet.creatorId
    });
    
    logger.debug(`New bet broadcast: ${bet.id}`);
  }

  emitBetAccepted(bet: any, acceptorId: string) {
    // Notify bet creator
    this.io?.to(`user-${bet.creatorId}`).emit('bet_accepted', { 
      ...bet, 
      acceptorId, 
      timestamp: new Date() 
    });

    // Add to live activity
    this.addLiveActivity({
      id: Date.now().toString(),
      type: 'bet',
      username: bet.acceptor?.username || 'Unknown',
      message: 'accepted a bet',
      amount: bet.stakeAmount,
      timestamp: new Date(),
      userId: acceptorId
    });
    
    logger.debug(`Bet accepted broadcast: ${bet.id} by ${acceptorId}`);
  }

  emitBetSettled(bet: any, winnerId: string, loserId: string) {
    // Notify winner
    this.io?.to(`user-${winnerId}`).emit('bet_settled', { 
      ...bet, 
      result: 'won', 
      timestamp: new Date() 
    });

    // Notify loser
    this.io?.to(`user-${loserId}`).emit('bet_settled', { 
      ...bet, 
      result: 'lost', 
      timestamp: new Date() 
    });

    // Add to live activity
    this.addLiveActivity({
      id: Date.now().toString(),
      type: 'win',
      username: bet.winner?.username || 'Unknown',
      message: 'won a bet',
      amount: bet.potentialWin || bet.stakeAmount,
      timestamp: new Date(),
      userId: winnerId
    });
    
    logger.debug(`Bet settled broadcast: ${bet.id}, winner: ${winnerId}`);
  }

  emitNotification(userId: string, notification: any) {
    this.io?.to(`user-${userId}`).emit('notification', {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    });
    logger.debug(`Notification sent to user ${userId}: ${notification.title}`);
  }

  emitRoomCreated(room: any) {
    this.io?.to(`room-${room.id}`).emit('room_created', { ...room, timestamp: new Date() });
    logger.debug(`Room created broadcast: ${room.id}`);
  }

  emitNearMiss(userId: string, betDetails: any) {
    this.io?.to(`user-${userId}`).emit('near_miss', { 
      ...betDetails, 
      timestamp: new Date() 
    });
    logger.debug(`Near miss sent to user ${userId}`);
  }

  // Utility methods
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  getUserSocketCount(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  getStats() {
    return {
      totalConnections: this.socketToUser.size,
      uniqueUsers: this.connectedUsers.size,
      liveActivities: this.liveActivities.length
    };
  }
}

export const socketService = new SocketService();
export type { AuthenticatedSocket };
