import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { startAutosave } from '../store/persistence'
import { TopBar } from '../components/control/TopBar'
import { BibleNavigator } from '../components/control/BibleNavigator'
import { VerseList } from '../components/control/VerseList'
import { RightPanel } from '../components/control/RightPanel'
import { LiveWorkspace } from '../components/live/LiveWorkspace'
import { SplashScreen } from '../components/control/SplashScreen'

/** The operator's window: browse, select, style, project. */
export function ControlWindow() {
  const init = useAppStore((s) => s.init)
  const workspaceMode = useAppStore((s) => s.workspaceMode)
  const [isReady, setIsReady] = useState(false)

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
      setIsReady(true)
      stop = startAutosave()
    })

    return () => {
      cancelled = true
      stop?.()
    }
  }, [init])

  useProjectionShortcuts()

  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden">
      <SplashScreen isReady={isReady} />
      <TopBar />
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
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
  const jumpToSlideIndex = useAppStore((s) => s.jumpToSlideIndex)
  const jumpToSection = useAppStore((s) => s.jumpToSection)

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

      // Live mode slide jump via numbers 1-9 (without modifiers)
      if (/^[1-9]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        jumpToSlideIndex(Number(event.key) - 1)
        return
      }

      // ProPresenter style letter hotkeys for song sections (without modifiers)
      if (/^[a-zA-Z]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        const state = useAppStore.getState()
        if (state.workspaceMode === 'live' && state.presentationSubTab === 'songs') {
          const pressed = event.key.toUpperCase()
          const matchedEntry = Object.entries(state.sectionHotkeys).find(
            ([, k]) => k.toUpperCase() === pressed,
          )
          if (matchedEntry) {
            const badgeTarget = matchedEntry[0].toLowerCase()
            const activeSong = state.songs.find((s) => s.id === state.activeSongId)
            const slides = state.liveSongSlides.length > 0 ? state.liveSongSlides : (activeSong?.slides ?? [])
            const foundIdx = slides.findIndex(
              (s) => s.badge?.toLowerCase() === badgeTarget || s.badge?.toLowerCase().startsWith(badgeTarget),
            )
            if (foundIdx >= 0) {
              event.preventDefault()
              state.goLiveSlide(slides[foundIdx], slides, foundIdx)
              return
            }
          }
        }
      }

      // Quick section jumps with Shift
      if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === 'C' || event.key === 'c') {
          event.preventDefault()
          jumpToSection('chorus')
          return
        }
        if (event.key === 'V' || event.key === 'v') {
          event.preventDefault()
          jumpToSection('verse')
          return
        }
        if (event.key === 'B' || event.key === 'b') {
          event.preventDefault()
          jumpToSection('bridge')
          return
        }
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
        case 'Home':
          event.preventDefault()
          jumpToSlideIndex(0)
          break
        case 'End':
          event.preventDefault()
          jumpToSlideIndex(999)
          break
        case 'b':
        case 'B':
        case 'F1':
          event.preventDefault()
          setMode(mode === 'black' ? 'live' : 'black')
          break
        case 'c':
        case 'C':
        case 'F2':
          event.preventDefault()
          setMode(mode === 'clear' ? 'live' : 'clear')
          break
        case 'Enter':
          event.preventDefault()
          const ws = useAppStore.getState().workspaceMode
          if (ws === 'live') {
            jumpToSlideIndex(0)
          } else {
            goLive()
          }
          break
        case 'Escape':
        case 'F3':
          event.preventDefault()
          setMode('logo')
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [stepLive, setMode, goLive, setWorkspaceMode, jumpToSlideIndex, jumpToSection])
}
