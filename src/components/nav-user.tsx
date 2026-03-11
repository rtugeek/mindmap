import { AppApi } from '@widget-js/core'
import { ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useMindMapStore } from '@/store/mind-map-store'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const lastSyncTime = useMindMapStore(state => state.lastSyncTime)
  const [timeDisplay, setTimeDisplay] = useState('')

  useEffect(() => {
    const updateTime = () => {
      if (!lastSyncTime) {
        setTimeDisplay('等待同步...')
        return
      }
      const now = new Date()
      const diff = now.getTime() - lastSyncTime.getTime()
      if (diff < 60000) {
        setTimeDisplay('刚刚同步')
      }
      else if (diff < 3600000) {
        setTimeDisplay(`${Math.floor(diff / 60000)}分钟前同步`)
      }
      else {
        setTimeDisplay(`上次同步 ${lastSyncTime.toLocaleTimeString()}`)
      }
    }

    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [lastSyncTime])

  const handleLogin = () => {
    AppApi.showAppWindow('/user/profile')
  }

  const handleShowProfile = () => {
    AppApi.showAppWindow('/user/profile')
  }

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            onClick={() => {
              if (user.email) {
                handleShowProfile()
              }
              else {
                handleLogin()
              }
            }}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{timeDisplay}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
