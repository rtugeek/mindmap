import type { MindNode } from '@widget-js/mindmap'
import type { MindMapData } from '@/data/mindmap-data'
import { create } from 'zustand'
import { mindMapDataRepository } from '@/data/mind-map-data-repository'
import { MindMapDataSync } from '@/data/sync/mind-map-data-sync'

interface MindMapState {
  mindMaps: MindMapData[]
  groups: Record<string, MindMapData[]>
  isLoading: boolean
  error: string | null
  lastSyncTime: Date | null

  // Actions
  loadMindMaps: () => Promise<void>
  createMindMap: (topic: string, emoji: string, group: string, initialData?: MindNode, userId?: string) => Promise<MindMapData | undefined>
  updateMindMap: (id: string, mindmap: MindNode) => Promise<void>
  renameMindMap: (id: string, newTopic: string, newEmoji: string, newGroup: string) => Promise<void>
  deleteMindMap: (id: string) => Promise<void>
  sync: () => Promise<void>
}

function groupMindMaps(mindMaps: MindMapData[]) {
  const groups: Record<string, MindMapData[]> = {}
  mindMaps.forEach((item) => {
    const groupName = item.group || '默认分组'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(item)
  })
  return groups
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  mindMaps: [],
  groups: {},
  isLoading: false,
  error: null,
  lastSyncTime: null,

  loadMindMaps: async () => {
    set({ isLoading: true, error: null })
    try {
      const list = await mindMapDataRepository.getAll()
      set({ mindMaps: list, groups: groupMindMaps(list), isLoading: false })
    }
    catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createMindMap: async (topic, emoji, group, initialData, userId) => {
    try {
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
      const id = await mindMapDataRepository.save(newMindMapData)
      await get().loadMindMaps()
      get().sync()
      return get().mindMaps.find(m => m.id === id)
    }
    catch (error: any) {
      set({ error: error.message })
      return undefined
    }
  },

  updateMindMap: async (id, mindmap) => {
    try {
      const existing = await mindMapDataRepository.get(id)
      if (existing) {
        const updated = { ...existing, mindmap, update_time: new Date() }
        await mindMapDataRepository.save(updated)
        await get().loadMindMaps()
        get().sync()
      }
    }
    catch (error: any) {
      console.error('Failed to update mind map:', error)
    }
  },

  renameMindMap: async (id, newTopic, newEmoji, newGroup) => {
    try {
      const existing = await mindMapDataRepository.get(id)
      if (existing) {
        const updated = {
          ...existing,
          topic: newTopic,
          emoji: newEmoji,
          group: newGroup,
          mindmap: {
            ...existing.mindmap,
            name: newTopic,
          },
        }
        await mindMapDataRepository.save(updated)
        await get().loadMindMaps()
        get().sync()
      }
    }
    catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteMindMap: async (id) => {
    try {
      await mindMapDataRepository.delete(id)
      await get().loadMindMaps()
      get().sync()
    }
    catch (error: any) {
      set({ error: error.message })
    }
  },

  sync: async () => {
    try {
      await MindMapDataSync.sync()
      set({ lastSyncTime: new Date() })
      await get().loadMindMaps()
    }
    catch (error: any) {
      console.error('Sync failed:', error)
    }
  },
}))
