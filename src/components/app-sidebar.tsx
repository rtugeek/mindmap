import type { MindNode } from '@widget-js/mindmap'
import type { MindMapData } from '@/data/mindmap-data'
import { BrowserWindowApi, NotificationApi } from '@widget-js/core'
import consola from 'consola'
import { throttle } from 'lodash'
import { Plus } from 'lucide-react'
import * as React from 'react'
import { supabase } from '@/api/supabase'
import logo from '@/assets/logo.png'
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler'
import { CreateMindMapDialog } from '@/components/dialogs/create-mind-map-dialog'
import { MindMapSidebarMenu } from '@/components/mind-map-sidebar-menu'
import { NavUser } from '@/components/nav-user'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useSupabaseChannel } from '@/hooks/use-supabase-channel'
import { useUser } from '@/hooks/use-user'
import { useMindMapStore } from '@/store/mind-map-store'

export function AppSidebar({ onMindMapCreated, groups, onRefresh, ...props }: React.ComponentProps<typeof Sidebar> & {
  onMindMapCreated?: (data: MindMapData) => void
  groups?: Record<string, MindMapData[]>
  onRefresh?: () => void
}) {
  const { createMindMap, updateMindMap } = useMindMapStore()

  const { user, nickname, avatar, userId } = useUser()
  const [loginState, setLoginState] = React.useState('')

  // Handle Supabase channel for login
  useSupabaseChannel(loginState ? `wechat-login-${loginState}` : '', async (payload: any) => {
    consola.info(payload)
    const currentSession = payload.payload.session
    const loginRes = await supabase.auth.setSession(currentSession)
    if (loginRes.error) {
      NotificationApi.error(loginRes.error.message)
    }
  })

  React.useEffect(() => {
    const storedState = localStorage.getItem('wechat_login_state')
    if (storedState) { setLoginState(storedState) }
  }, [])

  const handleLogin = () => {
    const newState = crypto.randomUUID().replace(/-/g, '')
    setLoginState(newState)
    localStorage.setItem('wechat_login_state', newState)

    BrowserWindowApi.openUrl(`https://open.weixin.qq.com/connect/qrconnect?appid=wxf91b19da281f23a9&redirect_uri=https%3A%2F%2Fwidgetjs.cn%2Fapi%2Fv1%2Fuser%2Flogin%2Fwechat%2Fcallback&response_type=code&scope=snsapi_login&state=${newState}#wechat_redirect`, {
      width: 800,
      height: 600,
      frame: true,
      transparent: false,
      titleBarStyle: 'default',
    })
  }

  const handleCreateMindMap = async (topic: string, emoji: string, group: string, initialData?: MindNode) => {
    const data = await createMindMap(topic, emoji, group, initialData, userId)
    if (data) {
      if (onMindMapCreated) {
        onMindMapCreated(data)
      }
      onRefresh?.()
    }
    return data?.id
  }

  // Throttle the update function to run at most once every 500ms
  const throttledUpdateMindMap = React.useMemo(
    () => throttle(async (id: string, mindmap: MindNode) => {
      try {
        await updateMindMap(id, mindmap)
        const updated = useMindMapStore.getState().mindMaps.find(m => m.id === id)
        if (updated && onMindMapCreated) {
          onMindMapCreated(updated)
        }
      }
      catch (error) {
        console.error('Failed to update mind map:', error)
      }
    }, 500),
    [updateMindMap, onMindMapCreated],
  )

  const handleUpdateMindMap = async (id: string, mindmap: MindNode, forceSave = false) => {
    if (forceSave) {
      try {
        await updateMindMap(id, mindmap)
        const updated = useMindMapStore.getState().mindMaps.find(m => m.id === id)
        if (updated && onMindMapCreated) {
          onMindMapCreated(updated)
        }
      }
      catch (error) {
        console.error('Failed to update mind map:', error)
      }
    }
    else {
      throttledUpdateMindMap(id, mindmap)
    }
  }

  const handleMindMapClick = (item: MindMapData) => {
    if (onMindMapCreated) {
      onMindMapCreated(item)
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src={logo} alt="logo" className="size-8" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">思维导图</span>
                  <span className="">
                    v
                    {__APP_VERSION__}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <CreateMindMapDialog
              onConfirm={async (topic, emoji, group, initialData) => {
                const id = await handleCreateMindMap(topic, emoji, group, initialData)
                return id
              }}
              onUpdate={async (id, data) => {
                await handleUpdateMindMap(id, data)
              }}
              onAIStreamFinished={async (id, data) => {
                // Force a final save and update when AI streaming finishes
                await handleUpdateMindMap(id, data, true)
              }}
              trigger={(
                <SidebarMenuButton size="sm" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  创建思维导图
                </SidebarMenuButton>
              )}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <MindMapSidebarMenu
            groups={groups}
            onMindMapClick={handleMindMapClick}
            onRefresh={onRefresh}
          />
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-pointer" asChild>
              <div
                className="flex items-center gap-2"
                onClick={(e) => {
                  const btn = e.currentTarget.querySelector('button[data-slot="theme-toggler-button"]') as HTMLButtonElement
                  if (btn && !btn.contains(e.target as Node)) {
                    btn.click()
                  }
                }}
              >
                <ThemeTogglerButton variant="ghost" className="h-6 w-6" />
                <span className="font-medium">主题切换</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      {user
        ? (
            <NavUser user={{
              name: nickname,
              email: user.email || '',
              avatar,
            }}
            />
          )
        : (
            <div className="p-2">
              <Button variant="outline" className="w-full" onClick={handleLogin}>
                登录
              </Button>
            </div>
          )}
    </Sidebar>
  )
}
