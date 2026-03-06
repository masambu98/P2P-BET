import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { roomService, Room } from '../services/roomService'
import { 
  Users, 
  MessageSquare, 
  Plus, 
  Search, 
  Lock,
  Eye,
  Clock,
  UserPlus,
  X
} from 'lucide-react'

export default function Rooms() {
  const { user, token } = useAuthStore()
  const [rooms, setRooms] = useState<Room[]>([])
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxMembers: 10
  })

  useEffect(() => {
    if (!token) return
    
    roomService.setToken(token)
    fetchRooms()
    fetchMyRooms()
    
    // Set up Socket.io event listeners
    roomService.onRoomCreated((room) => {
      setRooms(prev => [room, ...prev])
    })
    
    roomService.onUserJoinedRoom((data) => {
      setRooms(prev => prev.map(room => 
        room.id === data.roomId 
          ? { ...room, memberCount: data.memberCount, isFull: data.memberCount >= room.maxMembers }
          : room
      ))
    })
    
    roomService.onUserLeftRoom((data) => {
      setRooms(prev => prev.map(room => 
        room.id === data.roomId 
          ? { ...room, memberCount: data.memberCount, isFull: data.memberCount >= room.maxMembers }
          : room
      ))
    })
  }, [token])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const roomsData = await roomService.getRooms()
      setRooms(roomsData)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyRooms = async () => {
    try {
      const myRoomsData = await roomService.getMyRooms()
      setMyRooms(myRoomsData)
    } catch (error) {
      console.error('Failed to fetch my rooms:', error)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const newRoom = await roomService.createRoom(createForm)
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '', maxMembers: 10 })
      fetchMyRooms()
      fetchRooms()
    } catch (error: any) {
      console.error('Failed to create room:', error.message)
      // You could add a toast notification here
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    try {
      await roomService.joinRoom(roomId)
      fetchMyRooms()
      fetchRooms()
      // Navigate to room page
      window.location.href = `/room/${roomId}`
    } catch (error: any) {
      console.error('Failed to join room:', error.message)
      // You could add a toast notification here
    }
  }

  const filteredRooms = activeTab === 'all' ? rooms : myRooms
  const displayedRooms = filteredRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading rooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 glow-text">Betting Rooms 🎯</h1>
              <p className="text-gray-400">Join or create betting rooms to chat and challenge others</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Room</span>
            </button>
          </div>

          {/* Search and Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-card border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
              />
            </div>
            <div className="flex bg-dark-card rounded-xl p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-neon-green text-dark-bg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Rooms
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'my'
                    ? 'bg-neon-green text-dark-bg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Rooms ({myRooms.length})
              </button>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRooms.map((room) => (
            <div key={room.id} className="card group hover:scale-105 transition-all duration-300">
              {/* Room Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-300 mb-1">{room.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="badge badge-info">#{room.code}</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(room.createdAt)}
                    </span>
                  </div>
                </div>
                {room.isFull && (
                  <span className="badge badge-warning">Full</span>
                )}
              </div>

              {/* Room Description */}
              {room.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {room.description}
                </p>
              )}

              {/* Room Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-gray-400">
                    <Users className="w-4 h-4 mr-1" />
                    {room.memberCount}/{room.maxMembers}
                  </span>
                  {room.currentBet && (
                    <span className="flex items-center text-neon-green">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Active Bet
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-500">Active</span>
                </div>
              </div>

              {/* Room Creator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {room.creator.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">{room.creator.username}</p>
                    <p className="text-xs text-gray-500">Creator</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Link
                  to={`/room/${room.id}`}
                  className="btn btn-secondary flex-1 flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Link>
                {!room.members.some(m => m.userId === user?.id) && !room.isFull && (
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    className="btn btn-primary flex-1 flex items-center justify-center space-x-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Join</span>
                  </button>
                )}
                {room.members.some(m => m.userId === user?.id) && (
                  <Link
                    to={`/room/${room.id}`}
                    className="btn btn-success flex-1 flex items-center justify-center space-x-1"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enter</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {displayedRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No rooms found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a room!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Create First Room
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-300">Create Room</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
                  placeholder="Enter room name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green resize-none"
                  rows={3}
                  placeholder="What's this room about?"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Members
                </label>
                <select
                  value={createForm.maxMembers}
                  onChange={(e) => setCreateForm({ ...createForm, maxMembers: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-green"
                >
                  <option value={5}>5 members</option>
                  <option value={10}>10 members</option>
                  <option value={20}>20 members</option>
                  <option value={50}>50 members</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
