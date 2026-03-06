import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { roomService, Room, RoomMessage, RoomMember } from '../services/roomService'
import { socketService } from '../services/socketService'
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  Send, 
  Plus,
  Trophy,
  User,
  Copy,
  Settings,
  LogOut
} from 'lucide-react'

export default function Room() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [room, setRoom] = useState<Room & { messages: RoomMessage[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isMember, setIsMember] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token || !id) return
    
    roomService.setToken(token)
    fetchRoom()
    
    // Set up Socket.io event listeners
    roomService.onNewRoomMessage((newMessage) => {
      if (newMessage.roomId === id) {
        setRoom(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMessage]
        } : null)
      }
    })
    
    roomService.onUserJoinedRoom((data) => {
      if (data.roomId === id) {
        fetchRoom() // Refresh room data
      }
    })
    
    roomService.onUserLeftRoom((data) => {
      if (data.roomId === id) {
        fetchRoom() // Refresh room data
      }
    })
  }, [token, id])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [room?.messages])

  const fetchRoom = async () => {
    try {
      setLoading(true)
      const roomData = await roomService.getRoom(id!)
      setRoom(roomData)
      
      // Check if current user is a member
      setIsMember(roomData.members.some(member => member.userId === user?.id))
      
      // Join Socket.io room if member
      if (roomData.members.some(member => member.userId === user?.id)) {
        socketService.joinRoom(id!)
      }
    } catch (error: any) {
      console.error('Failed to fetch room:', error.message)
      if (error.message.includes('not found')) {
        navigate('/rooms')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    try {
      await roomService.joinRoom(id!)
      setIsMember(true)
      fetchRoom()
    } catch (error: any) {
      console.error('Failed to join room:', error.message)
      // You could add a toast notification here
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await roomService.leaveRoom(id!)
      setIsMember(false)
      navigate('/rooms')
    } catch (error: any) {
      console.error('Failed to leave room:', error.message)
      // You could add a toast notification here
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !isMember) return
    
    try {
      await roomService.sendMessage(id!, message.trim())
      setMessage('')
    } catch (error: any) {
      console.error('Failed to send message:', error.message)
      // You could add a toast notification here
    }
  }

  const handleCopyRoomCode = async () => {
    if (room?.code) {
      try {
        await navigator.clipboard.writeText(room.code)
        console.log('Room code copied to clipboard')
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy room code')
      }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Room not found</h2>
          <Link to="/rooms" className="btn btn-primary">
            Back to Rooms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <div className="w-80 bg-dark-card border-r border-gray-800 flex flex-col">
        {/* Room Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Link to="/rooms" className="text-gray-500 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyRoomCode}
                className="text-gray-500 hover:text-white"
                title="Copy room code"
              >
                <Copy className="w-4 h-4" />
              </button>
              {room.creatorId === user?.id && (
                <button className="text-gray-500 hover:text-white">
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-gray-300 mb-2">{room.name}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="badge badge-info">#{room.code}</span>
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {room.members.length}/{room.maxMembers}
            </span>
          </div>
          
          {room.description && (
            <p className="text-gray-400 text-sm mt-3">{room.description}</p>
          )}
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Members ({room.members.length})
          </h3>
          
          <div className="space-y-3">
            {room.members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {member.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-300">
                    {member.user.username}
                    {member.userId === room.creatorId && (
                      <span className="ml-2 text-xs text-neon-green">Creator</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Joined {formatTime(member.joinedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Bet */}
        {room.currentBet && (
          <div className="p-6 border-t border-gray-800">
            <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-neon-green" />
              Current Bet
            </h3>
            <div className="bg-dark-bg rounded-lg p-3">
              <p className="text-sm font-medium text-gray-300 mb-1">
                {room.currentBet.title || 'Active Bet'}
              </p>
              <p className="text-xs text-gray-500">
                Stake: KES {room.currentBet.stakeAmount || 0}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-gray-800">
          {isMember ? (
            <button
              onClick={handleLeaveRoom}
              className="btn btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          ) : (
            <button
              onClick={handleJoinRoom}
              disabled={room.members.length >= room.maxMembers}
              className="btn btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {room.members.length >= room.maxMembers ? 'Room Full' : 'Join Room'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-dark-card border-b border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-300 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-neon-green" />
                Room Chat
              </h2>
              <p className="text-gray-500 mt-1">
                {isMember ? 'You are a member of this room' : 'Join this room to participate in chat'}
              </p>
            </div>
            
            {room.creatorId === user?.id && (
              <button className="btn btn-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Bet</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {room.messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No messages yet</h3>
              <p className="text-gray-500">
                {isMember ? 'Be the first to say something!' : 'Join the room to start chatting'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {room.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      msg.userId === user?.id
                        ? 'bg-neon-green text-dark-bg'
                        : 'bg-dark-card text-gray-300'
                    }`}
                  >
                    {msg.userId !== user?.id && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {msg.user.username}
                      </p>
                    )}
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.userId === user?.id ? 'opacity-75' : 'opacity-50'
                    }`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        {isMember && (
          <div className="bg-dark-card border-t border-gray-800 p-6">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
