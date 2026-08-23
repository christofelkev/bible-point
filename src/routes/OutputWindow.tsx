import { useEffect, useState } from 'react'
import type { ProjectionState } from '../types/projection'
import { projectionChannel } from '../services/projection'
import { VerseStage } from '../components/stage/VerseStage'
import { BUILTIN_THEMES } from '../data/presets'

const INITIAL: ProjectionState = {
  mode: 'logo',
  verses: [],
  theme: BUILTIN_THEMES[0],
  revision: 0,
}

/**
 * The projected window. It holds no application logic of its own — it listens
 * for snapshots and renders them, which is what makes it safe to close and
 * reopen at any point during a service.
 */
export function OutputWindow() {
  const [state, setState] = useState<ProjectionState>(INITIAL)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const unsubscribe = projectionChannel.subscribe(setState)
    // Ask the control window for the current snapshot rather than waiting for
    // the operator's next action.
    projectionChannel.requestSync()
    return unsubscribe
  }, [])

  // The fullscreen hint is for the browser demo only; under Tauri the output
  // window opens borderless on the chosen display and needs no instruction.
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 6000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.title = 'Bible Point — Output'
  }, [])

  return (
    <div className="h-full w-full relative bg-black cursor-none">
      <VerseStage state={state} />

      {showHint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 rounded-full bg-black/70 backdrop-blur px-4 py-2 text-[11px] text-white/70 pointer-events-none">
          Geser jendela ini ke layar kedua, lalu tekan F11 untuk fullscreen
        </div>
      )}
    </div>
  )
}
