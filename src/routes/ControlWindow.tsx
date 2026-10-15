import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { startAutosave } from '../store/persistence'
import { TopBar } from '../components/control/TopBar'
import { BibleNavigator } from '../components/control/BibleNavigator'
import { VerseList } from '../components/control/VerseList'
import { RightPanel } from '../components/control/RightPanel'
import { LiveWorkspace } from '../components/live/LiveWorkspace'

/** The operator's window: browse, select, style, project. */
export function ControlWindow() {
  const init = useAppStore((s) => s.init)
  const workspaceMode = useAppStore((s) => s.workspaceMode)

  // Autosave starts only once hydration has finished; starting it earlier
  // would schedule a write of the state that was just restored.
  useEffect(() => {
    let stop: (() => void) | undefined
    // StrictMode runs this twice in development. `stop` is assigned only after
    // init resolves, so without the flag the first cleanup would find it
    // undefined and leave that subscription running forever.
    let cancelled = false

    void init().then(() => {
      if (cancelled) return
      stop = startAutosave()
    })

    return () => {
      cancelled = true
      stop?.()
    }
  }, [init])

  useProjectionShortcuts()

  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 min-h-0 flex">
        {workspaceMode === 'bible' ? (
          <>
            <BibleNavigator />
            <VerseList />
          </>
        ) : (
          <LiveWorkspace />
        )}
        <RightPanel />
      </div>
    </div>
  )
}

/**
 * Live control from the keyboard.
 *
 * Shortcuts are suppressed while a text field has focus, so typing a reference
 * in the omnibox never cuts the screen to black by accident.
 */
function useProjectionShortcuts() {
  const stepLive = useAppStore((s) => s.stepLive)
  const setMode = useAppStore((s) => s.setMode)
  const goLive = useAppStore((s) => s.goLive)
  const setWorkspaceMode = useAppStore((s) => s.setWorkspaceMode)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      if (typing) return

      // Global mode toggling
      if ((event.ctrlKey || event.metaKey) && event.key === '1') {
        event.preventDefault()
        setWorkspaceMode('bible')
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '2') {
        event.preventDefault()
        setWorkspaceMode('live')
        return
      }

      const mode = useAppStore.getState().mode

      switch (event.key) {
        case ' ':
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault()
          void stepLive(1)
          break
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault()
          void stepLive(-1)
          break
        case 'b':
        case 'B':
          event.preventDefault()
          setMode(mode === 'black' ? 'live' : 'black')
          break
        case 'c':
        case 'C':
          event.preventDefault()
          setMode(mode === 'clear' ? 'live' : 'clear')
          break
        case 'Enter':
          event.preventDefault()
          goLive()
          break
        case 'Escape':
          event.preventDefault()
          setMode('logo')
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [stepLive, setMode, goLive, setWorkspaceMode])
}
