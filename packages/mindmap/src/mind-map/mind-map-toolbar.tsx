import { CheckSquare, Download, Grid, Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'
import { ButtonGroup } from '../ui/button-group'
import { Toggle } from '../ui/toggle'

interface MindMapToolbarProps {
  zoomIn: () => void
  zoomOut: () => void
  zoomToOne: () => void
  exportGraph: () => void
  showCheckboxes: boolean
  onToggleCheckboxes: (checked: boolean) => void
  showGrid: boolean
  onToggleGrid: (checked: boolean) => void
}

export const MindMapToolbar: React.FC<MindMapToolbarProps> = ({
  zoomIn,
  zoomOut,
  zoomToOne,
  exportGraph,
  showCheckboxes,
  onToggleCheckboxes,
  showGrid,
  onToggleGrid,
}) => {
  return (
    <div className="mindmap-toolbar">
      <ButtonGroup className="mindmap-toolbar-group">
        <Toggle
          pressed={showCheckboxes}
          onPressedChange={onToggleCheckboxes}
          variant="outline"
          size="sm"
          title="Toggle Checkboxes"
        >
          <CheckSquare className="mindmap-toolbar-icon" />
        </Toggle>
        <Toggle
          pressed={showGrid}
          onPressedChange={onToggleGrid}
          variant="outline"
          size="sm"
          title="Toggle Grid"
        >
          <Grid className="mindmap-toolbar-icon" />
        </Toggle>
      </ButtonGroup>

      <ButtonGroup className="mindmap-toolbar-group">
        <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom In">
          <ZoomIn className="mindmap-toolbar-icon mindmap-toolbar-icon-mr" />
        </Button>
        <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom Out">
          <ZoomOut className="mindmap-toolbar-icon mindmap-toolbar-icon-mr" />
        </Button>
        <Button variant="outline" size="sm" onClick={zoomToOne} title="Fit to View">
          <Maximize className="mindmap-toolbar-icon mindmap-toolbar-icon-mr" />
        </Button>
        <Button variant="outline" size="sm" onClick={exportGraph} title="Export Graph">
          <Download className="mindmap-toolbar-icon mindmap-toolbar-icon-mr" />
        </Button>
      </ButtonGroup>
    </div>
  )
}
