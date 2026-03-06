import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Users, Settings, MessageCircle, Heart, Share2, Bookmark } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface Message {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  reactions?: { [key: string]: string[] };
  replyTo?: string;
}

interface ChatSystemProps {
  betId?: string;
  roomId?: string;
  type: 'bet' | 'room' | 'global';
  className?: string;
}

export default function ChatSystem({ betId, roomId, type, className = '' }: ChatSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const { sendRoomMessage, roomMessages, roomUsers, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const EMOJIS = ['😀', '😂', '🔥', '💯', '🎯', '💰', '🏆', '⚡', '👍', '❤️', '😎', '🤔'];

  useEffect(() => {
    if (type === 'room' && roomId) {
      setMessages(roomMessages);
    }
  }, [roomMessages, type, roomId]);

  useEffect(() => {
    setOnlineUsers(roomUsers.map(u => u.username));
  }, [roomUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: 'current-user', // Would come from auth context
      username: 'You', // Would come from auth context
      content: newMessage.trim(),
      timestamp: new Date(),
      replyTo: replyingTo?.id
    };

    if (type === 'room' && roomId) {
      sendRoomMessage(roomId, message.content);
    } else {
      setMessages(prev => [...prev, message]);
    }

    setNewMessage('');
    setReplyingTo(null);
    setShowEmojis(false);
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        if (!reactions[emoji]) reactions[emoji] = [];
        if (!reactions[emoji].includes('current-user')) {
          reactions[emoji].push('current-user');
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatTitle = () => {
    switch (type) {
      case 'bet': return 'Bet Discussion';
      case 'room': return `Room Chat`;
      case 'global': return 'Global Chat';
      default: return 'Chat';
    }
  };

  return (
    <div className={`glass-card rounded-lg flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-neon-green" />
          <h3 className="font-semibold text-white">{getChatTitle()}</h3>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{onlineUsers.length}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-dark-card rounded transition-colors">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className="space-y-1">
              {message.replyTo && (
                <div className="text-xs text-gray-500 ml-2">
                  Replying to {message.replyTo}
                </div>
              )}
              <div className={`flex items-start space-x-2 ${
                message.userId === 'current-user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-white font-medium">
                    {message.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`max-w-xs ${
                  message.userId === 'current-user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`px-3 py-2 rounded-lg ${
                    message.userId === 'current-user'
                      ? 'bg-neon-green text-dark-bg'
                      : 'bg-dark-card text-white'
                  }`}>
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {message.username}
                    </div>
                    <div className="text-sm">{message.content}</div>
                  </div>
                  
                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(message.id, emoji)}
                          className={`px-2 py-1 rounded-full text-xs transition-colors ${
                            users.includes('current-user')
                              ? 'bg-neon-green/20 border border-neon-green/50'
                              : 'bg-dark-card hover:bg-dark-border'
                          }`}
                        >
                          {emoji} {users.length}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                    <span>{formatTime(message.timestamp)}</span>
                    <button
                      onClick={() => setReplyingTo(message)}
                      className="hover:text-neon-green transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-dark-card/50 border-t border-dark-border flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Replying to {replyingTo.username}: "{replyingTo.content.slice(0, 50)}..."
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="p-2 hover:bg-dark-card rounded-lg transition-colors"
          >
            <Smile className="w-5 h-5 text-gray-400" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={replyingTo ? 'Write a reply...' : 'Type a message...'}
            className="flex-1 px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white placeholder-gray-500"
            disabled={!isConnected}
          />
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-neon-green text-dark-bg rounded-lg hover:bg-neon-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji picker */}
        {showEmojis && (
          <div className="absolute bottom-20 left-4 glass-card rounded-lg p-3 grid grid-cols-6 gap-2">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-xl hover:bg-dark-card p-2 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/20 text-red-500 text-xs rounded-full">
          Disconnected
        </div>
      )}
    </div>
  );
}

// Comment system for bets
export function CommentSystem({ betId }: { betId: string }) {
  const [comments, setComments] = useState<Message[]>([]);
  const [newComment, setNewComment] = useState('');

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment: Message = {
      id: Date.now().toString(),
      userId: 'current-user',
      username: 'You',
      content: newComment.trim(),
      timestamp: new Date()
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white">Comments ({comments.length})</h4>
      
      {/* Comment input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addComment()}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:border-neon-green text-white placeholder-gray-500"
        />
        <button
          onClick={addComment}
          className="px-4 py-2 bg-neon-green text-dark-bg rounded-lg hover:bg-neon-green/90 transition-colors"
        >
          Post
        </button>
      </div>

      {/* Comments list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map(comment => (
          <div key={comment.id} className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-white font-medium">
                {comment.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="bg-dark-card rounded-lg p-3">
                <div className="text-xs font-medium text-neon-green mb-1">
                  {comment.username}
                </div>
                <div className="text-sm text-white">{comment.content}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(comment.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
