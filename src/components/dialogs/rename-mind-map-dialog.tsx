import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface RenameMindMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTopic: string
  initialEmoji: string
  initialGroup: string
  onConfirm: (topic: string, emoji: string, group: string) => Promise<void>
}

export function RenameMindMapDialog({
  open,
  onOpenChange,
  initialTopic,
  initialEmoji,
  initialGroup,
  onConfirm,
}: RenameMindMapDialogProps) {
  const [topic, setTopic] = React.useState(initialTopic)
  const [emoji, setEmoji] = React.useState(initialEmoji)
  const [group, setGroup] = React.useState(initialGroup)

  React.useEffect(() => {
    setTopic(initialTopic)
    setEmoji(initialEmoji)
    setGroup(initialGroup)
  }, [initialTopic, initialEmoji, initialGroup])

  const handleConfirm = async () => {
    const trimmedTopic = topic.trim()
    if (!trimmedTopic) { return }
    await onConfirm(trimmedTopic, emoji, group)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>修改思维导图</DialogTitle>
          <DialogDescription>
            您可以修改思维导图的主题、图标和分组
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rename-topic" className="text-right">
              主题
            </Label>
            <Input
              id="rename-topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rename-emoji" className="text-right">
              图标
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="col-span-3 justify-start text-left font-normal"
                >
                  {emoji || <span className="text-muted-foreground">选择图标</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Picker data={data} onEmojiSelect={(emoji: any) => setEmoji(emoji.native)} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rename-group" className="text-right">
              分组
            </Label>
            <Input
              id="rename-group"
              value={group}
              onChange={e => setGroup(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
