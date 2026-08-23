import type { ProjectionState } from '../../types/projection'
import type { ProjectionChannel } from './ProjectionChannel'

const STATE_EVENT = 'bible-point://state'
const SYNC_EVENT = 'bible-point://sync-request'

/**
 * Desktop transport built on Tauri's event bus.
 *
 * The Tauri event API is async — `listen` resolves to an unlisten function —
 * while `ProjectionChannel` is deliberately synchronous so components can
 * subscribe during render without effect juggling. The gap is bridged by
 * keeping handlers in a local Set and attaching the underlying listener once,
 * lazily. Handlers registered before the listener resolves still receive every
 * event, because the Set is what the resolved listener dispatches into.
 */
export class TauriEventTransport implements ProjectionChannel {
  private stateHandlers = new Set<(state: ProjectionState) => void>()
  private syncHandlers = new Set<() => void>()
  private stateListener: Promise<() => void> | null = null
  private syncListener: Promise<() => void> | null = null

  publish(state: ProjectionState): void {
    void this.emit(STATE_EVENT, state)
  }

  subscribe(handler: (state: ProjectionState) => void): () => void {
    this.stateHandlers.add(handler)
    this.ensureStateListener()
    return () => this.stateHandlers.delete(handler)
  }

  requestSync(): void {
    void this.emit(SYNC_EVENT, null)
  }

  onSyncRequest(handler: () => void): () => void {
    this.syncHandlers.add(handler)
    this.ensureSyncListener()
    return () => this.syncHandlers.delete(handler)
  }

  close(): void {
    this.stateHandlers.clear()
    this.syncHandlers.clear()
    void this.stateListener?.then((un) => un())
    void this.syncListener?.then((un) => un())
    this.stateListener = null
    this.syncListener = null
  }

  private async emit(event: string, payload: unknown): Promise<void> {
    const { emit } = await import('@tauri-apps/api/event')
    await emit(event, payload)
  }

  private ensureStateListener(): void {
    if (this.stateListener) return
    this.stateListener = import('@tauri-apps/api/event').then(({ listen }) =>
      listen<ProjectionState>(STATE_EVENT, (event) => {
        this.stateHandlers.forEach((h) => h(event.payload))
      }),
    )
  }

  private ensureSyncListener(): void {
    if (this.syncListener) return
    this.syncListener = import('@tauri-apps/api/event').then(({ listen }) =>
      listen(SYNC_EVENT, () => {
        this.syncHandlers.forEach((h) => h())
      }),
    )
  }
}
