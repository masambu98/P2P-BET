import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Target, TrendingUp } from 'lucide-react'

interface NearMissModalProps {
  isOpen: boolean
  onClose: () => void
  betDetails: {
    title: string
    margin: string
    potentialWin: number
    actualResult: string
    predictedResult: string
  }
}

export default function NearMissModal({ isOpen, onClose, betDetails }: NearMissModalProps) {
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      // Show detailed analysis after 2 seconds
      const analysisTimer = setTimeout(() => {
        setShowAnalysis(true)
      }, 2000)

      return () => {
        clearTimeout(timer)
        clearTimeout(analysisTimer)
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-dark-card rounded-2xl p-8 max-w-md w-full border border-orange-500/30 shadow-2xl transform animate-[scaleIn_0.3s_ease-out]">
        {/* Header with warning icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Main message */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-orange-400 mb-2 animate-pulse">
            SO CLOSE! 😤
          </h2>
          <p className="text-gray-300 text-lg">
            You were just {betDetails.margin} away from winning
          </p>
        </div>

        {/* Bet details */}
        <div className="bg-dark-bg rounded-xl p-4 mb-6 border border-gray-700">
          <h3 className="text-white font-semibold mb-3">{betDetails.title}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Your prediction:</span>
              <span className="text-white font-medium">{betDetails.predictedResult}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Actual result:</span>
              <span className="text-orange-400 font-medium">{betDetails.actualResult}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-gray-400">Missed by:</span>
              <span className="text-orange-400 font-bold text-lg">{betDetails.margin}</span>
            </div>
          </div>
        </div>

        {/* The painful part - what you missed */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 mb-6 border border-orange-500/30">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">You could have won</div>
            <div className="text-3xl font-bold text-orange-400 animate-pulse">
              KES {betDetails.potentialWin.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Detailed analysis (appears after 2 seconds) */}
        {showAnalysis && (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <div className="bg-dark-bg rounded-xl p-4 mb-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-blue-400" />
                <h4 className="text-white font-semibold">Quick Analysis</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Your prediction was {betDetails.margin} off perfect</p>
                <p>• This happens to 23% of successful bettors</p>
                <p>• Next time, consider the recent form trends</p>
                <p>• You're getting closer - keep analyzing!</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => {
              onClose()
              // Navigate to create similar bet
              window.location.href = '/create-bet'
            }}
            className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Close
          </button>
        </div>

        {/* Countdown timer */}
        <div className="text-center mt-4">
          <div className="text-xs text-gray-500">
            Auto-closes in <span className="text-orange-400 font-mono">5</span> seconds
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  )
}
