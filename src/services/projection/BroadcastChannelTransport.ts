import type { ProjectionState } from '../../types/projection'
import type { ProjectionChannel } from './ProjectionChannel'

const CHANNEL_NAME = 'bible-point/projection'

type Envelope =
  | { type: 'state'; payload: ProjectionState }
  | { type: 'sync-request' }

/**
 * Browser-native implementation backed by BroadcastChannel.
 *
 * This is what makes the dual-screen behaviour real during frontend
 * development: the output window is a genuine second browser window opened with
 * `window.open`, not a simulated panel. Under Tauri the same interface is
 * satisfied by a transport built on Tauri events, and no caller changes.
 */
export class BroadcastChannelTransport implements ProjectionChannel {
  private channel = new BroadcastChannel(CHANNEL_NAME)
  private stateHandlers = new Set<(state: ProjectionState) => void>()
  private syncHandlers = new Set<() => void>()

  constructor() {
    this.channel.onmessage = (event: MessageEvent<Envelope>) => {
      const message = event.data
      if (message?.type === 'state') {
        this.stateHandlers.forEach((h) => h(message.payload))
      } else if (message?.type === 'sync-request') {
        this.syncHandlers.forEach((h) => h())
      }
    }
  }

  publish(state: ProjectionState): void {
    this.channel.postMessage({ type: 'state', payload: state } satisfies Envelope)
  }

  subscribe(handler: (state: ProjectionState) => void): () => void {
    this.stateHandlers.add(handler)
    return () => this.stateHandlers.delete(handler)
  }

  requestSync(): void {
    this.channel.postMessage({ type: 'sync-request' } satisfies Envelope)
  }

  onSyncRequest(handler: () => void): () => void {
    this.syncHandlers.add(handler)
    return () => this.syncHandlers.delete(handler)
  }

  close(): void {
    this.stateHandlers.clear()
    this.syncHandlers.clear()
    this.channel.close()
  }
}
