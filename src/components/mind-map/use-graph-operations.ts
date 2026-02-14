import type { Graph } from '@antv/x6'
import type { MindNode } from '@/data/MindNode'
import { useState } from 'react'
import { toast } from 'sonner'
import { findNodeInTree, findNodeWithParent, getMindNodeData } from './utils'

interface UseGraphOperationsProps {
  graphRef: React.RefObject<Graph | null>
  treeDataRef: React.RefObject<any>
  renderRef: React.RefObject<(() => void) | null>
  selectedNodeIdRef: React.RefObject<string | null>
  onNodeChange?: (data: MindNode, type: 'create' | 'delete' | 'update' | 'check' | 'collapse' | 'undo') => void
}

export function useGraphOperations({
  graphRef,
  treeDataRef,
  renderRef,
  selectedNodeIdRef,
  onNodeChange,
}: UseGraphOperationsProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null)
  const [deleteNodeName, setDeleteNodeName] = useState('')

  const openRenameDialog = (nodeId: string) => {
    const sourceNode = findNodeInTree(treeDataRef.current, nodeId)
    if (!sourceNode) { return }
    setRenameNodeId(nodeId)
    setRenameValue(sourceNode.data?.name ?? '')
    setRenameOpen(true)
  }

  const applyCreateChild = (parentId: string, nodeValue: string) => {
    const pId = parentId
    if (!pId) { return }
    const nextName = nodeValue ? nodeValue.trim() : '新节点'
    if (!nextName) { return }

    const sourceNode = findNodeInTree(treeDataRef.current, pId)
    if (!sourceNode) { return }

    const newId = Math.random().toString(36).slice(2)
    const newChildData = {
      id: newId,
      name: nextName,
      children: [],
    }
    const newChildNode = {
      id: newId,
      data: { ...newChildData },
      children: [],
      collapsed: false,
    }

    sourceNode.children = sourceNode.children || []
    sourceNode.children.push(newChildNode)

    sourceNode.data = sourceNode.data || {}
    sourceNode.data.children = sourceNode.data.children || []
    sourceNode.data.children.push(newChildData)

    sourceNode.collapsed = false
    renderRef.current?.()
    onNodeChange?.(getMindNodeData(treeDataRef.current), 'create')

    // 如果是通过快捷键创建的，需要选中新节点并进入编辑模式
    if (parentId && nodeValue) {
      setTimeout(() => {
        const graph = graphRef.current
        if (graph) {
          const cell = graph.getCellById(newId)
          if (cell && cell.isNode()) {
            graph.resetSelection(cell)
            // 触发编辑状态，需要 AlgoNode 组件配合监听
            cell.setData({
              ...cell.getData(),
              editing: true,
            })
          }
        }
      }, 100)
    }
  }

  const openCreateDialog = (parentId: string) => {
    applyCreateChild(parentId, '新节点')
  }

  const openDeleteDialog = (nodeId: string) => {
    if (treeDataRef.current?.id === nodeId) { return }
    const sourceNode = findNodeInTree(treeDataRef.current, nodeId)
    if (!sourceNode) { return }
    setDeleteNodeId(nodeId)
    setDeleteNodeName(sourceNode.data?.name ?? '')
    setDeleteOpen(true)
  }

  const applyRename = () => {
    if (!renameNodeId) { return }
    const nextName = renameValue.trim()
    if (!nextName) { return }
    const sourceNode = findNodeInTree(treeDataRef.current, renameNodeId)
    if (!sourceNode) { return }
    sourceNode.data = sourceNode.data || {}
    sourceNode.data.name = nextName
    setRenameOpen(false)
    setRenameNodeId(null)
    renderRef.current?.()
    onNodeChange?.(getMindNodeData(treeDataRef.current), 'update')
  }

  const applyDelete = () => {
    if (!deleteNodeId) { return }
    if (treeDataRef.current?.id === deleteNodeId) { return }
    const found = findNodeWithParent(treeDataRef.current, deleteNodeId)
    if (!found || !found.parent) { return }

    const { node: deletedNode, parent, index } = found
    const deletedNodeName = deletedNode.data?.name || ''

    // Remove from tree structure
    parent.children.splice(index, 1)

    // Remove from raw data structure
    if (parent.data?.children) {
      parent.data.children = parent.data.children.filter((c: any) => c?.id !== deleteNodeId)
    }

    if (selectedNodeIdRef.current === deleteNodeId) {
      selectedNodeIdRef.current = null
    }

    setDeleteOpen(false)
    setDeleteNodeId(null)
    renderRef.current?.()
    onNodeChange?.(getMindNodeData(treeDataRef.current), 'delete')

    toast(`已删除 ${deletedNodeName}`, {
      action: {
        label: '撤回',
        onClick: () => {
          // Restore to tree structure
          parent.children.splice(index, 0, deletedNode)

          // Restore to raw data structure
          if (parent.data) {
            parent.data.children = parent.data.children || []
            // Assuming index matches, we splice it back.
            // Note: If multiple deletes happen, index might be off if we don't handle it carefully,
            // but for single undo it's fine.
            parent.data.children.splice(index, 0, deletedNode.data)
          }

          renderRef.current?.()
          onNodeChange?.(getMindNodeData(treeDataRef.current), 'undo')
        },
      },
    })
  }

  const applyCreateSibling = (nodeId: string, nodeValue: string) => {
    const nextName = nodeValue.trim()
    if (!nextName) { return }

    const found = findNodeWithParent(treeDataRef.current, nodeId)
    if (!found || !found.parent) { return }

    const { parent, index } = found

    const newId = Math.random().toString(36).slice(2)
    const newChildData = {
      id: newId,
      name: nextName,
      children: [],
    }
    const newChildNode = {
      id: newId,
      data: { ...newChildData },
      children: [],
      collapsed: false,
    }

    parent.children = parent.children || []
    parent.children.splice(index + 1, 0, newChildNode)

    parent.data = parent.data || {}
    parent.data.children = parent.data.children || []
    parent.data.children.splice(index + 1, 0, newChildData)

    renderRef.current?.()
    onNodeChange?.(getMindNodeData(treeDataRef.current), 'create')

    setTimeout(() => {
      const graph = graphRef.current
      if (graph) {
        const cell = graph.getCellById(newId)
        if (cell && cell.isNode()) {
          graph.resetSelection(cell)
          cell.setData({
            ...cell.getData(),
            editing: true,
          })
        }
      }
    }, 100)
  }

  return {
    renameOpen,
    setRenameOpen,
    renameNodeId,
    setRenameNodeId,
    renameValue,
    setRenameValue,
    deleteOpen,
    setDeleteOpen,
    deleteNodeId,
    setDeleteNodeId,
    deleteNodeName,
    setDeleteNodeName,
    openRenameDialog,
    openCreateDialog,
    openDeleteDialog,
    applyRename,
    applyDelete,
    applyCreateChild,
    applyCreateSibling,
  }
}
