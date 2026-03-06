import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Loader2 } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface ConnectionStatusProps {
  showText?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
}

export default function ConnectionStatus({ 
  showText = false, 
  position = 'top-right',
  size = 'md' 
}: ConnectionStatusProps) {
  const { status } = useSocket();

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-2 text-xs';
      case 'md':
        return 'p-3 text-sm';
      case 'lg':
        return 'p-4 text-base';
      default:
        return 'p-3 text-sm';
    }
  };

  const getStatusInfo = () => {
    if (status.connecting) {
      return {
        icon: Loader2,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        text: 'Connecting...',
        animate: 'animate-spin'
      };
    }

    if (status.connected) {
      return {
        icon: Wifi,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        text: 'Connected',
        animate: ''
      };
    }

    if (status.reconnectAttempts > 0) {
      return {
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        text: `Reconnecting (${status.reconnectAttempts}/2)...`,
        animate: 'animate-pulse'
      };
    }

    return {
      icon: WifiOff,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      text: 'Disconnected',
      animate: ''
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`fixed z-50 ${getPositionClasses()}`}>
      <div className={`flex items-center space-x-2 glass-card rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor} ${getSizeClasses()}`}>
        <Icon className={`w-4 h-4 ${statusInfo.color} ${statusInfo.animate}`} />
        {showText && (
          <span className={`font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        )}
      </div>
    </div>
  );
}

// Compact version for mobile
export function CompactConnectionStatus() {
  const { status } = useSocket();

  const getStatusDot = () => {
    if (status.connecting) {
      return 'bg-yellow-500 animate-pulse';
    }
    if (status.connected) {
      return 'bg-green-500';
    }
    return 'bg-red-500';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`w-3 h-3 rounded-full ${getStatusDot()} shadow-lg`} />
    </div>
  );
}

// Status bar version for dashboard
export function StatusBarConnection() {
  const { status } = useSocket();

  const getStatusText = () => {
    if (status.connecting) return 'Connecting...';
    if (status.connected) return 'Live';
    if (status.reconnectAttempts > 0) return `Reconnecting...`;
    return 'Offline';
  };

  const getStatusColor = () => {
    if (status.connecting) return 'text-yellow-500';
    if (status.connected) return 'text-green-500';
    if (status.reconnectAttempts > 0) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1 glass-card rounded-full">
      <div className={`w-2 h-2 rounded-full ${
        status.connected ? 'bg-green-500' : 
        status.connecting ? 'bg-yellow-500 animate-pulse' : 
        'bg-red-500'
      }`} />
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {status.socketId && (
        <span className="text-xs text-gray-500 hidden sm:inline">
          ID: {status.socketId.slice(-6)}
        </span>
      )}
    </div>
  );
}
