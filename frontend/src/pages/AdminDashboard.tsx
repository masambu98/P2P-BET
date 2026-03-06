import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('settlements')
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching active bets
    setTimeout(() => {
      setBets([
        {
          id: '1',
          title: 'Man United vs Liverpool',
          sport: 'Football',
          event: 'Premier League',
          marketType: 'yes_no',
          proposedOutcome: 'yes',
          stakeAmount: 5000,
          maxStakeAmount: 10000,
          status: 'ACTIVE',
          proposer: { username: 'demo1', id: '1' },
          acceptor: { username: 'demo2', id: '2' },
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          title: 'Chelsea vs Arsenal',
          sport: 'Football',
          event: 'Premier League',
          marketType: 'over_under',
          proposedOutcome: 'over',
          stakeAmount: 2000,
          maxStakeAmount: 5000,
          status: 'PENDING',
          proposer: { username: 'demo1', id: '1' },
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleSettleBet = (betId: string, result: 'proposer_wins' | 'acceptor_wins') => {
    console.log(`Settling bet ${betId} as ${result}`)
    // Simulate API call
    setBets(bets.map(bet => 
      bet.id === betId ? { ...bet, status: 'SETTLED' } : bet
    ))
  }

  const handleApproveWithdrawal = (withdrawalId: string) => {
    console.log(`Approving withdrawal ${withdrawalId}`)
    // Simulate API call
    setBets(bets.map(bet => 
      bet.withdrawalRequests?.id === withdrawalId ? 
        { ...bet, status: 'SETTLED', withdrawalStatus: 'APPROVED' } : 
        bet
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, settle bets, and monitor platform
          </p>
        </div>

        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('settlements')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'settlements' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bet Settlements
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'withdrawals' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Withdrawal Requests
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'users' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Management
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'settlements' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bets.filter(bet => bet.status === 'ACTIVE').map((bet) => (
                  <div key={bet.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{bet.title}</h3>
                        <p className="text-sm text-gray-600">{bet.event}</p>
                        <p className="text-sm text-gray-600">{bet.sport} - {bet.marketType}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">KES {bet.stakeAmount}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          bet.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          bet.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          bet.status === 'SETTLED' ? 'bg-gray-100 text-gray-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bet.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Proposer:</span>
                        <span className="font-semibold">{bet.proposer.username}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Acceptor:</span>
                        <span className="font-semibold">{bet.acceptor.username}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="font-semibold">{new Date(bet.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Expires:</span>
                        <span className="font-semibold">{new Date(bet.expiryDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => handleSettleBet(bet.id, 'proposer_wins')}
                        className="btn btn-success"
                      >
                        Proposer Wins
                      </button>
                      <button
                        onClick={() => handleSettleBet(bet.id, 'acceptor_wins')}
                        className="btn btn-danger"
                      >
                        Acceptor Wins
                      </button>
                      <button className="btn btn-secondary">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              <div className="text-center py-12 text-gray-600">
                <p>No withdrawal requests available</p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="text-center py-12 text-gray-600">
                <p>User management coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}