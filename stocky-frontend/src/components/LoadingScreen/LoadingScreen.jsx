import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './LoadingScreen.css'

const MESSAGES = [
  'Waking up the warehouse…',
  'Counting the stock…',
  'Syncing with your suppliers…',
  'Almost there…',
]

// Small crates drifting up through the scene. Randomized once per mount so
// the motion feels alive rather than mechanically repeating.
function useParticles(count = 14) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        size: 10 + Math.round(Math.random() * 14),
        duration: 9 + Math.random() * 8,
        delay: -Math.random() * 14,
      })),
    [count]
  )
}

function WarehouseMark() {
  return (
    <svg
      className="loading-mark"
      viewBox="0 0 160 160"
      role="img"
      aria-label="Stocky"
    >
      <defs>
        <linearGradient id="sk-roof" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="sk-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <linearGradient id="sk-door" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde9b0" />
          <stop offset="100%" stopColor="#f5c157" />
        </linearGradient>
      </defs>
      <polygon points="80,18 148,64 12,64" fill="url(#sk-roof)" />
      <rect x="76" y="0" width="8" height="24" fill="#fbe19b" />
      <rect x="24" y="64" width="112" height="80" fill="url(#sk-body)" />
      <rect x="36" y="78" width="28" height="28" fill="#6d28d9" opacity="0.55" />
      <rect x="96" y="78" width="28" height="28" fill="#6d28d9" opacity="0.55" />
      <path
        d="M64 144 L64 100 A16 16 0 0 1 96 100 L96 144 Z"
        fill="url(#sk-door)"
      />
    </svg>
  )
}

export default function LoadingScreen({ progress }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const particles = useParticles()

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length)
    }, 1600)
    return () => clearInterval(interval)
  }, [])

  // Falls back to a soft indeterminate sweep if no real progress is supplied.
  const hasRealProgress = typeof progress === 'number'
  const barWidth = hasRealProgress ? `${Math.min(100, Math.max(0, progress))}%` : '100%'
  const barDuration = hasRealProgress ? 0.4 : 2.4

  return (
    <div className="loading-screen">
      <div className="loading-glow loading-glow-1" />
      <div className="loading-glow loading-glow-2" />
      <div className="loading-glow loading-glow-3" />

      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="loading-content">
        <div className="loading-rings">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <span className="ring ring-3" />

          <motion.span
            className="spin-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          />

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <WarehouseMark />
          </motion.div>
        </div>

        <motion.p
          className="loading-brand"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          Stocky
        </motion.p>

        <p className="loading-tagline">INVENTORY, REFINED</p>

        <div className="loading-message">
          <AnimatePresence mode="wait">
            <motion.span
              key={messageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {MESSAGES[messageIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="loading-bar-track">
          <motion.div
            className="loading-bar-fill"
            initial={{ width: '0%' }}
            animate={{ width: barWidth }}
            transition={{ duration: barDuration, ease: 'easeInOut' }}
          />
          <motion.div
            className="loading-bar-shine"
            animate={{ x: ['-100%', '220%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  )
}