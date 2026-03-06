import { useState, useEffect } from 'react'
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown, 
  Bitcoin,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  Info,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface BalanceInfo {
  currentBalance: number
  totalDeposited: number
  totalWithdrawn: number
  btcEquivalent: number
  transactions: Transaction[]
}

interface Transaction {
  id: string
  userId: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET'
  amountKES: number
  amountBTC: number
  feeKES: number
  feeBTC: number
  btcAddress?: string
  btcTxId?: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  createdAt: string
  updatedAt: string
}

interface DepositInfo {
  address: string
  amountBTC: number
  feeKES: number
  feeBTC: number
  totalBTC: number
  chargeCode: string
  hostedUrl: string
  qrCode: string
}

export default function Wallet() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bitcoin'>('mpesa')
  const [amount, setAmount] = useState('')
  const [btcAddress, setBtcAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null)
  const [btcToKESRate, setBtcToKESRate] = useState(3500000)
  const [copied, setCopied] = useState(false)

  // Fetch BTC to KES rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=kes')
        const data = await response.json()
        setBtcToKESRate(data.bitcoin.kes)
      } catch (error) {
        console.error('Failed to fetch BTC rate:', error)
      }
    }
    fetchRate()
    const interval = setInterval(fetchRate, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Fetch balance info
  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('auth-storage')
      if (token) {
        const authData = JSON.parse(token)
        const response = await fetch('/api/wallet/balance', {
          headers: {
            'Authorization': `Bearer ${authData.state?.token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setBalanceInfo(data.balanceInfo)
        }
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('auth-storage')
      if (token) {
        const authData = JSON.parse(token)
        const response = await fetch('/api/wallet/btc/deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.state?.token}`
          },
          body: JSON.stringify({ amountKES: parseFloat(amount) })
        })

        if (response.ok) {
          const data = await response.json()
          setDepositInfo(data.depositInfo)
          setMessage('Bitcoin deposit address generated!')
          setAmount('')
        } else {
          const error = await response.json()
          setMessage(error.error || 'Failed to generate deposit address')
        }
      }
    } catch (error) {
      setMessage('Failed to generate deposit address')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('auth-storage')
      if (token) {
        const authData = JSON.parse(token)
        const response = await fetch('/api/wallet/btc/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.state?.token}`
          },
          body: JSON.stringify({ 
            btcAddress, 
            amountKES: parseFloat(amount) 
          })
        })

        if (response.ok) {
          const data = await response.json()
          setMessage('Withdrawal request submitted successfully!')
          setAmount('')
          setBtcAddress('')
          fetchBalance() // Refresh balance
        } else {
          const error = await response.json()
          setMessage(error.error || 'Failed to process withdrawal')
        }
      }
    } catch (error) {
      setMessage('Failed to process withdrawal')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMpesaDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('auth-storage')
      if (token) {
        const authData = JSON.parse(token)
        const response = await fetch('/api/payments/mpesa/deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.state?.token}`
          },
          body: JSON.stringify({ 
            phoneNumber,
            amountKES: parseFloat(amount) 
          })
        })

        if (response.ok) {
          const data = await response.json()
          setMessage('M-Pesa STK Push sent! Please check your phone.')
          setAmount('')
          setPhoneNumber('')
        } else {
          const error = await response.json()
          setMessage(error.error || 'Failed to initiate M-Pesa deposit')
        }
      }
    } catch (error) {
      setMessage('Failed to initiate M-Pesa deposit')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMpesaWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('auth-storage')
      if (token) {
        const authData = JSON.parse(token)
        const response = await fetch('/api/payments/withdrawal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.state?.token}`
          },
          body: JSON.stringify({ 
            amount: parseFloat(amount),
            method: 'mpesa',
            destination: phoneNumber 
          })
        })

        if (response.ok) {
          const data = await response.json()
          setMessage('Withdrawal request submitted successfully!')
          setAmount('')
          setPhoneNumber('')
          fetchBalance()
        } else {
          const error = await response.json()
          setMessage(error.error || 'Failed to process withdrawal')
        }
      }
    } catch (error) {
      setMessage('Failed to process withdrawal')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number, currency: 'KES' | 'BTC' = 'KES') => {
    if (currency === 'BTC') {
      return `${amount.toFixed(8)} BTC`
    }
    return `KES ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'badge-success'
      case 'PENDING': return 'badge-warning'
      case 'FAILED': return 'badge-danger'
      default: return 'badge-info'
    }
  }

  const calculateWithdrawalPreview = () => {
    const amountKES = parseFloat(amount) || 0
    const feeKES = amountKES * 0.03
    const totalKES = amountKES + feeKES
    const totalBTC = totalKES / btcToKESRate
    return { amountKES, feeKES, totalKES, totalBTC }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 glow-text">Bitcoin Wallet</h1>
          <p className="text-gray-400">Manage your Bitcoin deposits and withdrawals</p>
        </div>

        {/* Balance Cards */}
        {balanceInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Current Balance</h3>
                <WalletIcon className="w-6 h-6 text-neon-green animate-pulse-slow" />
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-neon-green">
                  {formatCurrency(balanceInfo.currentBalance)}
                </div>
                <div className="text-sm text-gray-400">
                  ≈ {formatCurrency(balanceInfo.btcEquivalent, 'BTC')}
                </div>
                <div className="text-xs text-gray-500">
                  1 BTC = KES {btcToKESRate.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Total Deposited</h3>
                <TrendingDown className="w-6 h-6 text-neon-blue" />
              </div>
              <div className="text-2xl font-bold text-neon-blue">
                {formatCurrency(balanceInfo.totalDeposited)}
              </div>
            </div>

            <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-300">Total Withdrawn</h3>
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(balanceInfo.totalWithdrawn)}
              </div>
            </div>
          </div>
        )}

        {/* Fee Transparency */}
        <div className="card mb-8 animate-fade-in">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="w-5 h-5 text-neon-green" />
            <h3 className="text-lg font-semibold text-gray-300">Platform Fees</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Deposit Fee</span>
                <span className="font-bold text-warning">2%</span>
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Withdrawal Fee</span>
                <span className="font-bold text-warning">3%</span>
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Bet House Edge</span>
                <span className="font-bold text-warning">5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-dark-card/50 p-1 rounded-xl">
          {(['deposit', 'withdraw', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-neon-green text-dark-bg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card">
          {/* Deposit Tab */}
          {activeTab === 'deposit' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-300 mb-6">Deposit Funds</h3>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'mpesa'
                        ? 'border-neon-green bg-neon-green/10'
                        : 'border-dark-border hover:border-gray-600'
                    }`}
                  >
                    <div className="text-lg font-semibold text-green-400">M-Pesa</div>
                    <div className="text-sm text-gray-400">Kenyan mobile money</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bitcoin')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'bitcoin'
                        ? 'border-neon-green bg-neon-green/10'
                        : 'border-dark-border hover:border-gray-600'
                    }`}
                  >
                    <div className="text-lg font-semibold text-orange-400">Bitcoin</div>
                    <div className="text-sm text-gray-400">Cryptocurrency</div>
                  </button>
                </div>
              </div>

              {/* M-Pesa Deposit Form */}
              {paymentMethod === 'mpesa' && (
                <form onSubmit={handleMpesaDeposit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="input"
                      placeholder="254712345678"
                      pattern="^(?:\+254|0)?[17]\d{8}$"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input"
                      placeholder="Enter amount in KES"
                      min="100"
                      step="100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Processing...' : 'Request M-Pesa STK Push'}</span>
                  </button>
                </form>
              )}

              {/* Bitcoin Deposit Form */}
              {paymentMethod === 'bitcoin' && (
                <>
                  {!depositInfo ? (
                    <form onSubmit={handleDeposit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          Amount (KES)
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="input"
                          placeholder="Enter amount in KES"
                          min="100"
                          step="100"
                          required
                        />
                        {amount && (
                          <div className="mt-2 text-sm text-gray-400">
                            You will receive: {formatCurrency((parseFloat(amount) * 0.98) / btcToKESRate, 'BTC')}
                            <br />
                            Fee (2%): {formatCurrency(parseFloat(amount) * 0.02)}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Bitcoin className="w-4 h-4" />
                        )}
                        <span>{isLoading ? 'Generating...' : 'Generate BTC Address'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="glass-card p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-gray-300 mb-4">Send Bitcoin to this Address</h4>
                        
                        {/* QR Code */}
                        <div className="flex justify-center mb-6">
                          <img src={depositInfo.qrCode} alt="BTC QR Code" className="w-48 h-48" />
                        </div>

                        {/* Address */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Bitcoin Address
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={depositInfo.address}
                              readOnly
                              className="input flex-1 font-mono text-sm"
                            />
                            <button
                              onClick={() => copyToClipboard(depositInfo.address)}
                              className="btn btn-secondary p-2"
                            >
                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Amount Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="glass-card p-3 rounded-lg">
                            <p className="text-xs text-gray-500">Amount to Send</p>
                            <p className="font-bold text-neon-green">
                              {formatCurrency(depositInfo.totalBTC, 'BTC')}
                            </p>
                          </div>
                          <div className="glass-card p-3 rounded-lg">
                            <p className="text-xs text-gray-500">You'll Receive</p>
                            <p className="font-bold text-neon-blue">
                              {formatCurrency(depositInfo.amountBTC, 'BTC')}
                            </p>
                          </div>
                        </div>

                        <div className="glass-card p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Transaction Fee (2%)</p>
                          <p className="font-bold text-warning">
                            {formatCurrency(depositInfo.feeKES)} ({formatCurrency(depositInfo.feeBTC, 'BTC')})
                          </p>
                        </div>

                        <div className="flex space-x-4 mt-6">
                          <a
                            href={depositInfo.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Pay with Coinbase</span>
                          </a>
                          <button
                            onClick={() => setDepositInfo(null)}
                            className="btn btn-secondary"
                          >
                            New Deposit
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {message && (
                <div className={`mt-4 p-4 rounded-lg ${
                  message.includes('Failed') ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-success/20 text-success border border-success/30'
                }`}>
                  {message}
                </div>
              )}
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-300 mb-6">Withdraw Funds</h3>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'mpesa'
                        ? 'border-neon-green bg-neon-green/10'
                        : 'border-dark-border hover:border-gray-600'
                    }`}
                  >
                    <div className="text-lg font-semibold text-green-400">M-Pesa</div>
                    <div className="text-sm text-gray-400">Kenyan mobile money</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bitcoin')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'bitcoin'
                        ? 'border-neon-green bg-neon-green/10'
                        : 'border-dark-border hover:border-gray-600'
                    }`}
                  >
                    <div className="text-lg font-semibold text-orange-400">Bitcoin</div>
                    <div className="text-sm text-gray-400">Cryptocurrency</div>
                  </button>
                </div>
              </div>

              {/* M-Pesa Withdraw Form */}
              {paymentMethod === 'mpesa' && (
                <form onSubmit={handleMpesaWithdraw} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="input"
                      placeholder="254712345678"
                      pattern="^(?:\+254|0)?[17]\d{8}$"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input"
                      placeholder="Enter amount in KES"
                      min="500"
                      step="100"
                      required
                    />
                    {amount && balanceInfo && (
                      <div className="mt-2 text-sm text-gray-400">
                        Available: {formatCurrency(balanceInfo.currentBalance)}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-danger w-full flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Processing...' : 'Withdraw to M-Pesa'}</span>
                  </button>
                </form>
              )}

              {/* Bitcoin Withdraw Form */}
              {paymentMethod === 'bitcoin' && (
                <form onSubmit={handleWithdraw} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Bitcoin Address
                    </label>
                    <input
                      type="text"
                      value={btcAddress}
                      onChange={(e) => setBtcAddress(e.target.value)}
                      className="input"
                      placeholder="Enter your Bitcoin address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input"
                      placeholder="Enter amount in KES"
                      min="500"
                      step="100"
                      required
                    />
                    {amount && balanceInfo && (
                      <div className="mt-2 text-sm text-gray-400">
                        Available: {formatCurrency(balanceInfo.currentBalance)}
                      </div>
                    )}
                  </div>

                  {/* Withdrawal Preview */}
                  {amount && (
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Withdrawal Preview</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Amount:</span>
                          <span>{formatCurrency(calculateWithdrawalPreview().amountKES)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fee (3%):</span>
                          <span className="text-warning">{formatCurrency(calculateWithdrawalPreview().feeKES)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Deduction:</span>
                          <span className="font-bold">{formatCurrency(calculateWithdrawalPreview().totalKES)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">You'll Receive:</span>
                          <span className="text-neon-green font-bold">
                            {formatCurrency(calculateWithdrawalPreview().totalBTC, 'BTC')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-danger w-full flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Processing...' : 'Withdraw Bitcoin'}</span>
                  </button>
                </form>
              )}

              {message && (
                <div className={`mt-4 p-4 rounded-lg ${
                  message.includes('Failed') ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-success/20 text-success border border-success/30'
                }`}>
                  {message}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-300 mb-6">Transaction History</h3>
              
              {balanceInfo?.transactions && balanceInfo.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-left py-3 px-4 text-gray-400">Type</th>
                        <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                        <th className="text-left py-3 px-4 text-gray-400">Fee</th>
                        <th className="text-left py-3 px-4 text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceInfo.transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-dark-border/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {transaction.type === 'DEPOSIT' && <ArrowDownRight className="w-4 h-4 text-success" />}
                              {transaction.type === 'WITHDRAWAL' && <ArrowUpRight className="w-4 h-4 text-warning" />}
                              {transaction.type === 'BET' && <TrendingUp className="w-4 h-4 text-neon-blue" />}
                              <span className="capitalize">{transaction.type.toLowerCase()}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{formatCurrency(transaction.amountKES)}</div>
                              {transaction.amountBTC > 0 && (
                                <div className="text-xs text-gray-400">{formatCurrency(transaction.amountBTC, 'BTC')}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-warning">{formatCurrency(transaction.feeKES)}</div>
                              {transaction.feeBTC > 0 && (
                                <div className="text-xs text-gray-400">{formatCurrency(transaction.feeBTC, 'BTC')}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {formatDate(transaction.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
