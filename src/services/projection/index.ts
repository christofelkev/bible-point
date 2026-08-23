import { isTauri } from '../platform'
import { BroadcastChannelTransport } from './BroadcastChannelTransport'
import { TauriEventTransport } from './TauriEventTransport'

export type { ProjectionChannel } from './ProjectionChannel'
export type { MonitorInfo, OutputWindowController } from './outputWindow'
export { outputWindow, defaultMonitor, OUTPUT_WINDOW_LABEL } from './outputWindow'

/**
 * The single place the app decides how the two windows talk.
 *
 * Tauri's event bus in the desktop shell, BroadcastChannel when the same bundle
 * runs in a plain browser during development. Every caller works against the
 * `ProjectionChannel` interface and is unaware of which one it got.
 */
export const projectionChannel = isTauri()
  ? new TauriEventTransport()
  : new BroadcastChannelTransport()
