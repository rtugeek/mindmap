import { useEffect } from 'react'
import { mindMapDataRepository } from '@/data/mind-map-data-repository'

export function useAutoSync(interval = 5000) {
  useEffect(() => {
    // Initial sync - fetch everything
    mindMapDataRepository.sync('all')

    const timer = setInterval(() => {
      // Periodic sync - only upload changes
      mindMapDataRepository.sync('remote')
    }, interval)

    return () => clearInterval(timer)
  }, [interval])
}
