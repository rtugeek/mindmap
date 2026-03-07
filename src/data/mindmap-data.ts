import type { MindNode } from '@widget-js/mindmap'

export interface MindMapData {
  /**
   * 本地id
   */
  id?: string
  /**
   * 服务器id
   */
  uuid?: string
  emoji: string
  /**
   * 默认分组，用于分类管理，如果为空 则使用topic
   */
  group: string
  topic: string
  mindmap: MindNode
  user_id: string
  create_time: Date
  update_time: Date
  /**
   * 上次同步时间
   */
  sync_time?: Date
}
