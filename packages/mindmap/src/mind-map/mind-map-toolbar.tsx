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
    <div className="absolute top-5 right-5 z-[100] flex gap-2">
      <ButtonGroup className="shadow-sm bg-background rounded-md overflow-hidden">
        <Toggle
          pressed={showCheckboxes}
          onPressedChange={onToggleCheckboxes}
          variant="outline"
          size="sm"
          title="Toggle Checkboxes"
        >
          <CheckSquare className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={showGrid}
          onPressedChange={onToggleGrid}
          variant="outline"
          size="sm"
          title="Toggle Grid"
        >
          <Grid className="h-4 w-4" />
        </Toggle>
      </ButtonGroup>

      <ButtonGroup className="shadow-sm bg-background rounded-md overflow-hidden">
        <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4 mr-1" />
        </Button>
        <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4 mr-1" />
        </Button>
        <Button variant="outline" size="sm" onClick={zoomToOne} title="Fit to View">
          <Maximize className="h-4 w-4 mr-1" />
        </Button>
        <Button variant="outline" size="sm" onClick={exportGraph} title="Export Graph">
          <Download className="h-4 w-4 mr-1" />
        </Button>
      </ButtonGroup>
    </div>
  )
}
