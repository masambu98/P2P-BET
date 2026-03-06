import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
  type?: 'win' | 'bonus' | 'achievement'
}

export default function Confetti({ trigger, onComplete, type = 'win' }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([])

  useEffect(() => {
    if (trigger) {
      const colors = type === 'win' 
        ? ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'] // Green and gold
        : type === 'bonus'
        ? ['#8b5cf6', '#a78bfa', '#c4b5fd', '#f472b6', '#f9a8d4'] // Purple and pink
        : ['#3b82f6', '#60a5fa', '#93c5fd', '#f87171', '#fca5a5'] // Blue and red

      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5
      }))

      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [trigger, type, onComplete])

  if (!trigger || particles.length === 0) return null

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Full screen flash for wins */}
      {type === 'win' && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-yellow-500/20 animate-pulse" />
      )}
      
      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animation: `fall 3s ease-out ${particle.delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
      
      {/* Celebration text for wins */}
      {type === 'win' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl md:text-8xl font-bold text-white animate-bounce">
            🏆
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>,
    document.body
  )
}
