import type { Cell, Edge, Node } from '@antv/x6'
import type { NodeStatus } from './AlgoNode'
import type { MindNode } from '@/data/MindNode'
import Hierarchy from '@antv/hierarchy'

import { Export, Graph, Path, Selection } from '@antv/x6'
import { Lock } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Kbd } from '@/components/ui/kbd'
import { DeleteNodeDialog } from './DeleteNodeDialog'
import { ThemeStyles } from './flow-constants'
import { FlowGraphToolbar } from './FlowGraphToolbar'
import { RenameNodeDialog } from './RenameNodeDialog'
import './AlgoNode' // Import for side effects (registering shape and inserting css)

Graph.registerEdge(
  'dag-edge',
  {
    inherit: 'edge',
    attrs: {
      line: {
        stroke: '#C2C8D5',
        strokeWidth: 1,
        targetMarker: null,
      },
    },
  },
  true,
)

interface FlowGraphProps {
  data: MindNode
  isDarkMode?: boolean
  title?: string
  showCheckboxes?: boolean
  showGrid?: boolean
  readonly?: boolean
  onNodeChange?: (data: MindNode, type: 'create' | 'delete' | 'update' | 'check' | 'collapse' | 'undo') => void
}

export interface FlowGraphRef {
  exportGraph: () => void
}

// 注册一个自定义的连接线连接器，实现贝塞尔曲线效果
Graph.registerConnector(
  'algo-connector',
  (s, e) => {
    const offset = 4
    const deltaX = Math.abs(e.x - s.x)
    const control = Math.floor((deltaX / 3) * 2)

    const v1 = { x: s.x + offset + control, y: s.y }
    const v2 = { x: e.x - offset - control, y: e.y }

    return Path.parse(
      `
      M ${s.x} ${s.y}
      L ${s.x + offset} ${s.y}
      C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${e.x - offset} ${e.y}
      L ${e.x} ${e.y}
    `,
    ).serialize()
  },
  true,
)

