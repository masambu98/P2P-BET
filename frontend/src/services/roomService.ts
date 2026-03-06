import { socketService } from './socketService';

export interface Room {
  id: string;
  name: string;
  code: string;
  description?: string;
  creatorId: string;
  maxMembers: number;
  isActive: boolean;
  currentBetId?: string;
  memberCount: number;
  isFull: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
  members: RoomMember[];
  currentBet?: any;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

class RoomService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async createRoom(data: {
    name: string;
    description?: string;
    maxMembers?: number;
  }): Promise<Room> {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create room');
    }

    return response.json();
  }

  async getRooms(): Promise<Room[]> {
    const response = await fetch('/api/rooms');
    
    if (!response.ok) {
      throw new Error('Failed to get rooms');
    }

    return response.json();
  }

  async getRoom(roomId: string): Promise<Room & { messages: RoomMessage[] }> {
    const response = await fetch(`/api/rooms/${roomId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get room');
    }

    return response.json();
  }

  async joinRoom(roomId: string): Promise<RoomMember> {
    const response = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ roomId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join room');
    }

    const membership = await response.json();
    
    // Join Socket.io room for real-time updates
    socketService.joinRoom(roomId);
    
    return membership;
  }

  async leaveRoom(roomId: string): Promise<void> {
    const response = await fetch('/api/rooms/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ roomId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to leave room');
    }

    // Leave Socket.io room
    socketService.leaveRoom(roomId);
  }

  async sendMessage(roomId: string, content: string): Promise<RoomMessage> {
    const response = await fetch('/api/rooms/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ roomId, content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  }

  async getMyRooms(): Promise<Room[]> {
    const response = await fetch('/api/rooms/my-rooms', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get your rooms');
    }

    return response.json();
  }

  // Socket.io event listeners
  onRoomCreated(callback: (room: Room) => void) {
    window.addEventListener('room_created', (event: any) => {
      callback(event.detail.room);
    });
  }

  onUserJoinedRoom(callback: (data: { roomId: string; user: any; memberCount: number }) => void) {
    window.addEventListener('user_joined_room', (event: any) => {
      callback(event.detail);
    });
  }

  onUserLeftRoom(callback: (data: { roomId: string; userId: string; memberCount: number }) => void) {
    window.addEventListener('user_left_room', (event: any) => {
      callback(event.detail);
    });
  }

  onNewRoomMessage(callback: (message: RoomMessage) => void) {
    window.addEventListener('new_room_message', (event: any) => {
      callback(event.detail);
    });
  }
}

export const roomService = new RoomService();
