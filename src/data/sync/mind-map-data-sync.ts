import type { MindNode } from '@widget-js/mindmap'
import type { BaseRemoteData } from '../base/base-data'
import type { MindMapData } from '../mindmap-data'
import consola from 'consola'
import { supabase } from '../../api/supabase'
import { mindMapDataRepository } from '../mind-map-data-repository'
import { BaseSync } from './base-sync'

export interface MindMapRemoteData extends BaseRemoteData {
  emoji: string
  group: string
  topic: string
  mindmap: MindNode
  user_id: string
}

class MindMapDataSyncImpl extends BaseSync<MindMapData, MindMapRemoteData> {
  constructor() {
    super('MindMapData')
  }

  async saveItem(item: MindMapData, updateNeedSync?: boolean): Promise<MindMapData> {
    await mindMapDataRepository.save(item, updateNeedSync)
    return item
  }

  async pushToRemote(remoteItems: MindMapRemoteData[]): Promise<MindMapRemoteData[]> {
    const { data, error } = await supabase
      .from('mind_maps')
      .upsert(remoteItems, { onConflict: 'uuid' })
      .select()

    if (error) {
      consola.error('Push to remote failed:', error)
      throw error
    }
    // Ensure id matches uuid for consistency with BaseSync logic
    return (data as any[]).map(item => ({
      ...item,
      id: item.uuid,
    })) as MindMapRemoteData[]
  }

  async getLocalItems(): Promise<MindMapData[]> {
    return await mindMapDataRepository.getAll()
  }

  async getRemoteItems(): Promise<MindMapRemoteData[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { return [] }

    const { data, error } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      consola.error('Get remote items failed:', error)
      throw error
    }

    // Map remote data to MindMapRemoteData and ensure id matches uuid
    return (data as any[]).map(item => ({
      ...item,
      id: item.uuid, // Use uuid as id for BaseSync matching
    })) as MindMapRemoteData[]
  }

  mapRemoteToLocal(items: MindMapRemoteData[]): MindMapData[] {
    return items.map((item) => {
      const createTime = new Date(item.create_time)
      const updateTime = new Date(item.update_time)
      return {
        ...item,
        id: item.uuid, // Ensure local ID is the UUID
        uuid: item.uuid,
        create_time: createTime,
        update_time: updateTime,
        need_sync: false,
      } as MindMapData
    })
  }

  mapLocalToRemote(items: MindMapData[]): MindMapRemoteData[] {
    return items.map((item) => {
      delete item.need_sync // Remove local-only field
      delete item.user_id // Remove user_id field
      return {
        ...item,
        uuid: item.uuid || item.id, // Ensure uuid is set
        create_time: item.create_time ? item.create_time.toISOString() : new Date().toISOString(),
        update_time: item.update_time ? item.update_time.toISOString() : new Date().toISOString(),
      } as unknown as MindMapRemoteData
    })
  }

  async isLogin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  }
}

export const MindMapDataSync = new MindMapDataSyncImpl()
