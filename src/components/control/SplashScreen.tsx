import { useEffect, useState } from 'react'

interface Props {
  isReady: boolean
}

export function SplashScreen({ isReady }: Props) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(true)

  const isFading = isReady && minTimeElapsed

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isFading) {
      const fadeTimer = setTimeout(() => {
        setIsMounted(false)
      }, 400)
      return () => clearTimeout(fadeTimer)
    }
  }, [isFading])

  if (!isMounted) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-950 select-none transition-opacity duration-400 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Logo Resmi Bible Point */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/20 mb-4 border border-ink-700/60 animate-in fade-in zoom-in-95 duration-500">
          <img
            src="/app-logo.png"
            alt="Bible Point"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Judul Utama */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
          Bible Point
        </h1>

        {/* Kredit Pembuat */}
        <p className="text-xs text-ink-400 font-medium tracking-wide mb-2.5">
          made with love by chrivin
        </p>

        {/* Versi */}
        <span className="text-[11px] font-mono text-ink-500">
          v0.2.5
        </span>
      </div>
    </div>
  )
}
