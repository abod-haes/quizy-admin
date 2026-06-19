import { useEffect, useMemo, useState } from 'react'

type ReorderableEntity = {
  id: number
  sort_order: number
}

type UseReorderableListOptions<T extends ReorderableEntity> = {
  rows: T[]
  pageOrderStart?: number
  onSave: (items: Array<{ id: number; sort_order: number }>) => Promise<void>
  onAfterSave?: () => Promise<void> | void
  onEnterOrderingMode?: () => void
}

export function useReorderableList<T extends ReorderableEntity>({
  rows,
  pageOrderStart = 1,
  onSave,
  onAfterSave,
  onEnterOrderingMode,
}: UseReorderableListOptions<T>) {
  const [isOrderingMode, setIsOrderingMode] = useState(false)
  const [isOrderingLoading, setIsOrderingLoading] = useState(false)
  const sourceRows = useMemo(() => [...rows].sort((a, b) => a.sort_order - b.sort_order), [rows])
  const [orderedRows, setOrderedRows] = useState<T[]>([])

  useEffect(() => {
    setOrderedRows(sourceRows)
  }, [sourceRows])

  const handleOrderingClick = async () => {
    if (isOrderingLoading) return

    if (!isOrderingMode) {
      setIsOrderingMode(true)
      onEnterOrderingMode?.()
      return
    }

    const updates = orderedRows
      .map((row, index) => ({ row, nextOrder: pageOrderStart + index }))
      .filter(({ row, nextOrder }) => row.sort_order !== nextOrder)
      .map(({ row, nextOrder }) => ({ id: row.id, sort_order: nextOrder }))

    if (updates.length) {
      try {
        setIsOrderingLoading(true)
        await onSave(updates)
        await onAfterSave?.()
      } finally {
        setIsOrderingLoading(false)
      }
    }

    setIsOrderingMode(false)
  }

  return {
    isOrderingMode,
    isOrderingLoading,
    sourceRows,
    orderedRows,
    setOrderedRows,
    displayedRows: isOrderingMode ? orderedRows : sourceRows,
    handleOrderingClick,
  }
}
