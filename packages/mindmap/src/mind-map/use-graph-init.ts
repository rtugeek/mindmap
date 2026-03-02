import type { Cell, Edge, Node } from '@antv/x6'
import type { MindNode } from '../types/MindNode'
import type { NodeStatus } from './algo-node'
import Hierarchy from '@antv/hierarchy'
import { Export, Graph, Selection } from '@antv/x6'
import { useEffect } from 'react'
import { ThemeStyles } from '../constants/flow-constants'
import { registerCustomEdge } from './registry'
import { findNodeInTree, getMindNodeData, getVisibleData, transformData } from './utils'

interface UseGraphInitProps {
  containerRef: React.RefObject<HTMLDivElement>
  graphRef: React.RefObject<Graph | null>
  treeDataRef: React.RefObject<any>
  renderRef: React.RefObject<(() => void) | null>
  selectedNodeIdRef: React.RefObject<string | null>
  themeRef: React.RefObject<'light' | 'dark'>
  data: MindNode
  isDarkMode: boolean
  showCheckboxes: boolean
  showGrid: boolean
  readonly: boolean
  onNodeChange?: (data: MindNode, type: 'create' | 'delete' | 'update' | 'check' | 'collapse' | 'undo') => void
  openCreateDialog: (parentId: string) => void
  openDeleteDialog: (nodeId: string) => void
  openRenameDialog: (nodeId: string) => void
}

export function useGraphInit({
  containerRef,
  graphRef,
  treeDataRef,
  renderRef,
  selectedNodeIdRef,
  themeRef,
  data,
  isDarkMode,
  showCheckboxes,
  showGrid,
  readonly,
  onNodeChange,
  openCreateDialog,
  openDeleteDialog,
  openRenameDialog,
}: UseGraphInitProps) {
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
        const currentStroke = edge.attr('line/stroke')
        if (currentStroke !== '#1890ff') {
          edge.attr('line/stroke', theme.lineColor)
        }
      })

      // Update default edge config for new edges
      registerCustomEdge(themeRef.current)
    }
  }, [isDarkMode, showGrid])

  useEffect(() => {
    if (!containerRef.current) { return }

    registerCustomEdge(themeRef.current)

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
            color: ThemeStyles[themeRef.current].gridPrimary,
            thickness: 1,
          },
          {
            color: ThemeStyles[themeRef.current].gridSecondary,
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

    // Initialize tree data
    treeDataRef.current = transformData(data)

    const render = () => {
      const root = treeDataRef.current

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

        // If collapsing, reset animation state for all children so they animate again when expanded
        if (sourceNode.collapsed) {
          const resetAnimated = (n: any) => {
            if (n.children) {
              n.children.forEach((c: any) => {
                c._animated = false
                resetAnimated(c)
              })
            }
          }
          resetAnimated(sourceNode)
        }

        // Re-render the graph
        render()
        onNodeChange?.(getMindNodeData(treeDataRef.current), 'collapse')
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
        onNodeChange?.(getMindNodeData(treeDataRef.current), 'check')
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
}
