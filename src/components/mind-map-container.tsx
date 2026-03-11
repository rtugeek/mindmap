import type { MindMapRef, MindNode } from '@widget-js/mindmap'
import type { MindMapData } from '../data/mindmap-data'
import { useLocalStorage } from '@uidotdev/usehooks'
import { MindMap } from '@widget-js/mindmap'
import { useRef } from 'react'
import { useMindMapStore } from '../store/mind-map-store'

const defaultMindMapData: MindNode = {
  id: '思维导图',
  name: 'mindMap',
  url: 'https://vuejs.org/',
  children: [
  ],
}

interface MindMapContainerProps {
  currentMindMap: MindMapData | null
  isDarkMode: boolean
  onNodeChange: (data: MindNode) => void
}

export function MindMapContainer({ currentMindMap, isDarkMode, onNodeChange }: MindMapContainerProps) {
  const graphRef = useRef<MindMapRef>(null)
  const { updateMindMap } = useMindMapStore()
  const [showCheckboxes, setShowCheckboxes] = useLocalStorage('mindmap_show_checkboxes', true)
  const [showGrid, setShowGrid] = useLocalStorage('mindmap_show_grid', true)

  const title = currentMindMap ? currentMindMap.topic : 'Vue3'
  const data = currentMindMap ? currentMindMap.mindmap : defaultMindMapData

  const handleNodeChange = (data: MindNode) => {
    if (currentMindMap?.id) {
      updateMindMap(currentMindMap.id, data)
    }
    onNodeChange(data)
  }

  return (
    <div className="graph-container flex-1 w-full rounded-xl border bg-card text-card-foreground shadow overflow-hidden relative">
      <MindMap
        ref={graphRef}
        title={title}
        data={data}
        showCheckboxes={showCheckboxes}
        showGrid={showGrid}
        isDarkMode={isDarkMode}
        onNodeChange={handleNodeChange}
        onConfigChange={(key, value) => {
          if (key === 'showCheckboxes') {
            setShowCheckboxes(value)
          }
          if (key === 'showGrid') {
            setShowGrid(value)
          }
        }}
      />
    </div>
  )
}
