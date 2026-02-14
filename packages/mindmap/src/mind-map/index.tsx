import type { Graph } from '@antv/x6'
import type { MindNode } from '../types/MindNode.ts.ts'
import { Lock } from 'lucide-react'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Kbd } from '../ui/kbd.tsx.tsx'
import { DeleteNodeDialog } from './delete-node-dialog.tsx.tsx'
import { MindMapToolbar } from './mind-map-toolbar.tsx'
import { registerCustomConnector } from './registry.ts.ts'
import { RenameNodeDialog } from './rename-node-dialog.tsx.tsx'
import { useGraphInit } from './use-graph-init.ts.ts'
import { useGraphOperations } from './use-graph-operations.ts.ts'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts.ts.ts'
import './algo-node.tsx.tsx' // Import for side effects (registering shape and inserting css)

interface MindMapProps {
  data: MindNode
  isDarkMode?: boolean
  title?: string
  showCheckboxes?: boolean
  showGrid?: boolean
  readonly?: boolean
  onNodeChange?: (data: MindNode, type: 'create' | 'delete' | 'update' | 'check' | 'collapse' | 'undo') => void
}

export interface MindMapRef {
  exportGraph: () => void
}

// Register custom connector
registerCustomConnector()

export const MindMap = forwardRef<MindMapRef, MindMapProps>(({ data, isDarkMode = false, title = '思维导图', readonly = false, onNodeChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<Graph>(null)
  const treeDataRef = useRef<any>(null)
  const renderRef = useRef<null | (() => void)>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  const themeRef = useRef<'light' | 'dark'>(isDarkMode ? 'dark' : 'light')

  const [showCheckboxes, setShowCheckboxes] = useState(true)
  const [showGrid, setShowGrid] = useState(true)

  const {
    renameOpen,
    setRenameOpen,
    setRenameNodeId,
    renameValue,
    setRenameValue,
    deleteOpen,
    setDeleteOpen,
    setDeleteNodeId,
    deleteNodeName,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    applyRename,
    applyDelete,
    applyCreateChild,
    applyCreateSibling,
  } = useGraphOperations({
    graphRef,
    treeDataRef,
    renderRef,
    selectedNodeIdRef,
    onNodeChange,
  })

  useGraphInit({
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
  })

  useKeyboardShortcuts({
    renameOpen,
    readonly,
    selectedNodeIdRef,
    applyCreateSibling,
    applyCreateChild,
    openDeleteDialog,
  })

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
      <MindMapToolbar
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
