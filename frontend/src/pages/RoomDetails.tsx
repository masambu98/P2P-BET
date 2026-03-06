import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  Settings, 
  Share2,
  Volume2,
  Video,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Hand,
  MoreVertical,
  Crown,
  Shield,
  User,
  Clock,
  Eye
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import ChatSystem from '../components/chat/ChatSystem';

interface RoomMember {
  id: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  isOnline: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  isLive: boolean;
  maxMembers: number;
  currentMembers: number;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  tags: string[];
  createdAt: string;
  rules: string[];
}

export default function RoomDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'info'>('chat');

  const { joinRoom, leaveRoom, sendRoomMessage } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (id) {
      fetchRoomDetails(id);
      joinRoom(id);
    }

    return () => {
      if (id) {
        leaveRoom(id);
      }
    };
  }, [id]);

  const fetchRoomDetails = async (roomId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rooms/${roomId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const roomData = await response.json();
        setRoom(roomData);
        fetchRoomMembers(roomId);
      } else {
        setError('Room not found');
      }
    } catch (error) {
      setError('Failed to load room details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomMembers = async (roomId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rooms/${roomId}/members`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const membersData = await response.json();
        setMembers(membersData);
      }
    } catch (error) {
      console.error('Failed to fetch room members:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!room) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchRoomDetails(room.id);
      }
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/rooms/${room.id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      navigate('/rooms');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Room Not Found</h1>
          <p className="text-gray-400 mb-4">{error || 'This room does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/rooms')}
            className="px-4 py-2 bg-neon-green text-dark-bg rounded-lg hover:bg-neon-green/90 transition-colors"
          >
            Browse Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-dark-card rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-white">{room.name}</h1>
                  {room.isLive && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{room.currentMembers}/{room.maxMembers}</span>
                  </span>
                  <span className="px-2 py-1 bg-dark-card rounded-lg">{room.category}</span>
                  <span>Created by {room.owner.username}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-dark-card rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-dark-card rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video/Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Area */}
            <div className="glass-card rounded-lg overflow-hidden">
              <div className="aspect-video bg-dark-card flex items-center justify-center">
                {room.isLive ? (
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 text-neon-green" />
                    <p className="text-white text-lg font-medium">Live Stream</p>
                    <p className="text-gray-400">Room content would be displayed here</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">Room is not currently live</p>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="p-4 bg-dark-card/50 border-t border-dark-border">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-full transition-colors ${
                      isMuted ? 'bg-red-500 text-white' : 'bg-dark-card hover:bg-dark-border text-gray-400'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoOff ? 'bg-red-500 text-white' : 'bg-dark-card hover:bg-dark-border text-gray-400'
                    }`}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={`p-3 rounded-full transition-colors ${
                      isScreenSharing ? 'bg-neon-green text-dark-bg' : 'bg-dark-card hover:bg-dark-border text-gray-400'
                    }`}
                  >
                    <ScreenShare className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setIsHandRaised(!isHandRaised)}
                    className={`p-3 rounded-full transition-colors ${
                      isHandRaised ? 'bg-yellow-500 text-white' : 'bg-dark-card hover:bg-dark-border text-gray-400'
                    }`}
                  >
                    <Hand className="w-5 h-5" />
                  </button>
                  
                  <button className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="glass-card rounded-lg">
              <div className="flex border-b border-dark-border">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-neon-green text-dark-bg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    activeTab === 'members'
                      ? 'bg-neon-green text-dark-bg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Members ({members.length})
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    activeTab === 'info'
                      ? 'bg-neon-green text-dark-bg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Info
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'chat' && (
                  <ChatSystem roomId={room.id} type="room" />
                )}
                
                {activeTab === 'members' && (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-dark-card/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {member.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {member.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-bg" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-white">{member.username}</p>
                              {getRoleIcon(member.role)}
                            </div>
                            <p className="text-sm text-gray-400">
                              Joined {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {member.isSpeaking && (
                            <Volume2 className="w-4 h-4 text-green-500" />
                          )}
                          {member.isMuted && (
                            <MicOff className="w-4 h-4 text-red-500" />
                          )}
                          {member.isVideoOff && (
                            <VideoOff className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                      <p className="text-gray-300">{room.description}</p>
                    </div>

                    {room.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {room.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-neon-green/10 border border-neon-green/30 rounded-full text-xs text-neon-green"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {room.rules.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Room Rules</h3>
                        <ul className="space-y-2">
                          {room.rules.map((rule, index) => (
                            <li key={index} className="flex items-start space-x-2 text-gray-300">
                              <span className="text-neon-green mt-1">•</span>
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Room Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created</span>
                          <span className="text-white">{formatDate(room.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Privacy</span>
                          <span className="text-white">{room.isPrivate ? 'Private' : 'Public'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category</span>
                          <span className="text-white">{room.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-card rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-neon-green text-dark-bg rounded-lg font-medium hover:bg-neon-green/90 transition-colors">
                  Follow Room
                </button>
                <button className="w-full px-4 py-2 bg-dark-card hover:bg-dark-border rounded-lg font-medium transition-colors">
                  Invite Friends
                </button>
                <button className="w-full px-4 py-2 bg-dark-card hover:bg-dark-border rounded-lg font-medium transition-colors">
                  Report Room
                </button>
              </div>
            </div>

            {/* Active Speakers */}
            <div className="glass-card rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Active Speakers</h3>
              <div className="space-y-3">
                {members.filter(m => m.isSpeaking).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-neon-green to-neon-blue rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {member.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{member.username}</p>
                      <div className="flex items-center space-x-1">
                        <Volume2 className="w-3 h-3 text-green-500" />
                        <div className="flex-1 h-1 bg-dark-border rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 animate-pulse" style={{ width: '60%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {members.filter(m => m.isSpeaking).length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">
                    No one is currently speaking
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
