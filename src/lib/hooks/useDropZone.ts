import { useState, useCallback } from 'react'

interface UseDropZoneProps {
  onDrop: (files: File[]) => void
}

export function useDropZone({ onDrop }: UseDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      const files = Array.from(e.dataTransfer.files || [])
      onDrop(files)
    },
    [onDrop]
  )

  return {
    isDragActive,
    getRootProps: () => ({
      onDragEnter: handleDrag,
      onDragLeave: handleDrag,
      onDragOver: handleDrag,
      onDrop: handleDrop,
    }),
  }
}
