import type { MindNode } from '@widget-js/mindmap'
import type { BaseData } from './base/base-data'

export interface MindMapData extends BaseData {
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

  create_time: Date
  update_time: Date
}
