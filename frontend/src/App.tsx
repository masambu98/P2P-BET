import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { socketService } from './services/socketService'
import { useSocketStore } from './store/socketStore'
import ConnectionStatus from './components/ui/ConnectionStatus'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BrowseBets from './pages/BrowseBets'
import CreateBet from './pages/CreateBet'
import BetDetails from './pages/BetDetails'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import Settings from './pages/Settings'
import Feed from './pages/Feed'
import Rooms from './pages/Rooms'
import RoomDetails from './pages/RoomDetails'
import Leaderboard from './pages/Leaderboard'
import MyBets from './pages/MyBets'
import Tipsters from './pages/Tipsters'

// Layout
import Navbar from './components/layout/Navbar'

function App() {
  const { user, token } = useAuthStore()
  const { setConnectionStatus, setReconnectAttempts, setSocketId, reset } = useSocketStore()

  useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark')
  }, [])

  useEffect(() => {
    if (!user || !token) {
      socketService.disconnect()
      reset()
      return
    }

    // Set up socket connection
    socketService.connect(token)

    // Listen for connection changes
    const unsubscribe = socketService.onConnectionChange((connected) => {
      setConnectionStatus(connected, socketService.isConnectingStatus())
      setReconnectAttempts(socketService.getReconnectAttempts())
      setSocketId(socketService.getSocketId())
    })

    // Join user's personal room
    socketService.joinUserRoom(user.id)

    // Subscribe to bet updates
    socketService.subscribeToBets()

    // Set up real-time event listeners
    const handleBalanceUpdate = (event: any) => {
      // Balance updates are handled by individual components
    }

    const handleNewBet = (event: any) => {
      // New bet events are handled by store
    }

    const handleBetAccepted = (event: any) => {
      // Bet accepted events are handled by store
    }

    const handleBetSettled = (event: any) => {
      // Bet settled events are handled by store
    }

    const handleNotification = (event: any) => {
      // Notifications are handled by store
    }

    const handleLiveActivity = (event: any) => {
      // Live activities are handled by store
    }

    const handleLiveActivityFeed = (event: any) => {
      // Initial live activity feed is handled by store
    }

    const handleChallengeViewed = (event: any) => {
      // Challenge viewed events are handled by store
    }

    const handleViewUpdate = (event: any) => {
      // View updates are handled by store
    }

    const handleNearMiss = (event: any) => {
      // Near miss events are handled by components
    }

    const handleSocketError = (event: any) => {
      console.error('Socket error:', event.detail)
    }

    // Add event listeners
    window.addEventListener('balance_update', handleBalanceUpdate)
    window.addEventListener('new_bet', handleNewBet)
    window.addEventListener('bet_accepted', handleBetAccepted)
    window.addEventListener('bet_settled', handleBetSettled)
    window.addEventListener('notification', handleNotification)
    window.addEventListener('live_activity', handleLiveActivity)
    window.addEventListener('live_activity_feed', handleLiveActivityFeed)
    window.addEventListener('challenge_viewed', handleChallengeViewed)
    window.addEventListener('view_update', handleViewUpdate)
    window.addEventListener('near_miss', handleNearMiss)
    window.addEventListener('socket_error', handleSocketError)

    return () => {
      // Cleanup
      unsubscribe()
      socketService.disconnect()
      
      // Remove event listeners
      window.removeEventListener('balance_update', handleBalanceUpdate)
      window.removeEventListener('new_bet', handleNewBet)
      window.removeEventListener('bet_accepted', handleBetAccepted)
      window.removeEventListener('bet_settled', handleBetSettled)
      window.removeEventListener('notification', handleNotification)
      window.removeEventListener('live_activity', handleLiveActivity)
      window.removeEventListener('live_activity_feed', handleLiveActivityFeed)
      window.removeEventListener('challenge_viewed', handleChallengeViewed)
      window.removeEventListener('view_update', handleViewUpdate)
      window.removeEventListener('near_miss', handleNearMiss)
      window.removeEventListener('socket_error', handleSocketError)
    }
  }, [user, token, setConnectionStatus, setReconnectAttempts, setSocketId, reset])

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user || !token) {
      return <Navigate to="/login" replace />
    }
    return <>{children}</>
  }

  return (
    <Router future={{ 
      v7_startTransition: true, 
      v7_relativeSplatPath: true 
    }}>
      <div className="min-h-screen bg-dark-bg text-white">
        {user && token && <Navbar />}
        
        {/* Connection Status Indicator */}
        <ConnectionStatus showText={false} position="top-right" size="sm" />
        
        <main className={user && token ? 'pt-16' : ''}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/browse-bets" element={
              <ProtectedRoute>
                <BrowseBets />
              </ProtectedRoute>
            } />
            
            <Route path="/create-bet" element={
              <ProtectedRoute>
                <CreateBet />
              </ProtectedRoute>
            } />
            
            <Route path="/bet/:id" element={
              <ProtectedRoute>
                <BetDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/profile/:username?" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="/feed" element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            } />
            
            <Route path="/rooms" element={
              <ProtectedRoute>
                <Rooms />
              </ProtectedRoute>
            } />
            
            <Route path="/rooms/:id" element={
              <ProtectedRoute>
                <RoomDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
            
            <Route path="/my-bets" element={
              <ProtectedRoute>
                <MyBets />
              </ProtectedRoute>
            } />
            
            <Route path="/tipsters" element={
              <ProtectedRoute>
                <Tipsters />
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={
              user && token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
            
            {/* 404 fallback */}
            <Route path="*" element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-gray-400">Page not found</p>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
