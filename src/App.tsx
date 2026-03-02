import type { MindMapRef, MindNode } from '@widget-js/mindmap'
import { MindMap } from '@widget-js/mindmap'
import { useEffect, useRef, useState } from 'react'
import { Toaster } from './components/ui/sonner'
import '@widget-js/mindmap/style.css'
import './App.css'

const skillJson: MindNode = {
  id: 'vue3',
  name: 'vue3',
  url: 'https://vuejs.org/',
  children: [
    {
      name: '生命周期',
      id: 'vue3_lifecycle',
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

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const graphRef = useRef<MindMapRef>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>MindMap Demo</h1>
        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>
      </div>
      <div className="graph-container" style={{ height: '300px' }}>
        <MindMap ref={graphRef} title="Vue3" data={skillJson} isDarkMode={isDarkMode} />
      </div>
      <Toaster />
    </div>
  )
}

export default App
