'use client'

import { useState, FormEvent } from 'react'

interface Msg {
  role: 'user' | 'agent';
  content: string;
}

interface DifyTextChunkEvent {
  event: 'text_chunk',
  data: {
    text: string;
  }
  workflow_run_id:string
  task_id: string;
}

const Chat: React.FC = () => {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const hasMsgs = msgs.length > 0

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Msg = { role: 'user', content: text }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    setMsgs(prev => [...prev, { role: 'agent', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          user: 'test-user',
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error('Failed to get response')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')

      let buffer = ''

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
              const event: DifyTextChunkEvent = JSON.parse(completeMsg.substring(6))

              if (event.event === 'text_chunk') {
                const chunk = event.data.text
                if (chunk) {
                  setMsgs(prev => {
                    const lastMsg = prev[prev.length - 1]
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMsg, content: lastMsg.content + chunk },
                    ]
                  })
                }
              }
            } catch (err) {
              console.error('Failed to parse JSON chunk: ', err)
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching chat res: ', err)
      setMsgs(prev => {
        const lastMsg = prev[prev.length - 1]
        return [...prev.slice(0, -1), { ...lastMsg, content: 'HandleSubmit Error ~' }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await sendMessage(input)
  }

  return (
    <div className="fixed right-0 top-80 w-[324px] max-h-[60vh] rounded-xl bg-white p-4 shadow-lg dark:bg-gradient-to-t dark:from-gray-900 dark:to-gray-950 z-10 flex flex-col">
      <div className='mb-3 flex items-center gap-x-3 px-1'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-auto w-6'
          viewBox='0 0 512 512'
          style={{ fill: 'rgb(194,65,12)' }}
        >
          <path d='M390.42 75.28a10.45 10.45 0 01-5.32-1.44C340.72 50.08 302.35 40 256.35 40c-45.77 0-89.23 11.28-128.76 33.84C122 77 115.11 74.8 111.87 69a12.4 12.4 0 014.63-16.32A281.81 281.81 0 01256.35 16c49.23 0 92.23 11.28 139.39 36.48a12 12 0 014.85 16.08 11.3 11.3 0 01-10.17 6.72zm-330.79 126a11.73 11.73 0 01-6.7-2.16 12.26 12.26 0 01-2.78-16.8c22.89-33.6 52-60 86.69-78.48 72.58-38.84 165.51-39.12 238.32-.24 34.68 18.48 63.8 44.64 86.69 78a12.29 12.29 0 01-2.78 16.8 11.26 11.26 0 01-16.18-2.88c-20.8-30.24-47.15-54-78.36-70.56-66.34-35.28-151.18-35.28-217.29.24-31.44 16.8-57.79 40.8-78.59 71a10 10 0 01-9.02 5.08zM204.1 491a10.66 10.66 0 01-8.09-3.6C175.9 466.48 165 453 149.55 424c-16-29.52-24.27-65.52-24.27-104.16 0-71.28 58.71-129.36 130.84-129.36S387 248.56 387 319.84a11.56 11.56 0 11-23.11 0c0-58.08-48.32-105.36-107.72-105.36S148.4 261.76 148.4 319.84c0 34.56 7.39 66.48 21.49 92.4 14.8 27.6 25 39.36 42.77 58.08a12.67 12.67 0 010 17 12.44 12.44 0 01-8.56 3.68zm165.75-44.4c-27.51 0-51.78-7.2-71.66-21.36a129.1 129.1 0 01-55-105.36 11.57 11.57 0 1123.12 0 104.28 104.28 0 0044.84 85.44c16.41 11.52 35.6 17 58.72 17a147.41 147.41 0 0024-2.4c6.24-1.2 12.25 3.12 13.4 9.84a11.92 11.92 0 01-9.47 13.92 152.28 152.28 0 01-27.95 2.88zM323.38 496a13 13 0 01-3-.48c-36.76-10.56-60.8-24.72-86-50.4-32.37-33.36-50.16-77.76-50.16-125.28 0-38.88 31.9-70.56 71.19-70.56s71.2 31.68 71.2 70.56c0 25.68 21.5 46.56 48.08 46.56s48.08-20.88 48.08-46.56c0-90.48-75.13-163.92-167.59-163.92-65.65 0-125.75 37.92-152.79 96.72-9 19.44-13.64 42.24-13.64 67.2 0 18.72 1.61 48.24 15.48 86.64 2.32 6.24-.69 13.2-6.7 15.36a11.34 11.34 0 01-14.79-7 276.39 276.39 0 01-16.88-95c0-28.8 5.32-55 15.72-77.76 30.75-67 98.94-110.4 173.6-110.4 105.18 0 190.71 84.24 190.71 187.92 0 38.88-31.9 70.56-71.2 70.56s-71.2-31.68-71.2-70.56c.01-25.68-21.49-46.6-48.07-46.6s-48.08 20.88-48.08 46.56c0 41 15.26 79.44 43.23 108.24 22 22.56 43 35 75.59 44.4 6.24 1.68 9.71 8.4 8.09 14.64a11.39 11.39 0 01-10.87 9.16z' />
        </svg>
        <span className=' text-lg font-bold tracking-tight text-neutral-700 dark:text-neutral-200'>
          Firelens AI Agent
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {hasMsgs ? (
          <div className="space-y-4">
            {msgs.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 whitespace-pre-wrap break-words text-sm ${
                    msg.role === 'user'
                      ? 'bg-[rgb(194,65,12)] text-white'
                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  {msg.content || (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 mr-2" style={{ borderColor: 'rgb(194,65,12)' }}></div>
                      思考中...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="select-none">
            <h3 className="mb-2 text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
              向 Firelens AI Agent 询问任何你想知道的火灾信息
            </h3>
            <p className="mb-3 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
              Firelens AI 基于 DeepSeek-V3.1 和 通义千问-plus，让你以自然语言交互的形式，快速了解世界上任意角落发生的热点数据。
            </p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => { const t = '最近72小时内，北京周边是否有火点风险？'; setInput(t); sendMessage(t); }} className="rounded-full border border-gray-800/40 px-3 py-2 text-left text-xs leading-5 text-neutral-700 hover:bg-gray-900 hover:text-white dark:border-gray-700 dark:text-neutral-300 whitespace-normal break-words">
                最近72小时内，北京周边是否有火点风险？
              </button>
              <button type="button" onClick={() => { const t = '帮我分析内蒙古东部今日风向与火点关系'; setInput(t); sendMessage(t); }} className="rounded-full border border-gray-800/40 px-3 py-2 text-left text-xs leading-5 text-neutral-700 hover:bg-gray-900 hover:text-white dark:border-gray-700 dark:text-neutral-300 whitespace-normal break-words">
                帮我分析内蒙古东部今日风向与火点关系
              </button>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className={hasMsgs ? "mt-3 border-t pt-3" : "mt-3"} style={hasMsgs ? { borderColor: 'rgb(194,65,12)' } : undefined}>
        <div className="flex space-x-2">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              const lineHeight = 20 
              const padding = 16
              const maxRows = 8
              const contentHeight = Math.max(0, el.scrollHeight - padding)
              const rows = Math.min(maxRows, Math.max(1, Math.ceil(contentHeight / lineHeight)))
              el.style.height = `${rows * lineHeight + padding}px`
            }}
            disabled={isLoading}
            placeholder='Hi, Firelens'
            className="flex-grow px-3 py-2 text-sm leading-5 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 resize-none overflow-y-auto"
          />
          <button
            type='submit'
            disabled={isLoading}
            className="px-3 py-2 text-sm rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'rgb(194,65,12)', color: 'white' }}
          >
            {isLoading ? '思考中...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Chat
