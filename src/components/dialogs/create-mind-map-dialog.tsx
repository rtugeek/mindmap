import type { MindNode } from '@widget-js/mindmap'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { isEqual } from 'lodash'
import { Loader2, Plus, Sparkles } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { AiApi } from '@/api/ai'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { parseYamlToMindMap } from '@/lib/yaml-to-mindmap'

interface CreateMindMapDialogProps {
  onConfirm: (topic: string, emoji: string, group: string, initialData?: MindNode) => Promise<string | undefined>
  onUpdate?: (id: string, data: MindNode) => Promise<void>
  onAIStreamFinished?: (id: string, data: MindNode) => Promise<void>
  trigger?: React.ReactNode
}

export function CreateMindMapDialog({ onConfirm, onUpdate, onAIStreamFinished, trigger }: CreateMindMapDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('ai')
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Manual mode state
  const [manualTopic, setManualTopic] = React.useState('')
  const [manualEmoji, setManualEmoji] = React.useState('📝')
  const [manualGroup, setManualGroup] = React.useState('默认分组')

  // AI mode state
  const [aiTopic, setAiTopic] = React.useState('')
  const [aiDescription, setAiDescription] = React.useState('')
  const [aiGroup, setAiGroup] = React.useState('默认分组')

  const resetState = () => {
    setManualTopic('')
    setManualEmoji('📝')
    setManualGroup('默认分组')
    setAiTopic('')
    setAiDescription('')
    setAiGroup('默认分组')
    setActiveTab('ai')
    setIsGenerating(false)
  }

  const handleManualConfirm = async () => {
    const trimmedTopic = manualTopic.trim()
    if (!trimmedTopic) { return }
    await onConfirm(trimmedTopic, manualEmoji, manualGroup)
    setOpen(false)
    resetState()
  }

  const handleAiConfirm = async () => {
    const trimmedTopic = aiTopic.trim()
    if (!trimmedTopic) { return }

    setIsGenerating(true)

    // Create an initial mind map structure to show immediately
    const initialMindNode: MindNode = {
      id: 'root',
      name: trimmedTopic,
      children: [],
    }

    // Call onConfirm immediately with initial data to switch to the view
    const createdId = await onConfirm(trimmedTopic, '🤖', aiGroup, initialMindNode)
    if (!createdId) {
      console.error('Failed to create mind map, cannot stream updates')
      setIsGenerating(false)
      return
    }

    setOpen(false)
    const toastId = toast.loading('AI 正在生成思维导图...', {
      description: '请稍候，正在为您生成内容',
    })

    let fullText = ''
    let lastMindMap: MindNode | null = null

    try {
      const userPrompt = `Create a mind map about: ${trimmedTopic}${aiDescription ? `. Additional context: ${aiDescription}` : ''}`
      await AiApi.postStream({
        remark: '思维导图',
        systemPrompt: `
        You are a mind map generator. Generate a mind map in YAML format based on the user prompt. The output must be valid YAML. Use keys for topics and nested lists for subtopics. Do not include markdown code blocks.
        层级最多为5,emoji根据主题选择一个相关联的。
        例如用户输入："创建一个关于React的思维导图"
        输出：
        topic: React
        emoji: 🧠
        children:
          组件:
            函数组件:
            类组件:
          状态管理:
            useState:
            useEffect:
          生命周期:
          事件处理:
          Hooks:
            useState:
            useEffect:
        `,
        userPrompt,
      }, async (chunk) => {
        fullText += chunk
        // Parse and update the mind map progressively
        const cleanYaml = fullText.replace(/```yaml\n?|\n?```/g, '')
        const mindMapData = parseYamlToMindMap(cleanYaml)

        if (mindMapData && mindMapData.mindmap) {
          if (mindMapData.topic === 'Mind Map' || mindMapData.topic === 'Root') {
            mindMapData.topic = trimmedTopic
            mindMapData.mindmap.name = trimmedTopic
          }

          // Compare with last update to avoid unnecessary re-renders
          // We can use a deep comparison here. Since MindNode can be large,
          // we might want to optimize, but for streaming updates, preventing
          // layout thrashing is more important.
          if (!lastMindMap || !isEqual(lastMindMap, mindMapData.mindmap)) {
            // Update the existing mind map
            if (onUpdate) {
              await onUpdate(createdId, mindMapData.mindmap)
              lastMindMap = JSON.parse(JSON.stringify(mindMapData.mindmap))
            }
          }
        }
      })

      // Final update
      const cleanYaml = fullText.replace(/```yaml\n?|\n?```/g, '')
      const mindMapData = parseYamlToMindMap(cleanYaml)
      if (mindMapData && mindMapData.mindmap) {
        if (mindMapData.topic === 'Mind Map' || mindMapData.topic === 'Root') {
          mindMapData.topic = trimmedTopic
          mindMapData.mindmap.name = trimmedTopic
        }
        if (onUpdate && (!lastMindMap || !isEqual(lastMindMap, mindMapData.mindmap))) {
          await onUpdate(createdId, mindMapData.mindmap)
        }

        // Notify that stream is finished
        if (onAIStreamFinished) {
          await onAIStreamFinished(createdId, mindMapData.mindmap)
        }
      }

      resetState()
      toast.success('思维导图生成完成', {
        id: toastId,
        description: '内容已生成完毕',
      })
    }
    catch (e) {
      console.error(e)
      toast.error('生成失败', {
        id: toastId,
        description: 'AI 生成过程中发生错误',
      })
    }
    finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) { resetState() }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full justify-start" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            创建思维导图
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建思维导图</DialogTitle>
          <DialogDescription>
            选择创建方式
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai">AI 生成</TabsTrigger>
            <TabsTrigger value="manual">手动创建</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manual-topic" className="text-right">
                主题
              </Label>
              <Input
                id="manual-topic"
                value={manualTopic}
                onChange={e => setManualTopic(e.target.value)}
                maxLength={30}
                className="col-span-3"
                placeholder="请输入导图主题"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manual-emoji" className="text-right">
                图标
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="col-span-3 justify-start text-left font-normal"
                  >
                    {manualEmoji || <span className="text-muted-foreground">选择图标</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Picker data={data} onEmojiSelect={(emoji: any) => setManualEmoji(emoji.native)} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manual-group" className="text-right">
                分组
              </Label>
              <Input
                id="manual-group"
                value={manualGroup}
                onChange={e => setManualGroup(e.target.value)}
                maxLength={30}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleManualConfirm}>创建</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ai-topic" className="text-right">
                主题
              </Label>
              <Input
                id="ai-topic"
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                maxLength={30}
                className="col-span-3"
                placeholder="例如：React 学习路线"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="ai-desc" className="text-right pt-2">
                补充说明
              </Label>
              <Textarea
                id="ai-desc"
                value={aiDescription}
                onChange={e => setAiDescription(e.target.value)}
                maxLength={500}
                className="col-span-3"
                placeholder="可选，提供更多细节..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ai-group" className="text-right">
                分组
              </Label>
              <Input
                id="ai-group"
                value={aiGroup}
                onChange={e => setAiGroup(e.target.value)}
                maxLength={30}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAiConfirm} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                生成
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
