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
        {/* Logo BP */}
        <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 mb-4 animate-in fade-in zoom-in-95 duration-500">
          <span className="text-2xl font-black tracking-tight">BP</span>
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
          v0.2.2
        </span>
      </div>
    </div>
  )
}
