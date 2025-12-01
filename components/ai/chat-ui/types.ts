export interface Msg {
  id: string
  role: 'user' | 'agent'
  content: string
  reasoning?: string
  isThinking?: boolean
  timestamp: number
}

/** 对话状态 */
export type ConversationStatus = 'idle' | 'loading' | 'streaming' | 'error'

export interface Conversation {
  id: string
  title: string
  messages: Msg[]
  updatedAt: number
  /** 独立的对话状态 */
  status: ConversationStatus
  /** 当前正在流式输出的消息 ID */
  streamingMsgId?: string
}

export interface DifyTextChunkEvent {
  event: 'text_chunk' | 'workflow_finished' | 'message_end'
  data: {
    text: string
    reasoning_content?: string
  }
  workflow_run_id: string
  task_id: string
}
