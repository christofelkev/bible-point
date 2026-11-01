import { useState, useCallback, useRef } from 'react'
import clsx from 'clsx'

interface Props {
  /** 'col' for vertical divider (horizontal resize), 'row' for horizontal divider (vertical resize) */
  direction: 'col' | 'row'
  /** Incremental pixel delta on each move */
  onDrag: (delta: number) => void
  /** Called when drag ends, useful for saving state or committing debounces */
  onDragEnd?: () => void
  /** Called when user double clicks the divider, e.g. to reset to default */
  onDoubleClick?: () => void
  className?: string
  title?: string
}

export function ResizeHandle({
  direction,
  onDrag,
  onDragEnd,
  onDoubleClick,
  className,
  title = 'Tarik untuk mengubah ukuran (klik ganda untuk reset)',
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const lastPosRef = useRef(0)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only respond to main button (left click)
      if (e.button !== 0) return

      e.preventDefault()
      setIsDragging(true)

      const isCol = direction === 'col'
      lastPosRef.current = isCol ? e.clientX : e.clientY

      const prevCursor = document.body.style.cursor
      const prevUserSelect = document.body.style.userSelect
      document.body.style.cursor = isCol ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      const handlePointerMove = (ev: PointerEvent) => {
        const currentPos = isCol ? ev.clientX : ev.clientY
        const delta = currentPos - lastPosRef.current
        if (delta !== 0) {
          lastPosRef.current = currentPos
          onDrag(delta)
        }
      }

      const handlePointerUp = () => {
        setIsDragging(false)
        document.body.style.cursor = prevCursor
        document.body.style.userSelect = prevUserSelect
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        onDragEnd?.()
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [direction, onDrag, onDragEnd],
  )

  const isCol = direction === 'col'

  return (
    <div
      onPointerDown={handlePointerDown}
      onDoubleClick={onDoubleClick}
      title={title}
      className={clsx(
        'group relative shrink-0 select-none transition-colors z-20',
        isCol
          ? 'w-1.5 cursor-col-resize -mx-0.5 flex justify-center'
          : 'h-1.5 cursor-row-resize -my-0.5 flex items-center',
        className,
      )}
    >
      {/* Expanded invisible hit area for effortless targeting */}
      <div
        className={clsx(
          'absolute z-10',
          isCol ? 'inset-y-0 -left-1 -right-1 cursor-col-resize' : 'inset-x-0 -top-1 -bottom-1 cursor-row-resize',
        )}
      />

      {/* Visual divider line */}
      <div
        className={clsx(
          'transition-all duration-150',
          isCol ? 'w-px h-full' : 'h-px w-full',
          isDragging
            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            : 'bg-ink-800 group-hover:bg-amber-400/80 group-hover:shadow-[0_0_4px_rgba(251,191,36,0.4)]',
        )}
      />
    </div>
  )
}
