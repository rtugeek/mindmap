import type { EntityTable } from 'dexie'
import type { MindMapData } from './mindmap-data'
import Dexie from 'dexie'
import { supabase } from '../api/supabase'

class MindMapDatabase extends Dexie {
  mindMaps!: EntityTable<MindMapData, 'id'>

  constructor() {
    super('MindMapDatabase')
    this.version(1).stores({
      mindMaps: 'id, group, topic, user_id, create_time, update_time',
    })
  }
}

const db = new MindMapDatabase()

export const mindMapDataRepository = {
  async getAll(includeRemoved?: boolean): Promise<MindMapData[]> {
    let collection = db.mindMaps.orderBy('update_time').reverse()
    if (!includeRemoved) {
      collection = collection.filter(item => !item.delete_time)
    }
    return await collection.toArray()
  },

  async get(id: string): Promise<MindMapData | undefined> {
    return await db.mindMaps.get(id)
  },

  async getByUserId(userId: string): Promise<MindMapData[]> {
    return await db.mindMaps.where('user_id').equals(userId).toArray()
  },

  async save(data: Partial<MindMapData>, needSync: boolean = true): Promise<string> {
    const now = new Date()
    const id = data.id || crypto.randomUUID()

    const entity: MindMapData = {
      ...data,
      id,
      create_time: data.create_time || now,
      update_time: now,
    } as MindMapData
    entity.need_sync = needSync
    await db.mindMaps.put(entity)
    return id
  },

  async delete(id: string): Promise<void> {
    const data = await db.mindMaps.get(id)
    if (data?.uuid) {
      await supabase.from('mind_maps').delete().eq('uuid', data.uuid)
    }
    await db.mindMaps.delete(id)
  },

  async softRemove(id: string) {
    const event = await this.get(id)
    if (event) {
      event.need_sync = true
      event.delete_time = new Date()
      await this.save(event)
    }
  },
}
