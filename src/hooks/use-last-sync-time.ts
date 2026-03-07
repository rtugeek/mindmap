import { useEffect, useState } from 'react'
import { mindMapDataRepository } from '@/data/mind-map-data-repository'

export function useLastSyncTime() {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(mindMapDataRepository.lastSyncTime)

  useEffect(() => {
    // Set initial value
    setLastSyncTime(mindMapDataRepository.lastSyncTime)

    // Subscribe to changes
    const unsubscribe = mindMapDataRepository.subscribe((time) => {
      setLastSyncTime(time)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return lastSyncTime
}
