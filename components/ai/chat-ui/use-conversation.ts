'use client'

import { useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { BASE_URL } from '@/lib/api'
import { Conversation, Msg, ChartData, isTextChunkEvent, isWorkflowFinishedEvent } from './types'

type ConversationUpdater = (id: string, updater: (conv: Conversation) => Conversation) => void

/**
 * 管理单个对话的生命周期
 * 每个对话有独立的 AbortController，支持取消请求
 */
export function useConversationManager(updateConversation: ConversationUpdater) {
  // 存储每个对话的 AbortController
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  /** 取消指定对话的请求 */
  const cancelRequest = useCallback((convId: string) => {
    const controller = abortControllersRef.current.get(convId)
    if (controller) {
      controller.abort()
      abortControllersRef.current.delete(convId)
    }
  }, [])

  /** 取消所有正在进行的请求 */
  const cancelAllRequests = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort())
    abortControllersRef.current.clear()
  }, [])

  /** 发送消息到指定对话 */
  const sendMessage = useCallback(
    async (convId: string, text: string) => {
      if (!text.trim()) return

      // 取消该对话之前的请求（如果有）
      cancelRequest(convId)

      // 创建新的 AbortController
      const controller = new AbortController()
      abortControllersRef.current.set(convId, controller)

      // 1. 添加用户消息
      const userMsg: Msg = {
        id: uuidv4(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }

      const agentMsgId = uuidv4()

      updateConversation(convId, conv => {
        const title = conv.messages.length === 0 ? text.slice(0, 20) : conv.title
        return {
          ...conv,
          title,
          messages: [...conv.messages, userMsg],
          status: 'loading',
          updatedAt: Date.now(),
        }
      })

      // 2. 添加 Agent 占位消息
      const agentMsg: Msg = {
        id: agentMsgId,
        role: 'agent',
        content: '',
        timestamp: Date.now(),
      }

      updateConversation(convId, conv => ({
        ...conv,
        messages: [...conv.messages, agentMsg],
        status: 'streaming',
        streamingMsgId: agentMsgId,
      }))

      try {
        const res = await fetch(`${BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, user: 'test-user' }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) throw new Error('Failed to get response')

        const reader = res.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let isDeepSeekThinking = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const boundary = '\n\n'

          while (buffer.includes(boundary)) {
            const completeMsg = buffer.substring(0, buffer.indexOf(boundary))
            buffer = buffer.substring(buffer.indexOf(boundary) + boundary.length)

            if (completeMsg.startsWith('data: ')) {
              try {
                const event = JSON.parse(completeMsg.substring(6)) as { event: string }

                // 处理文本块事件
                if (isTextChunkEvent(event)) {
                  const { text, reasoning_content } = event.data

                  let contentToAdd = ''
                  let reasoningToAdd = reasoning_content || ''

                  if (text) {
                    let processingText = text

                    // 检测 <think> 开始标签
                    if (!isDeepSeekThinking && processingText.includes('<think>')) {
                      isDeepSeekThinking = true
                      const parts = processingText.split('<think>')
                      contentToAdd += parts[0]
                      processingText = parts[1] || ''
                    }

                    // 检测 </think> 结束标签
                    if (isDeepSeekThinking && processingText.includes('</think>')) {
                      isDeepSeekThinking = false
                      const parts = processingText.split('</think>')
                      reasoningToAdd += parts[0]
                      contentToAdd += parts[1] || ''
                    } else if (isDeepSeekThinking) {
                      reasoningToAdd += processingText
                    } else {
                      contentToAdd += processingText
                    }
                  }

                  updateConversation(convId, conv => ({
                    ...conv,
                    messages: conv.messages.map(msg => {
                      if (msg.id === agentMsgId) {
                        const currentReasoning = (msg.reasoning || '') + reasoningToAdd
                        const currentContent = msg.content + contentToAdd
                        const isThinking =
                          isDeepSeekThinking || (!!reasoning_content && !contentToAdd)

                        return {
                          ...msg,
                          content: currentContent,
                          reasoning: currentReasoning,
                          isThinking: isThinking,
                        }
                      }
                      return msg
                    }),
                  }))
                }

                // 处理工作流结束事件 - 捕获图表数据
                if (isWorkflowFinishedEvent(event)) {
                  const outputs = event.data?.outputs
                  if (outputs?.chart_data) {
                    try {
                      // 二次解析：chart_data 是 JSON 字符串
                      const chartData: ChartData = JSON.parse(outputs.chart_data)
                      console.log('📊 Captured chart data:', chartData)

                      updateConversation(convId, conv => ({
                        ...conv,
                        messages: conv.messages.map(msg => {
                          if (msg.id === agentMsgId) {
                            // 从内容中移除 chart_data JSON 字符串
                            // Dify 会将 chart_data 作为文本输出，需要清理
                            let cleanedContent = msg.content

                            // 移除 JSON 对象格式的 chart_data（可能以 { 开头）
                            // 匹配 {"analysis_valid"... 开头的 JSON 块
                            const jsonPattern = /\{"analysis_valid"[\s\S]*$/
                            cleanedContent = cleanedContent.replace(jsonPattern, '').trim()

                            return {
                              ...msg,
                              content: cleanedContent,
                              chartData: chartData,
                            }
                          }
                          return msg
                        }),
                      }))
                    } catch (parseErr) {
                      console.error('Failed to parse chart_data:', parseErr)
                    }
                  }
                }
              } catch (err) {
                console.error('Parse error:', err)
              }
            }
          }
        }

        // 完成流式响应
        updateConversation(convId, conv => ({
          ...conv,
          status: 'idle',
          streamingMsgId: undefined,
        }))
      } catch (err) {
        // 检查是否是用户主动取消
        if (err instanceof Error && err.name === 'AbortError') {
          updateConversation(convId, conv => ({
            ...conv,
            status: 'idle',
            streamingMsgId: undefined,
            messages: conv.messages.map(msg =>
              msg.id === agentMsgId && !msg.content ? { ...msg, content: '请求已取消' } : msg,
            ),
          }))
          return
        }

        console.error('Send message error:', err)
        updateConversation(convId, conv => ({
          ...conv,
          status: 'error',
          streamingMsgId: undefined,
          messages: conv.messages.map(msg =>
            msg.id === agentMsgId ? { ...msg, content: '错误：获取响应失败' } : msg,
          ),
        }))
      } finally {
        abortControllersRef.current.delete(convId)
      }
    },
    [updateConversation, cancelRequest],
  )

  /** 检查指定对话是否正在加载 */
  const isConversationLoading = useCallback((convId: string) => {
    return abortControllersRef.current.has(convId)
  }, [])

  return {
    sendMessage,
    cancelRequest,
    cancelAllRequests,
    isConversationLoading,
  }
}
