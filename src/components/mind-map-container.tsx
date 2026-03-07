import type { MindMapRef, MindNode } from '@widget-js/mindmap'
import type { MindMapData } from '../data/mindmap-data'
import { MindMap } from '@widget-js/mindmap'
import { useRef } from 'react'

const defaultMindMapData: MindNode = {
  id: 'vue3',
  name: 'vue3',
  url: 'https://vuejs.org/',
  children: [
    {
      name: '生命周期',
      id: 'vue3_lifecycle',
      checked: true,
      children: [
        { name: 'beforeCreate', id: 'vue3_lifecycle_beforeCreate' },
        { name: 'created', id: 'vue3_lifecycle_created' },
        { name: 'beforeMount', id: 'vue3_lifecycle_beforeMount' },
        { name: 'mounted', id: 'vue3_lifecycle_mounted' },
        { name: 'beforeUpdate', id: 'vue3_lifecycle_beforeUpdate' },
        { name: 'updated', id: 'vue3_lifecycle_updated' },
        { name: 'beforeUnmount', id: 'vue3_lifecycle_beforeUnmount' },
        { name: 'unmounted', id: 'vue3_lifecycle_unmounted' },
      ],
    },
    { name: '组件', id: 'vue3_component' },
    { name: '响应式', id: 'vue3_reactive' },
    { name: '模板', id: 'vue3_template' },
    { name: '指令', id: 'vue3_directive' },
    { name: '事件', id: 'vue3_event' },
    { name: '计算属性', id: 'vue3_computed' },
  ],
}

interface MindMapContainerProps {
  currentMindMap: MindMapData | null
  isDarkMode: boolean
  onNodeChange: (data: MindNode) => void
}

export function MindMapContainer({ currentMindMap, isDarkMode, onNodeChange }: MindMapContainerProps) {
  const graphRef = useRef<MindMapRef>(null)

  const title = currentMindMap ? currentMindMap.topic : 'Vue3'
  const data = currentMindMap ? currentMindMap.mindmap : defaultMindMapData

  return (
    <div className="graph-container flex-1 w-full rounded-xl border bg-card text-card-foreground shadow overflow-hidden relative">
      <MindMap
        ref={graphRef}
        title={title}
        data={data}
        isDarkMode={isDarkMode}
        onNodeChange={onNodeChange}
      />
    </div>
  )
}
