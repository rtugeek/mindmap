import type { MindNode } from '@widget-js/mindmap'
import type { MindMapData } from './data/mindmap-data'
import { WindowControls } from '@widget-js/react'
import { Plus, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { AppSidebar } from './components/app-sidebar'
import { CreateMindMapDialog } from './components/dialogs/create-mind-map-dialog'
import { MindMapContainer } from './components/mind-map-container'
import TextType from './components/TextType'
import { Button } from './components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './components/ui/empty'
import { Separator } from './components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { Toaster } from './components/ui/sonner'
import { mindMapDataRepository } from './data/mind-map-data-repository'
import { useUser } from './hooks/use-user'
import { useMindMapStore } from './store/mind-map-store'
import '@widget-js/react/style.css'
import '@widget-js/mindmap/style.css'
import './App.css'

function App() {
  const sync = useMindMapStore(state => state.sync)

  useEffect(() => {
    sync()
  }, [])

  const { userId } = useUser()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'
  const [currentMindMap, setCurrentMindMap] = useState<MindMapData | null>(null)
  const [mindMapGroups, setMindMapGroups] = useState<Record<string, MindMapData[]>>({})

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const loadMindMapList = async () => {
    try {
      const list = await mindMapDataRepository.getAll()
      // Group by 'group' field
      const groups: Record<string, MindMapData[]> = {}
      list.forEach((item) => {
        const groupName = item.group || '默认分组'
        if (!groups[groupName]) {
          groups[groupName] = []
        }
        groups[groupName].push(item)
      })
      setMindMapGroups(groups)
    }
    catch (error) {
      console.error('Failed to load mind map list:', error)
    }
  }

  useEffect(() => {
    loadMindMapList()
  }, [])

  const handleNodeChange = async (_data: MindNode) => {
    // 逻辑已移动到 MindMapContainer
  }

  const handleCreateMindMap = async (topic: string, emoji: string, group: string, initialData?: MindNode) => {
    const newMindMapData: Partial<MindMapData> = {
      topic,
      group: group || '默认分组',
      user_id: userId || 'default_user',
      emoji: emoji || '📝',
      mindmap: initialData || {
        id: 'root',
        name: topic,
        children: [],
      },
    }

    try {
      const id = await mindMapDataRepository.save(newMindMapData)
      const savedData = await mindMapDataRepository.get(id)
      if (savedData) {
        setCurrentMindMap(savedData)
        await loadMindMapList()
      }
      sync()
      return id
    }
    catch (error) {
      console.error('Failed to save mind map:', error)
      return undefined
    }
  }

  const handleUpdateMindMap = async (id: string, mindmap: MindNode) => {
    const existing = await mindMapDataRepository.get(id)
    if (existing) {
      const updated = { ...existing, mindmap, update_time: new Date() }
      await mindMapDataRepository.save(updated)
      sync()
      if (currentMindMap && currentMindMap.id === id) {
        setCurrentMindMap(updated)
      }
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar
        onMindMapCreated={setCurrentMindMap}
        groups={mindMapGroups}
        onRefresh={loadMindMapList}
      />
      <SidebarInset className="h-screen overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between [-webkit-app-region:drag] [app-region:drag]">
            <h1 className="text-lg font-semibold flex-1">&nbsp;</h1>
            <div className="flex items-center gap-2">
              <WindowControls />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
          {currentMindMap
            ? (
                <MindMapContainer
                  currentMindMap={currentMindMap}
                  isDarkMode={isDarkMode}
                  onNodeChange={handleNodeChange}
                />
              )
            : (
                <Empty className="h-full border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="mb-4">
                      <Sparkles className="size-6 text-primary" />
                    </EmptyMedia>
                    <EmptyTitle className="text-2xl font-bold">欢迎使用思维导图</EmptyTitle>
                    <EmptyDescription className="text-base mt-2 mb-6 max-w-md h-[24px]">
                      <TextType
                        text={[
                          '整理知识碎片',
                          '梳理复杂思绪',
                          '构建知识体系',
                          '拆解复杂任务',
                          '构思内容大纲',
                        ]}
                      />
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <CreateMindMapDialog
                      onConfirm={handleCreateMindMap}
                      onUpdate={handleUpdateMindMap}
                      onAIStreamFinished={handleUpdateMindMap}
                      trigger={(
                        <Button className="mt-4">
                          <Plus className="mr-2 size-4" />
                          创建思维导图
                        </Button>
                      )}
                    />
                  </EmptyContent>
                </Empty>
              )}
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
