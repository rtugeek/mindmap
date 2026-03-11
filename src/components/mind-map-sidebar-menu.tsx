import type { MindMapData } from '@/data/mindmap-data'
import { Minus, MoreHorizontal, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DeleteMindMapDialog } from '@/components/dialogs/delete-mind-map-dialog'
import { RenameMindMapDialog } from '@/components/dialogs/rename-mind-map-dialog'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { mindMapDataRepository } from '@/data/mind-map-data-repository'
import { useMindMapStore } from '@/store/mind-map-store'

interface MindMapSidebarMenuProps {
  groups?: Record<string, MindMapData[]>
  onMindMapClick: (item: MindMapData) => void
  onRefresh?: () => void
}

export function MindMapSidebarMenu({
  groups: propGroups,
  onMindMapClick,
  onRefresh,
}: MindMapSidebarMenuProps) {
  const { groups: storeGroups, loadMindMaps, renameMindMap, deleteMindMap } = useMindMapStore()

  const groups = propGroups || storeGroups

  useEffect(() => {
    if (!propGroups) {
      loadMindMaps()
    }
  }, [propGroups, loadMindMaps])

  const [selectedMindMap, setSelectedMindMap] = useState<MindMapData | null>(null)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)

  const [mindMapToDelete, setMindMapToDelete] = useState<MindMapData | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const openRenameDialog = (item: MindMapData) => {
    setSelectedMindMap(item)
    setIsRenameDialogOpen(true)
  }

  const handleRenameConfirm = async (newTopic: string, newEmoji: string, newGroup: string) => {
    if (selectedMindMap?.id) {
      await renameMindMap(selectedMindMap.id, newTopic, newEmoji, newGroup)
      onRefresh?.()
      setIsRenameDialogOpen(false)
      setSelectedMindMap(null)
    }
  }

  const openDeleteDialog = (item: MindMapData) => {
    setMindMapToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (mindMapToDelete?.id) {
      await deleteMindMap(mindMapToDelete.id)
      onRefresh?.()
      setIsDeleteDialogOpen(false)
      setMindMapToDelete(null)
    }
  }

  return (
    <>
      <SidebarMenu>
        {Object.entries(groups).map(([groupName, items], index) => (
          <Collapsible
            key={groupName}
            defaultOpen={index === 0}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  {groupName}
                  {' '}
                  <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                  <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {items.map(item => (
                    <SidebarMenuSubItem key={item.id}>
                      <SidebarMenuSubButton
                        asChild
                        className="cursor-pointer group/item flex items-center justify-between pr-2"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div
                            className="flex flex-1 items-center gap-2 truncate"
                            onClick={async () => {
                              if (item.id) {
                                const data = await mindMapDataRepository.get(item.id)
                                if (data) {
                                  onMindMapClick(data)
                                }
                              }
                            }}
                          >
                            <span>{item.emoji}</span>
                            <span className="truncate">{item.topic}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 transition-opacity group-hover/item:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openRenameDialog(item)}>
                                修改主题
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(item)}
                                className="text-red-600"
                              >
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>

      <RenameMindMapDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        initialTopic={selectedMindMap?.topic || ''}
        initialEmoji={selectedMindMap?.emoji || ''}
        initialGroup={selectedMindMap?.group || ''}
        onConfirm={handleRenameConfirm}
      />

      <DeleteMindMapDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
