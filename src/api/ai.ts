import { supabase } from '@/api/supabase'
import request from '@/lib/request'

export interface AiTokenHistory {
  id: string
  user_id: string
  change_amount: number
  token_remain_after: number | null
  model: string | null
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  cost: number | null
  request_type: string | null
  input_token_details: any | null
  output_token_details: any | null
  raw_usage: any | null
  related_id: string | null
  remark: string | null
  create_time: string
  sourcePackage?: string | null
  sourcePackageName?: string | null
}

export interface AiTokenPackage {
  id: string
  name: string
  userId: string
  maxToken: number
  usedToken: number
  expireTime: string | null
  createTime: string
  productId: number | null
  enable: boolean | null
  updateTime: string | null
}

interface PaginationResult<T> {
  data: T[]
  page: string | number
  pageSize: string | number
  totalPage: number
  total: number
}

export interface CreateAiDto {
  systemPrompt: string
  userPrompt: string
  model?: string
  remark?: string
  metadata?: Record<string, any>
}

export const AiApi = {
  async getPackages(params?: { page?: number, limit?: number }): Promise<{ items: AiTokenPackage[], total: number }> {
    const res = await request.get('/ai/package', { params })
    const data = res as unknown as PaginationResult<AiTokenPackage>
    return {
      items: data.data,
      total: data.total,
    }
  },

  async getUsage(params?: { page?: number, limit?: number }): Promise<{ items: AiTokenHistory[], total: number }> {
    const res = await request.get('/ai/usage', { params })
    const data = res as unknown as PaginationResult<AiTokenHistory>
    return {
      items: data.data,
      total: data.total,
    }
  },
  async postStream(
    params: CreateAiDto,
    onMessage: (text: string) => void,
    onDone?: () => void,
    onError?: (err: any) => void,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    try {
      const url = 'https://widgetjs.cn/api/v1/ai/stream'
      // const url = 'http://127.0.0.1:3000/api/v1/ai/stream'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(params),
        signal: abortSignal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      if (!response.body) {
        throw new Error('Response body is empty')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          onDone?.()
          break
        }
        const chunk = decoder.decode(value, { stream: true })
        onMessage(chunk)
      }
    }
    catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      onError?.(error)
      throw error
    }
  },
}
