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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: Msg = { role: 'user', content: input }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    setMsgs(prev => [...prev, { role: 'agent', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
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

  return (
    <div>
      {msgs.map((msg, index) => (
        <div key={index}>{msg.content || '...'}</div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          type='text'
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
          placeholder='please input ~~'
        />
        <button type='submit' disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default Chat
