'use client'

import { useState, FormEvent } from 'react'

interface Msg {
  role: 'user' | 'agent';
  content: string;
}

interface IProps {}

const Chat: React.FC<IProps> = () => {
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

      // stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.substring(6))
              if (jsonData.event === 'agent_message' || jsonData.event === 'message') {
                const answerChunk = jsonData.answer
                setMsgs(prev => {
                  const lastMsg = prev[prev.length - 1]
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, content: lastMsg.content + answerChunk },
                  ]
                })
              }
            } catch (err) {
              console.error('err: ', err)
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
