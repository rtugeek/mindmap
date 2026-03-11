import type { BaseData, BaseRemoteData } from '@/data/base/base-data'
import { delay, WidgetApi } from '@widget-js/core'
import consola from 'consola'

export interface SyncOptions {
  delay?: number
}

export abstract class BaseSync<T extends BaseData, R extends BaseRemoteData> {
  private name: string
  private isSync = false

  log(...message: any[]) {
    consola.info(`[${this.name} Sync] `, ...message)
  }

  private debouncedSync: (options?: SyncOptions) => Promise<void>

  private customDebounce(func: (...args: any[]) => Promise<void>, wait: number): (...args: any[]) => Promise<void> {
    let timeout: number | null = null
    return (...args: any[]): Promise<void> => {
      return new Promise((resolve) => {
        if (timeout) {
          clearTimeout(timeout)
        }
        timeout = setTimeout(async () => {
          await func(...args)
          resolve()
        }, wait)
      })
    }
  }

  constructor(name: string) {
    this.name = name
    this.debouncedSync = this.customDebounce(this.syncInternal.bind(this), 1000)
  }

  async sync(options?: SyncOptions) {
    return this.debouncedSync(options)
  }

  private async syncInternal(options?: SyncOptions): Promise<void> {
    if (this.isSync) {
      return
    }
    this.isSync = true
    try {
      if (!(await this.isLogin())) {
        return
      }
      if (options?.delay) {
        await delay(options.delay)
      }
      const localItems = await this.getLocalItems()
      this.log('localItems')
      const needSyncItems = localItems.filter((it) => {
        return it.need_sync == undefined || it.need_sync
      })
      this.log('needSyncItems', needSyncItems)

      const needUploadItems: T[] = []
      const needDownloadItems: R[] = []

      const remoteItems = await this.getRemoteItems()
      for (const remoteItem of remoteItems) {
        // 将remoteItems中有，但本地没有的item保存到本地
        const localItem = localItems.find(item => item.id === remoteItem.id)
        if (!localItem) {
          needDownloadItems.push(remoteItem)
        }
        else if (remoteItem.update_time) {
          const isNewer = new Date(remoteItem.update_time) > (localItem.update_time || new Date(0))
          if (isNewer) {
            // 如果本地存在，则比较updateTime，如果比本地新，则覆盖本地
            needDownloadItems.push(remoteItem)
          }
        }
      }
      for (const t of this.mapRemoteToLocal(needDownloadItems)) {
        await this.saveItem(t)
      }

      for (const needSyncItem of needSyncItems) {
        // 将localItems中有，但远程没有的item上传到远程
        const remoteItem = remoteItems.find(item => item.id === needSyncItem.id)
        if (!remoteItem) {
          needUploadItems.push(needSyncItem)
        }
        else if (needSyncItem.update_time) {
          const isNewer = needSyncItem.update_time > new Date(remoteItem.update_time)
          if (isNewer) {
            // 如果远程存在，则比较updateTime，如果比远程新，则覆盖远程
            needUploadItems.push(needSyncItem)
          }
        }
        else {
          needUploadItems.push(needSyncItem)
        }
      }

      const pushedRemoteItems = await this.pushToRemote(this.mapLocalToRemote(needUploadItems))
      for (const remoteItem of pushedRemoteItems) {
        const find = localItems.find(it => it.id == remoteItem.id)
        if (find) {
          find.need_sync = false
          if (!find.uuid) {
            find.uuid = remoteItem.uuid
            this.log('update uuid', find.id, find.uuid)
          }
          await this.saveItem(find)
        }
      }
      for (const needUploadItem of needUploadItems) {
        await this.saveItem(needUploadItem, false)
      }
      WidgetApi.updateSyncInfo().catch()
    }
    catch (e) {
      consola.error(e)
    }
    finally {
      this.isSync = false
    }
  }

  abstract saveItem(item: T, updateNeedSync?: boolean): Promise<T>

  abstract pushToRemote(remoteItems: R[]): Promise<R[]>

  abstract getLocalItems(): Promise<T[]>

  abstract getRemoteItems(): Promise<R[]>

  abstract mapRemoteToLocal(item: R[]): T[]

  abstract mapLocalToRemote(item: T[]): R[]

  abstract isLogin(): Promise<boolean>
}
