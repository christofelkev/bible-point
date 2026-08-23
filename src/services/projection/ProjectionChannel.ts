import type { ProjectionState } from '../../types/projection'

/**
 * One-way link from the control window to the output window.
 *
 * The control window owns the state and pushes complete snapshots; the output
 * window only listens. Sending whole snapshots rather than diffs keeps the
 * output window stateless, so it renders correctly even if it opens late or is
 * closed and reopened mid-service.
 */
export interface ProjectionChannel {
  /** Push the current snapshot to every listening output window. */
  publish(state: ProjectionState): void

  /**
   * Listen for snapshots. Returns an unsubscribe function.
   * Called by the output window on mount.
   */
  subscribe(handler: (state: ProjectionState) => void): () => void

  /**
   * Ask the control window to republish. The output window calls this on mount
   * so it does not sit blank until the operator's next action.
   */
  requestSync(): void

  /** Register the responder for `requestSync`. Called by the control window. */
  onSyncRequest(handler: () => void): () => void

  /** Release the underlying transport. */
  close(): void
}
