import { useState } from 'react'

export default function CreateBet() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: 'Football',
    event: '',
    marketType: 'yes_no',
    proposedOutcome: 'yes',
    stakeAmount: '',
    maxStakeAmount: '5000',
    expiryDate: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Creating bet:', formData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create Bet Proposal
          </h2>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="input"
                placeholder="e.g., Man United vs Liverpool - Will draw?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="input"
                rows={3}
                placeholder="Additional details about the bet..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({...formData, sport: e.target.value})}
                  className="input"
                >
                  <option value="Football">Football</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Boxing">Boxing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event
                </label>
                <input
                  type="text"
                  value={formData.event}
                  onChange={(e) => setFormData({...formData, event: e.target.value})}
                  className="input"
                  placeholder="e.g., Man United vs Liverpool"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market Type
              </label>
              <select
                value={formData.marketType}
                onChange={(e) => setFormData({...formData, marketType: e.target.value})}
                className="input"
              >
                <option value="yes_no">Yes/No</option>
                <option value="spread">Point Spread</option>
                <option value="moneyline">Moneyline</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Prediction
              </label>
              <select
                value={formData.proposedOutcome}
                onChange={(e) => setFormData({...formData, proposedOutcome: e.target.value})}
                className="input"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stake Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.stakeAmount}
                  onChange={(e) => setFormData({...formData, stakeAmount: e.target.value})}
                  className="input"
                  placeholder="1000"
                  min="100"
                  max="50000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Stake Amount (KES)
                </label>
                <input
                  type="number"
                  value={formData.maxStakeAmount}
                  onChange={(e) => setFormData({...formData, maxStakeAmount: e.target.value})}
                  className="input"
                  placeholder="5000"
                  min="100"
                  max="50000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="datetime-local"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="input"
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                className="btn btn-primary"
              >
                Create Bet Proposal
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFormData({
                  title: '',
                  description: '',
                  sport: 'Football',
                  event: '',
                  marketType: 'yes_no',
                  proposedOutcome: 'yes',
                  stakeAmount: '',
                  maxStakeAmount: '5000',
                  expiryDate: ''
                })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
