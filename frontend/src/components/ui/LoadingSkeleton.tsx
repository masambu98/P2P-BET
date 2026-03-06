interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'bet' | 'profile'
}

export default function LoadingSkeleton({ className = '', variant = 'text' }: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%]"
  
  if (variant === 'text') {
    return (
      <div className={`${baseClasses} h-4 rounded ${className}`} 
           style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
    )
  }

  if (variant === 'card') {
    return (
      <div className={`card ${className}`}>
        <div className={`${baseClasses} h-6 w-3/4 rounded mb-4`}
             style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
        <div className={`${baseClasses} h-4 w-full rounded mb-2`}
             style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.2s' }} />
        <div className={`${baseClasses} h-4 w-5/6 rounded mb-2`}
             style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.4s' }} />
        <div className={`${baseClasses} h-4 w-2/3 rounded`}
             style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.6s' }} />
      </div>
    )
  }

  if (variant === 'bet') {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className={`${baseClasses} w-10 h-10 rounded-full`}
               style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
          <div className="flex-1">
            <div className={`${baseClasses} h-4 w-1/3 rounded mb-2`}
                 style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.2s' }} />
            <div className={`${baseClasses} h-3 w-1/4 rounded`}
                 style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.4s' }} />
          </div>
        </div>
        <div className={`${baseClasses} h-5 w-full rounded mb-3`}
             style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.6s' }} />
        <div className="flex justify-between">
          <div className={`${baseClasses} h-8 w-20 rounded`}
               style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.8s' }} />
          <div className={`${baseClasses} h-8 w-24 rounded`}
               style={{ animation: 'shimmer 1.5s ease-in-out infinite 1s' }} />
        </div>
      </div>
    )
  }

  if (variant === 'profile') {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center space-x-4 mb-6">
          <div className={`${baseClasses} w-16 h-16 rounded-full`}
               style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
          <div className="flex-1">
            <div className={`${baseClasses} h-5 w-32 rounded mb-2`}
                 style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.2s' }} />
            <div className={`${baseClasses} h-4 w-24 rounded`}
                 style={{ animation: 'shimmer 1.5s ease-in-out infinite 0.4s' }} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className={`${baseClasses} h-6 w-16 mx-auto rounded mb-2`}
                   style={{ animation: 'shimmer 1.5s ease-in-out infinite ${i * 0.2}s' }} />
              <div className={`${baseClasses} h-4 w-20 mx-auto rounded`}
                   style={{ animation: 'shimmer 1.5s ease-in-out infinite ${i * 0.2 + 0.6}s' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`${baseClasses} h-4 rounded ${className}`}
         style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
  )
}

// Add shimmer animation to global styles
const shimmerStyle = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`

// Inject style into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = shimmerStyle
  document.head.appendChild(styleElement)
}
