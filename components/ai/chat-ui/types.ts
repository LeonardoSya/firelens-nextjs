export interface Msg {
  id: string
  role: 'user' | 'agent'
  content: string
  reasoning?: string
  isThinking?: boolean
  timestamp: number
  /** 图表数据（从 workflow_finished 事件中解析） */
  chartData?: ChartData
}

/** 趋势图数据点 */
export interface TrendDataPoint {
  scan_time: string
  count: number
  energy: number
}

/** 散点图数据点 */
export interface ScatterDataPoint {
  frp: number
  ndvi: number
  confidence: 'low' | 'nominal' | 'high'
  latitude?: number
  longitude?: number
}

/** 文本报告摘要 */
export interface TextReport {
  count: number
  max_frp: number
  total_fuel_kg_s: number
  angstrom_index: number
  risk_level: string
  wind_speed: number
}

/** 图表数据结构 */
export interface ChartData {
  analysis_valid: boolean
  text_report: TextReport
  viz_data: {
    trend_chart: TrendDataPoint[]
    scatter_chart: ScatterDataPoint[]
  }
  debug_info?: string
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

/** Dify SSE 事件：文本块 */
export interface DifyTextChunkEvent {
  event: 'text_chunk'
  data: {
    text: string
    reasoning_content?: string
  }
  workflow_run_id: string
  task_id: string
}

/** Dify SSE 事件：工作流结束 */
export interface DifyWorkflowFinishedEvent {
  event: 'workflow_finished'
  data: {
    id: string
    workflow_id: string
    status: string
    outputs: {
      /** 图表数据（JSON 字符串，需要二次解析） */
      chart_data?: string
      [key: string]: unknown
    }
    elapsed_time: number
    total_tokens: number
    total_steps: number
    created_at: number
    finished_at: number
  }
  workflow_run_id: string
  task_id: string
}

/** Dify SSE 事件联合类型 */
export type DifySSEEvent = DifyTextChunkEvent | DifyWorkflowFinishedEvent

/** 类型守卫：判断是否为文本块事件 */
export function isTextChunkEvent(event: { event: string }): event is DifyTextChunkEvent {
  return event.event === 'text_chunk'
}

/** 类型守卫：判断是否为工作流结束事件 */
export function isWorkflowFinishedEvent(event: {
  event: string
}): event is DifyWorkflowFinishedEvent {
  return event.event === 'workflow_finished'
}
