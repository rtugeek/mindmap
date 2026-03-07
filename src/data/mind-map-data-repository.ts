import type { EntityTable } from 'dexie'
import type { MindMapData } from './mindmap-data'
import consola from 'consola'
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
  async getAll(): Promise<MindMapData[]> {
    return await db.mindMaps.toArray()
  },

  async get(id: string): Promise<MindMapData | undefined> {
    return await db.mindMaps.get(id)
  },

  async getByUserId(userId: string): Promise<MindMapData[]> {
    return await db.mindMaps.where('user_id').equals(userId).toArray()
  },

  async save(data: Partial<MindMapData>): Promise<string> {
    const now = new Date()
    const id = data.id || crypto.randomUUID()

    const entity: MindMapData = {
      ...data,
      id,
      create_time: data.create_time || now,
      update_time: now,
    } as MindMapData

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

  listeners: [] as ((time: Date) => void)[],
  lastSyncTime: null as Date | null,
  isSyncing: false,

  subscribe(listener: (time: Date) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  },

  notify(time: Date) {
    this.lastSyncTime = time
    this.listeners.forEach(l => l(time))
  },

  async sync(syncType: 'all' | 'remote' | 'local' = 'all') {
    if (this.isSyncing) {
      return
    }
    this.isSyncing = true
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      // Update local data with missing or default user_id
      const anonymousData = await db.mindMaps
        .filter(item => !item.user_id || item.user_id === 'default_user')
        .toArray()

      if (anonymousData.length > 0) {
        consola.info('Found anonymous data, updating to user:', user.id, anonymousData)
        await db.mindMaps.bulkPut(
          anonymousData.map(item => ({
            ...item,
            user_id: user.id,
          })),
        )
      }

      const { data: remoteData, error } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        consola.error('Sync failed:', error)
        return
      }

      consola.info('Remote data loaded:', remoteData?.length)

      const localData = await this.getAll()
      consola.info('Local data loaded:', localData?.length)
      const localMap = new Map(localData.map(item => [item.id, item]))
      const remoteMap = new Map(remoteData.map(item => [item.id, item]))

      if (syncType === 'all' || syncType === 'remote') {
        await this.syncToRemote(user.id, localData, remoteMap)
      }

      if (syncType === 'all' || syncType === 'local') {
        await this.syncToLocal(remoteData, localMap)
      }

      this.notify(new Date())
    }
    finally {
      this.isSyncing = false
    }
  },

  async syncToRemote(userId: string, localData: MindMapData[], remoteMap: Map<string, any>) {
    // 1. Upload local changes
    for (const local of localData) {
      const remote = remoteMap.get(local.id!)
      let shouldUpload = false

      if (!remote) {
        shouldUpload = true
        consola.info('Local data not found in remote, uploading:', local.id)
      }
      else {
        const localTime = new Date(local.update_time).getTime()
        const remoteTime = new Date(remote.update_time).getTime()
        if (localTime > remoteTime) {
          shouldUpload = true
          consola.info('Local data newer than remote, uploading:', local.id)
        }
      }

      if (shouldUpload) {
        const payload: any = {
          ...local,
          user_id: userId,
          uuid: remote?.uuid || local.uuid,
        }

        if (!payload.uuid) {
          delete payload.uuid
        }

        const { data: uploaded } = await supabase
          .from('mind_maps')
          .upsert(payload, { onConflict: 'uuid' })
          .select()
          .single()

        if (uploaded) {
          consola.success('Uploaded successfully:', uploaded.uuid)
          const updates: any = { sync_time: new Date() }
          if (!local.uuid) {
            updates.uuid = uploaded.uuid
          }
          await db.mindMaps.update(local.id!, updates)
        }
      }
    }
  },

  async syncToLocal(remoteData: any[], localMap: Map<string, MindMapData>) {
    // 2. Download remote changes
    for (const remote of remoteData) {
      const local = localMap.get(remote.id)
      let shouldDownload = false

      if (!local) {
        shouldDownload = true
        consola.info('Remote data not found in local, downloading:', remote.id)
      }
      else {
        const localTime = new Date(local.update_time).getTime()
        const remoteTime = new Date(remote.update_time).getTime()
        if (remoteTime > localTime) {
          shouldDownload = true
          consola.info('Remote data newer than local, downloading:', remote.id)
        }
      }

      if (shouldDownload) {
        await db.mindMaps.put({
          ...remote,
          create_time: new Date(remote.create_time),
          update_time: new Date(remote.update_time),
          sync_time: new Date(),
        } as unknown as MindMapData)
        consola.success('Downloaded successfully:', remote.id)
      }
    }
  },
}
