import { BroadcastChannelTransport } from './BroadcastChannelTransport'

export type { ProjectionChannel } from './ProjectionChannel'
export { BroadcastChannelTransport } from './BroadcastChannelTransport'

/**
 * The single place the app decides how the two windows talk.
 *
 * Under Tauri this becomes a `TauriEventTransport`; every caller keeps using
 * the `ProjectionChannel` interface and stays unchanged.
 */
export const projectionChannel = new BroadcastChannelTransport()

/**
 * Opens the output window.
 *
 * In the browser this is a separate window the operator drags onto the second
 * display and fullscreens with F11. Under Tauri it becomes a real borderless
 * window positioned on the chosen monitor automatically.
 */
export function openOutputWindow(): Window | null {
  const url = `${window.location.origin}${window.location.pathname}#/output`
  const features = 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
  const win = window.open(url, 'bible-point-output', features)
  win?.focus()
  return win
}
