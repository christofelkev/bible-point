import { isTauri } from '../platform'

/** Label of the projection window. Mirrored by `OUTPUT_LABEL` in src-tauri/src/lib.rs. */
export const OUTPUT_WINDOW_LABEL = 'output'

/** A display the operator can send the projection window to. */
export interface MonitorInfo {
  /** Stable within one session; used as the selection key. */
  id: string
  name: string
  /** Physical pixel dimensions, shown so the operator can tell displays apart. */
  width: number
  height: number
  isPrimary: boolean
}

/**
 * Owns the lifetime and placement of the projection window.
 *
 * Splitting this out from `ProjectionChannel` keeps two separate concerns
 * separate: the channel carries *what* to show, this carries *where* to show it.
 */
export interface OutputWindowController {
  listMonitors(): Promise<MonitorInfo[]>
  /** Opens the window on the given monitor, or the best guess when omitted. */
  open(monitorId?: string): Promise<boolean>
  close(): Promise<void>
  /** Fires when the window closes by any route, including the OS close button. */
  onClosed(handler: () => void): () => void
}

/**
 * Picks the display to project onto: the first non-primary monitor, falling
 * back to the only one available.
 *
 * This matches how a projector is almost always wired — the laptop panel stays
 * primary and the projector is the extended display.
 */