export const FlowGraph = forwardRef<FlowGraphRef, FlowGraphProps>(({ data, isDarkMode = false, title = '思维导图', readonly = false, onNodeChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<Graph>(null)
  const treeDataRef = useRef<any>(null)
  const renderRef = useRef<null | (() => void)>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  const themeRef = useRef<'light' | 'dark'>(isDarkMode ? 'dark' : 'light')
  const [showCheckboxes, setShowCheckboxes] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null)
  const [deleteNodeName, setDeleteNodeName] = useState('')

  const getMindNodeData = (node: any): MindNode => {
    const { children, ...restData } = node.data || {}
    return {
      ...restData,
      id: node.id,
      checked: node.checked ?? restData.checked,
      collapsed: node.collapsed,
      children: node.children?.map(getMindNodeData) || [],
    }
  }

  const findNodeInTree = (root: any, id: string): any => {
    if (!root) { return null }
    if (root.id === id) { return root }
    if (root.children) {
      for (const child of root.children) {
        const found = findNodeInTree(child, id)
        if (found) { return found }
      }
    }
    return null
  }

  const findNodeWithParent = (
    root: any,
    id: string,
    parent: any = null,
  ): { node: any, parent: any, index: number } | null => {
    if (!root) { return null }
    if (root.id === id) {
      return { node: root, parent, index: -1 }
    }
    if (root.children) {
      for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i]
        if (child.id === id) {
          return { node: child, parent: root, index: i }
        }
        const found = findNodeWithParent(child, id, root)
        if (found) { return found }
      }
    }
    return null
  }

  const openRenameDialog = (nodeId: string) => {
    const sourceNode = findNodeInTree(treeDataRef.current, nodeId)
    if (!sourceNode) { return }
    setRenameNodeId(nodeId)
    setRenameValue(sourceNode.data?.name ?? '')
    setRenameOpen(true)
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
    onNodeChange?.(getMindNodeData(treeDataRef.current))
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

  const exportGraph = () => {
    const graph = graphRef.current
    if (graph) {
      graph.exportPNG('flow-chart', {
        padding: 20,
        backgroundColor: 'transparent',
        quality: 1,
      })
    }
  }

  useImperativeHandle(ref, () => ({
    exportGraph,
  }))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (renameOpen) { return }

      const target = e.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
      }

      const selectedNodeId = selectedNodeIdRef.current
      if (!selectedNodeId) { return }

      if (readonly) { return }

      if (e.key === 'Enter') {
        e.preventDefault()
        applyCreateSibling(selectedNodeId, '新节点')
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        applyCreateChild(selectedNodeId, '新节点')
      }

      if (e.key === 'Delete') {
        e.preventDefault()
        openDeleteDialog(selectedNodeId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [renameOpen, readonly])

  // Update theme ref and graph styles when isDarkMode changes
  useEffect(() => {
    themeRef.current = isDarkMode ? 'dark' : 'light'
    const theme = ThemeStyles[themeRef.current]
    const graph = graphRef.current

    if (graph) {
      graph.drawBackground({ color: theme.bgColor })
      graph.drawGrid({
        args: [
          { color: theme.gridPrimary, thickness: 1 },
          { color: theme.gridSecondary, thickness: 1, factor: 4 },
        ] as any,
      })

      if (showGrid) {
        graph.showGrid()
      }
      else {
        graph.hideGrid()
      }

      // Update existing edges
      const edges = graph.getEdges()
      edges.forEach((edge) => {
        // We update the stroke color. Note: this might override active hover animation if we are not careful,
        // but typically user won't switch theme while hovering.
        // Also check if it has animation to decide if we should update stroke now or let mouseleave handle it.
        // But simplifying, we just update.
        // If edge is animated, it has stroke #1890ff, we shouldn't change it to theme color.
        const currentStroke = edge.attr('line/stroke')
        if (currentStroke !== '#1890ff') {
          edge.attr('line/stroke', theme.lineColor)
        }
      })

      // Update default edge config for new edges
      Graph.registerEdge(
        'dag-edge',
        {
          inherit: 'edge',
          attrs: {
            line: {
              stroke: theme.lineColor,
              strokeWidth: 1,
              targetMarker: null,
            },
          },
        },
        true,
      )
    }
  }, [isDarkMode, showGrid])

  useEffect(() => {
    if (!containerRef.current) { return }

    const graph: Graph = new Graph({
      container: containerRef.current,
      autoResize: true,
      background: {
        color: ThemeStyles[themeRef.current].bgColor,
      },
      grid: {
        visible: true,
        type: 'doubleMesh',
        args: [
          {
            color: ThemeStyles[themeRef.current].gridPrimary, // main grid lines
            thickness: 1,
          },
          {
            color: ThemeStyles[themeRef.current].gridSecondary, // secondary grid lines
            thickness: 1,
            factor: 4,
          },
        ],
      },
      panning: true,
      mousewheel: true,
      connecting: {
        snap: true,
        allowBlank: false,
        allowLoop: false,
        highlight: true,
        connector: 'algo-connector',
        connectionPoint: 'anchor',
        anchor: 'center',
        createEdge(): Edge {
          return graph.createEdge({
            shape: 'dag-edge',
            attrs: {
              line: {
                strokeDasharray: '5 5',
              },
            },
            zIndex: -1,
          })
        },
      },
    })

    graphRef.current = graph
    graph.use(new Export())
    graph.use(new Selection({ enabled: true, multiple: false, rubberband: false }))

    graph.on('selection:changed', ({ selected }) => {
      const node = selected.find(c => c.isNode())
      selectedNodeIdRef.current = node ? node.id : null
    })

    // 数据转换：为每个节点添加唯一 ID
    const transformData = (data: any) => {
      const result: any = {
        id: data.id || Math.random().toString(36).slice(2),
        data: { ...data }, // keep original data
        children: [],
        collapsed: data.collapsed ?? false, // default collapsed state
      }
      if (data.children) {
        result.children = data.children.map((child: any) => transformData(child))
      }
      return result
    }

    // Initialize tree data
    treeDataRef.current = transformData(data)

    const render = () => {
      const root = treeDataRef.current

      // Filter collapsed nodes for layout
      const getVisibleData = (node: any): any => {
        const visibleNode = {
          ...node,
          children: node.collapsed ? [] : (node.children || []).map(getVisibleData),
        }
        return visibleNode
      }

      const visibleData = getVisibleData(root)

      // 计算布局
      const result = Hierarchy.mindmap(visibleData, {
        direction: 'H',
        getHeight: () => 36, // Match AlgoNode height
        getWidth: () => 180, // Match AlgoNode width
        getHGap: () => 60,
        getVGap: () => 10,
        getSide: () => 'right',
      })

      const cells: any[] = []
      const traverse = (node: any) => {
        if (node) {
          const sourceNode = findNodeInTree(treeDataRef.current, node.id)
          const hasChildren = sourceNode && sourceNode.children && sourceNode.children.length > 0

          const dagNode = graph.createNode({
            id: node.id,
            shape: 'dag-node',
            x: node.x,
            y: node.y,
            data: {
              label: node.data.data.name,
              checked: sourceNode?.checked || false,
              collapsed: sourceNode?.collapsed || false,
              hasChildren,
              showCheckboxes,
              readonly,
              onAddChild: () => openCreateDialog(node.id),
              onDeleteNode: () => openDeleteDialog(node.id),
              onEditNode: () => openRenameDialog(node.id),
            },
            ports: [
              { id: 'left', group: 'left' },
              { id: 'right', group: 'right' },
            ],
          })
          cells.push(dagNode)

          if (node.children) {
            node.children.forEach((child: any) => {
              traverse(child)
              const edge = graph.createEdge({
                source: { cell: node.id, port: 'right' },
                target: { cell: child.id, port: 'left' },
                shape: 'dag-edge',
                connector: { name: 'algo-connector' },
                attrs: {
                  line: {
                    strokeDasharray: '5 5',
                  },
                },
              })
              cells.push(edge)
            })
          }
        }
      }

      traverse(result)
      graph.resetCells(cells)
      if (selectedNodeIdRef.current) {
        const cell = graph.getCellById(selectedNodeIdRef.current)
        if (cell && cell.isNode()) {
          graph.resetSelection(cell)
        }
        else {
          graph.cleanSelection()
        }
      }
      graph.centerContent()
      // graph.zoomToFit({ padding: 20 }); // Optional: might be annoying if it zooms out too much on collapse
    }

    renderRef.current = render

    render()

    // 监听数据变化事件
    graph.on('node:change:data', ({ node, current, previous }: { node: Node, current: any, previous: any }) => {
      const sourceNode = findNodeInTree(treeDataRef.current, node.id)
      if (!sourceNode) { return }

      // Handle collapsed change
      if (current.collapsed !== previous?.collapsed) {
        sourceNode.collapsed = current.collapsed
        // Re-render the graph
        render()
        onNodeChange?.(getMindNodeData(treeDataRef.current))
        return // Return early since render() will reset cells
      }

      // Handle checked change
      if (current.checked !== previous?.checked) {
        const isChecked = current.checked
        sourceNode.checked = isChecked // Update source of truth

        const updateChildrenChecked = (n: any, checked: boolean) => {
          if (n.children) {
            n.children.forEach((c: any) => {
              c.checked = checked
              updateChildrenChecked(c, checked)
            })
          }
        }
        updateChildrenChecked(sourceNode, isChecked)

        const outgoingEdges = graph.getOutgoingEdges(node)
        if (outgoingEdges) {
          outgoingEdges.forEach((edge: Edge) => {
            const childNode = edge.getTargetCell()
            if (childNode && childNode.isNode()) {
              const childData = childNode.getData() as NodeStatus
              if (childData.checked !== isChecked) {
                childNode.setData({
                  ...childData,
                  checked: isChecked,
                })
              }
            }
          })
        }
        onNodeChange?.(getMindNodeData(treeDataRef.current))
      }

      // Handle label change
      if (current.label !== previous?.label) {
        sourceNode.data = sourceNode.data || {}
        sourceNode.data.name = current.label
        onNodeChange?.(getMindNodeData(treeDataRef.current), 'update')
      }
    })

    // 鼠标移入节点时高亮路径
    graph.on('node:mouseenter', ({ node }: { node: Node }) => {
      // 找到回溯到根节点的路径
      const edges: Cell[] = []
      let current = node
      while (current) {
        const incomingEdges = graph.getIncomingEdges(current)
        if (incomingEdges && incomingEdges.length > 0) {
          const edge = incomingEdges[0] // 树状结构只有一个入边
          edges.push(edge)
          current = edge.getSourceCell() as any
        }
        else {
          break
        }
      }

      edges.forEach((edge) => {
        edge.attr('line/stroke', '#1890ff')
        edge.attr('line/strokeDasharray', 5)
        edge.attr('line/style/animation', 'ant-line-flow 30s linear infinite')
      })
    })

    // 鼠标移出节点时恢复路径
    graph.on('node:mouseleave', ({ node }: { node: Node }) => {
      // 找到回溯到根节点的路径
      const edges: Cell[] = []
      let current = node
      while (current) {
        const incomingEdges = graph.getIncomingEdges(current)
        if (incomingEdges && incomingEdges.length > 0) {
          const edge = incomingEdges[0] // 树状结构只有一个入边
          edges.push(edge)
          current = edge.getSourceCell() as any
        }
        else {
          break
        }
      }

      edges.forEach((edge) => {
        edge.attr('line/stroke', ThemeStyles[themeRef.current].lineColor)
        edge.attr('line/strokeDasharray', '5 5') // 恢复为虚线，或者 '' 如果是实线
        edge.attr('line/style/animation', '')
      })
    })

    return () => {
      renderRef.current = null
      graph.dispose()
    }
  }, [data])

  useEffect(() => {
    const graph = graphRef.current
    if (graph) {
      const nodes = graph.getNodes()
      nodes.forEach((node) => {
        const nodeData = node.getData()
        node.setData({
          ...nodeData,
          showCheckboxes,
          readonly,
        })
      })
    }
  }, [showCheckboxes, readonly])

  const zoomIn = () => {
    const graph = graphRef.current
    if (graph) {
      graph.zoom(0.1)
    }
  }

  const zoomOut = () => {
    const graph = graphRef.current
    if (graph) {
      graph.zoom(-0.1)
    }
  }

  const zoomToOne = () => {
    const graph = graphRef.current
    if (graph) {
      graph.zoomToFit({ padding: 20 })
      graph.centerContent()
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      <div className="absolute top-5 left-5 z-[100] text-xl font-bold text-foreground pointer-events-none select-none flex items-center gap-2">
        {title}
        {readonly && <Lock className="w-4 h-4" />}
      </div>
      <FlowGraphToolbar
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        zoomToOne={zoomToOne}
        exportGraph={exportGraph}
        showCheckboxes={showCheckboxes}
        onToggleCheckboxes={setShowCheckboxes}
        showGrid={showGrid}
        onToggleGrid={setShowGrid}
      />
      {!readonly && (
        <div className="absolute bottom-5 left-5 z-[100] text-xs text-muted-foreground pointer-events-none select-none p-3">
          <div className="mb-2 font-medium text-foreground">选中节点后：</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Kbd>Tab</Kbd>
              <span>创建子节点</span>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>Enter</Kbd>
              <span>创建同级节点</span>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>Delete</Kbd>
              <span>删除节点</span>
            </div>
          </div>
        </div>
      )}
      <RenameNodeDialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open)
          if (!open) {
            setRenameNodeId(null)
          }
        }}
        value={renameValue}
        onChange={setRenameValue}
        onConfirm={applyRename}
      />
      <DeleteNodeDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) {
            setDeleteNodeId(null)
          }
        }}
        nodeName={deleteNodeName}
        onConfirm={applyDelete}
      />
    </div>
  )
})
