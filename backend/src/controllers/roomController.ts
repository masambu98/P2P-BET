import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

// Get Socket.io instance from server (will be injected)
let io: any;
export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const { name, description, maxMembers } = req.body;

    // Generate unique room code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = await prisma.room.create({
      data: {
        name,
        code,
        description,
        maxMembers: maxMembers || 10,
        creatorId: userId
      },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });

    // Add creator as first member
    await prisma.roomMember.create({
      data: {
        roomId: room.id,
        userId
      }
    });

    // Emit real-time event
    if (io) {
      io.emit('room_created', {
        room: {
          ...room,
          memberCount: 1
        }
      });
    }

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        },
        currentBet: true,
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add member count to each room
    const roomsWithCounts = rooms.map(room => ({
      ...room,
      memberCount: room._count.members,
      isFull: room._count.members >= room.maxMembers
    }));

    res.json(roomsWithCounts);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        },
        currentBet: {
          include: {
            creator: true,
            bettor: true
          }
        },
        messages: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const { roomId } = req.body;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isActive) {
      return res.status(400).json({ error: 'Room is not active' });
    }

    if (room._count.members >= room.maxMembers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if user is already a member
    const existingMember = room.members.find(member => member.userId === userId);
    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }

    // Add user to room
    const membership = await prisma.roomMember.create({
      data: {
        roomId,
        userId
      },
      include: {
        user: true
      }
    });

    // Emit real-time events
    if (io) {
      io.to(`room-${roomId}`).emit('user_joined_room', {
        roomId,
        user: membership.user,
        memberCount: room._count.members + 1
      });

      // Send notification to room creator
      io.to(`user-${room.creatorId}`).emit('notification', {
        type: 'room',
        title: 'New Member',
        message: `${membership.user.username} joined your room "${room.name}"`
      });
    }

    res.json(membership);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const { roomId } = req.body;

    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this room' });
    }

    await prisma.roomMember.delete({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    // Get updated room for member count
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    // Emit real-time events
    if (io) {
      io.to(`room-${roomId}`).emit('user_left_room', {
        roomId,
        userId,
        memberCount: room?._count.members || 0
      });
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const { roomId, content } = req.body;

    // Verify user is a member of the room
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const message = await prisma.roomMessage.create({
      data: {
        roomId,
        userId,
        content
      },
      include: {
        user: true
      }
    });

    // Emit real-time message to all room members
    if (io) {
      io.to(`room-${roomId}`).emit('new_room_message', message);
    }

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getMyRooms = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;

    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        },
        currentBet: true,
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add member count to each room
    const roomsWithCounts = rooms.map(room => ({
      ...room,
      memberCount: room._count.members,
      isFull: room._count.members >= room.maxMembers
    }));

    res.json(roomsWithCounts);
  } catch (error) {
    console.error('Get my rooms error:', error);
    res.status(500).json({ error: 'Failed to get your rooms' });
  }
};