export function defaultMonitor(monitors: MonitorInfo[]): MonitorInfo | undefined {
  return monitors.find((m) => !m.isPrimary) ?? monitors[0]
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

/**
 * Development implementation: a real second browser window the operator drags
 * onto the projector and fullscreens with F11.
 *
 * Browsers cannot place a window on a chosen display without the Window
 * Management permission, so monitor selection is a no-op here and the UI hides
 * the picker outside Tauri.
 */
class BrowserOutputWindow implements OutputWindowController {
  private handle: Window | null = null
  private closedHandlers = new Set<() => void>()
  private poll: number | null = null

  async listMonitors(): Promise<MonitorInfo[]> {
    return [{ id: 'browser', name: 'Jendela browser', width: 0, height: 0, isPrimary: true }]
  }

  async open(): Promise<boolean> {
    const url = `${window.location.origin}${window.location.pathname}#/output`
    const features = 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    this.handle = window.open(url, 'bible-point-output', features)
    this.handle?.focus()

    // A browser window can be closed from its own titlebar, which gives no
    // event to the opener; polling is the only way to notice.
    if (this.handle) this.startPolling()
    return Boolean(this.handle)
  }

  async close(): Promise<void> {
    this.handle?.close()
    this.handle = null
    this.stopPolling()
    this.closedHandlers.forEach((h) => h())
  }

  onClosed(handler: () => void): () => void {
    this.closedHandlers.add(handler)
    return () => this.closedHandlers.delete(handler)
  }

  private startPolling() {
    this.stopPolling()
    this.poll = window.setInterval(() => {
      if (this.handle?.closed) {
        this.handle = null
        this.stopPolling()
        this.closedHandlers.forEach((h) => h())
      }
    }, 800)
  }

  private stopPolling() {
    if (this.poll != null) window.clearInterval(this.poll)
    this.poll = null
  }
}

// ---------------------------------------------------------------------------
// Tauri
// ---------------------------------------------------------------------------

/**
 * Desktop implementation: a borderless, always-on-top window placed on the
 * chosen display and switched to fullscreen.
 *
 * Position is applied in physical pixels before fullscreen is requested,
 * because fullscreen targets whichever display the window currently occupies.
 * Going the other way — fullscreen first, then move — leaves the window
 * fullscreen on the wrong monitor.
 */
class TauriOutputWindow implements OutputWindowController {
  private closedHandlers = new Set<() => void>()
  private unlistenClose: (() => void) | null = null

  async listMonitors(): Promise<MonitorInfo[]> {
    const { availableMonitors, primaryMonitor } = await import('@tauri-apps/api/window')
    const [monitors, primary] = await Promise.all([availableMonitors(), primaryMonitor()])

    return monitors.map((m, index) => ({
      id: m.name ?? `monitor-${index}`,
      name: m.name ?? `Layar ${index + 1}`,
      width: m.size.width,
      height: m.size.height,
      isPrimary:
        primary != null &&
        m.position.x === primary.position.x &&
        m.position.y === primary.position.y,
    }))
  }

  async open(monitorId?: string): Promise<boolean> {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    const { availableMonitors, primaryMonitor, PhysicalPosition } = await import('@tauri-apps/api/window')

    const existing = await WebviewWindow.getByLabel(OUTPUT_WINDOW_LABEL)
    if (existing) {
      await existing.setFocus()
      return true
    }

    const [monitors, primary] = await Promise.all([availableMonitors(), primaryMonitor()])
    const infos: MonitorInfo[] = monitors.map((m, index) => ({
      id: m.name ?? `monitor-${index}`,
      name: m.name ?? `Layar ${index + 1}`,
      width: m.size.width,
      height: m.size.height,
      isPrimary:
        primary != null &&
        m.position.x === primary.position.x &&
        m.position.y === primary.position.y,
    }))

    const wantedIndex = monitorId ? infos.findIndex((m) => m.id === monitorId) : -1
    const chosenIndex = wantedIndex >= 0
      ? wantedIndex
      : infos.indexOf(defaultMonitor(infos) ?? infos[0])
    const target = monitors[chosenIndex] ?? monitors[0]

    // With a single display there is nowhere to project *to*. Going fullscreen
    // and always-on-top would bury the control window under an opaque rectangle
    // the operator has no remaining UI to dismiss. So on one screen the output
    // opens as an ordinary movable window — which is also what makes the app
    // testable on a laptop with no projector attached.
    const projecting = monitors.length > 1

    // The constructor takes logical units, so convert the monitor's physical
    // origin. The exact placement is corrected below anyway; this only keeps
    // the window from flashing on the wrong display while it is created.
    const scale = target?.scaleFactor ?? 1
    const win = new WebviewWindow(OUTPUT_WINDOW_LABEL, {
      url: 'index.html#/output',
      title: 'Bible Point — Output',
      x: projecting && target ? Math.round(target.position.x / scale) : undefined,
      y: projecting && target ? Math.round(target.position.y / scale) : undefined,
      width: projecting && target ? Math.round(target.size.width / scale) : 1280,
      height: projecting && target ? Math.round(target.size.height / scale) : 720,
      center: !projecting,
      decorations: !projecting,
      alwaysOnTop: projecting,
      skipTaskbar: false,
      focus: false,
      resizable: !projecting,
    })

    const created = await new Promise<boolean>((resolve) => {
      win.once('tauri://created', () => resolve(true))
      win.once('tauri://error', () => resolve(false))
    })
    if (!created) return false

    if (projecting && target) {
      await win.setPosition(new PhysicalPosition(target.position.x, target.position.y))
      await win.setFullscreen(true)
      await win.setCursorVisible(false)
    }

    this.unlistenClose?.()
    const unlisten = await win.onCloseRequested(() => {
      this.closedHandlers.forEach((h) => h())
    })
    this.unlistenClose = unlisten

    return true
  }

  async close(): Promise<void> {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    const win = await WebviewWindow.getByLabel(OUTPUT_WINDOW_LABEL)
    await win?.close()
    this.unlistenClose?.()
    this.unlistenClose = null
    this.closedHandlers.forEach((h) => h())
  }

  onClosed(handler: () => void): () => void {
    this.closedHandlers.add(handler)
    return () => this.closedHandlers.delete(handler)
  }
}

/** The single place the app decides how the projection window is created. */
export const outputWindow: OutputWindowController = isTauri()
  ? new TauriOutputWindow()
  : new BrowserOutputWindow()
