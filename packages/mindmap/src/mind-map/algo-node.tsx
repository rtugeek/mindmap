import type { Cell } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import insertCss from 'insert-css'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import React from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu'

export interface NodeStatus {
  id: string
  label?: string
  checked?: boolean
  collapsed?: boolean
  editing?: boolean
  readonly?: boolean
}

function AlgoNode(props: { node: Cell }) {
  const { node } = props
  const data = node?.getData() as NodeStatus
  const { label, checked = false, collapsed = false, readonly = false } = data
  const showCheckboxes = (data as any).showCheckboxes !== false
  const onAddChild = (data as any).onAddChild as undefined | (() => void)
  const onDeleteNode = (data as any).onDeleteNode as undefined | (() => void)
  const onEditNode = (data as any).onEditNode as undefined | (() => void)

  const [editing, setEditing] = React.useState(data.editing || false)
  const [tempLabel, setTempLabel] = React.useState(label || '')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (data.editing !== undefined) {
      setEditing(data.editing)
    }
  }, [data.editing])

  React.useEffect(() => {
    setTempLabel(label || '')
  }, [label])

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    node.setData({
      ...data,
      checked: e.target.checked,
    })
  }

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    node.setData({
      ...data,
      collapsed: !collapsed,
    })
  }

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (readonly) { return }
    setEditing(true)
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempLabel(e.target.value)
  }

  const handleLabelBlur = () => {
    setEditing(false)
    if (tempLabel !== label) {
      node.setData({
        ...data,
        label: tempLabel,
        editing: false,
      })
    }
    else {
      node.setData({
        ...data,
        editing: false,
      })
    }
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelBlur()
    }
  }

  // Check if node has children in the data (not just visible graph edges)
  // We'll pass a hasChildren flag in data
  const hasChildren = (data as any).hasChildren

  const content = (
    <div className={`node ${checked ? 'checked' : ''}`}>
      {showCheckboxes && (
        <span className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={checked}
            disabled={readonly}
            onChange={handleChange}
            onMouseDown={e => e.stopPropagation()}
          />
        </span>
      )}
      {editing
        ? (
            <input
              ref={inputRef}
              className="label-input"
              value={tempLabel}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              onMouseDown={e => e.stopPropagation()}
            />
          )
        : (
            <span className="label" onDoubleClick={handleLabelDoubleClick}>
              {label}
            </span>
          )}
      <span className="status">
        {hasChildren && (
          <button
            className="collapse-btn"
            onClick={handleCollapse}
            onMouseDown={e => e.stopPropagation()}
          >
            {collapsed ? '+' : '-'}
          </button>
        )}
      </span>
    </div>
  )

  if (readonly) {
    return content
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {content}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onAddChild?.()
          }}
        >
          <Plus />
          添加
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onDeleteNode?.()
          }}
        >
          <Trash2 />
          删除
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onEditNode?.()
          }}
        >
          <Pencil />
          修改
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

register({
  shape: 'dag-node',
  width: 180,
  height: 36,
  component: AlgoNode,
  ports: {
    groups: {
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 0,
            magnet: true,
            stroke: 'transparent',
            strokeWidth: 0,
            fill: 'transparent',
          },
        },
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 0,
            magnet: true,
            stroke: 'transparent',
            strokeWidth: 0,
            fill: 'transparent',
          },
        },
      },
    },
  },
})

// @ts-expect-error insert-css type definition issue
insertCss(`
.node {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: var(--node-bg);
  border: 1px solid var(--node-border);
  border-left: 4px solid #5F95FF;
  border-radius: 4px;
  box-shadow: 0 2px 5px 1px var(--shadow-color);
  transition: all 0.3s;
}
.checkbox-wrapper {
  display: flex;
  align-items: center;
  margin-left: 8px;
}
.node .label {
  display: inline-block;
  flex: 1;
  margin-left: 8px;
  color: var(--node-text);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
}
.label-input {
  flex: 1;
  margin-left: 8px;
  font-size: 12px;
  border: 1px solid #1890ff;
  border-radius: 2px;
  outline: none;
  padding: 2px 4px;
  color: var(--node-text);
  background: var(--node-bg);
  height: 24px;
  width: 100%;
}
.node .status {
  flex-shrink: 0;
  margin-right: 8px;
  display: flex;
  align-items: center;
}
.node.checked {
  border-left: 4px solid #52c41a;
}
.collapse-btn {
  margin-left: 8px;
  width: 16px;
  height: 16px;
  line-height: 14px;
  text-align: center;
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--text-color);
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  border-radius: 2px;
}
.collapse-btn:hover {
  background-color: var(--btn-hover);
  border-color: var(--node-text);
}
.x6-node-selected .node {
  border-color: #1890ff;
  border-radius: 2px;
  box-shadow: 0 0 0 4px #d4e8fe;
}
.x6-node-selected .node.checked {
  border-color: #52c41a;
  border-radius: 2px;
  box-shadow: 0 0 0 4px #ccecc0;
}
.x6-edge:hover path:nth-child(2){
  stroke: #1890ff;
  stroke-width: 1px;
}

.x6-edge-selected path:nth-child(2){
  stroke: #1890ff;
  stroke-width: 1.5px !important;
}
`)

export default AlgoNode
