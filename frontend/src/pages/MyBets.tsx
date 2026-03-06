import { useState, useEffect } from 'react'
import { Copy } from 'lucide-react'

export default function MyBets() {
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)

  const handleCopyLink = async (betId: string) => {
    const challengeUrl = `${window.location.origin}/challenge/${betId}`
    try {
      await navigator.clipboard.writeText(challengeUrl)
      console.log('Challenge link copied to clipboard')
    } catch (error) {
      console.error('Failed to copy link')
    }
  }

  useEffect(() => {
    // Simulate fetching user's bets
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
          title: 'Arsenal vs Chelsea',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            My Bets
          </h1>
          <p className="text-gray-600">
            Track your active and completed bets
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
            <p className="mt-4 text-gray-600">Loading your bets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bets.map((bet) => (
              <div key={bet.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bet.title}</h3>
                    <p className="text-sm text-gray-600">{bet.event}</p>
                    <p className="text-sm text-gray-600">{bet.sport} - {bet.marketType}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      bet.proposedOutcome === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bet.proposedOutcome}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">vs</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      bet.proposedOutcome === 'yes' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {bet.proposedOutcome === 'yes' ? 'No' : 'Yes'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Stake:</span>
                    <span className="font-semibold">KES {bet.stakeAmount}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Max Stake:</span>
                    <span className="font-semibold">KES {bet.maxStakeAmount}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Proposer:</span>
                    <span className="font-semibold">{bet.proposer.username}</span>
                  </div>
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
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="font-semibold">{new Date(bet.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Expires:</span>
                    <span className="font-semibold">{new Date(bet.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => handleCopyLink(bet.id)}
                    className="btn btn-secondary px-3"
                    title="Copy challenge link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="btn btn-secondary">
                    View Details
                  </button>
                  {bet.status === 'PENDING' && (
                    <button className="btn btn-success">
                      Accept Bet
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
