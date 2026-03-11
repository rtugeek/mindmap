import type { MindNode } from '@widget-js/mindmap'
import { nanoid } from 'nanoid'
import { parse } from 'yaml'

/**
 * 将 YAML 文本转换为 MindNode 结构
 * 支持两种格式：
 * 1. 显式格式（推荐）：直接对应 MindNode 结构，包含 name, children 等字段
 * 2. 隐式格式（层级）：键值对结构，key 为节点内容，value 为子节点列表
 */
export function parseYamlToMindMap(yaml: string) {
  try {
    const parsed = parse(yaml)
    if (!parsed) { return null }

    const nodes = transformToNodes(parsed)

    if (nodes.length === 0) { return null }

    let rootNode: MindNode
    if (nodes.length === 1) {
      rootNode = nodes[0]
    }
    else {
      // 多个根节点时，创建一个虚拟根节点
      rootNode = {
        id: nanoid(),
        name: 'Mind Map',
        children: nodes,
      }
    }

    return {
      topic: rootNode.name,
      mindmap: rootNode,
    }
  }
  catch (e) {
    console.error('Failed to parse YAML:', e)
    return null
  }
}

function transformToNodes(obj: any): MindNode[] {
  if (obj === null || obj === undefined) {
    return []
  }

  // 1. 字符串或数字 -> 单个节点
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return [{
      id: nanoid(),
      name: String(obj),
      children: [],
    }]
  }

  // 2. 数组 -> 递归处理每个元素并扁平化
  if (Array.isArray(obj)) {
    return obj.flatMap(item => transformToNodes(item))
  }

  // 3. 对象 -> 判断是显式 MindNode 还是隐式键值对
  if (typeof obj === 'object') {
    // 显式格式：包含 name 字段
    // 这里简化判断：只要有 name/topic 且是字符串，就认为是显式节点
    const name = obj.name || obj.topic
    if (name && typeof name === 'string') {
      const node: MindNode = {
        id: obj.id || nanoid(),
        name,
        // 复制其他可能的 MindNode 字段
        url: obj.url,
        checked: obj.checked,
        collapsed: obj.collapsed,
        children: obj.children ? transformToNodes(obj.children) : [],
      }
      return [node]
    }

    // 隐式格式：遍历所有 key
    // { "Root": ["Child1", "Child2"] } -> Root node with children
    return Object.entries(obj).map(([key, value]) => {
      // Skip top-level metadata keys if they are not children
      if (key === 'emoji' || key === 'topic' || key === 'name') {
        return null
      }
      return {
        id: nanoid(),
        name: key,
        children: transformToNodes(value),
      }
    }).filter((n): n is MindNode => n !== null)
  }

  return []
}
