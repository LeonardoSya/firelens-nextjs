'use client'

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { useTranslations } from 'next-intl'

// Import from new split files
import { Msg, Conversation } from './chat-ui/types'
import { ChatIcon, CloseIcon, FireIcon, ArrowUpIcon, PlusIcon, StopIcon } from './chat-ui/icons'
import { MessageBubble } from './chat-ui/message-bubble'
import { useConversationManager } from './chat-ui/use-conversation'

const EMPTY_MSGS: Msg[] = []

// --- Main Chat Component ---
const Chat: React.FC = () => {
  const t = useTranslations('chat')
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const SUGGESTED_PROMPTS = [t('prompts.p1'), t('prompts.p2')]

  const updateConversation = useCallback(
    (id: string, updater: (conv: Conversation) => Conversation) => {
      setConversations(prev => prev.map(c => (c.id === id ? updater(c) : c)))
    },
    [],
  )

  // 使用对话管理 hook
  const { sendMessage, cancelRequest, cancelAllRequests } =
    useConversationManager(updateConversation)

  // Initialize with one conversation if empty
  useEffect(() => {
    if (conversations.length === 0) {
      const newConv: Conversation = {
        id: uuidv4(),
        title: t('newChat'),
        messages: [],
        updatedAt: Date.now(),
        status: 'idle',
      }
      setConversations([newConv])
      setCurrentConvId(newConv.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 清理：组件卸载时取消所有请求
  useEffect(() => {
    return () => {
      cancelAllRequests()
    }
  }, [cancelAllRequests])

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: t('newChat'),
      messages: [],
      updatedAt: Date.now(),
      status: 'idle',
    }
    setConversations(prev => [newConv, ...prev])
    setCurrentConvId(newConv.id)
    return newConv.id
  }, [t])

  const currentConversation = conversations.find(c => c.id === currentConvId) || conversations[0]
  const msgs = currentConversation?.messages || EMPTY_MSGS
  // 当前对话是否正在加载（独立状态）
  const isLoading =
    currentConversation?.status === 'loading' || currentConversation?.status === 'streaming'

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, isOpen, currentConvId])

  const deleteConversation = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      // 删除对话时，取消该对话的请求
      cancelRequest(id)
      setConversations(prev => {
        const newConvs = prev.filter(c => c.id !== id)
        // If we deleted the current conversation, switch to the first one or create a new one
        if (id === currentConvId) {
          if (newConvs.length > 0) {
            setCurrentConvId(newConvs[0].id)
          } else {
            // If all deleted, creating a new one will happen in useEffect if we rely on length=0,
            // but better to do it explicitly or let the effect handle it.
            // The existing effect handles length === 0.
            setCurrentConvId(null) // This will trigger the effect to create a new one
          }
        }
        return newConvs
      })
    },
    [currentConvId, cancelRequest],
  )

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !currentConvId) return
      setInput('')
      await sendMessage(currentConvId, text)
    },
    [currentConvId, isLoading, sendMessage],
  )

  const handleStopGeneration = useCallback(() => {
    if (currentConvId) {
      cancelRequest(currentConvId)
    }
  }, [currentConvId, cancelRequest])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await handleSendMessage(input)
  }

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className='fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-xl shadow-orange-600/30 hover:bg-orange-700 focus:outline-none'
          >
            <ChatIcon className='h-7 w-7' />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='fixed bottom-6 right-6 z-50 flex h-[700px] w-[900px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white font-sans shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10'
          >
            {/* Sidebar (Left) */}
            <div className='flex w-64 flex-shrink-0 flex-col border-r border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50'>
              {/* Header */}
              <div className='flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800'>
                <span className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                  {t('history')}
                </span>
                <motion.button
                  onClick={createNewConversation}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className='rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  title={t('newChat')}
                >
                  <PlusIcon className='h-4 w-4' />
                </motion.button>
              </div>

              {/* List */}
              <div className='flex-1 space-y-1 overflow-y-auto p-2'>
                {conversations.map(conv => {
                  const isConvLoading = conv.status === 'loading' || conv.status === 'streaming'
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setCurrentConvId(conv.id)}
                      className={`group relative w-full rounded-lg px-3 py-3 text-left text-sm transition-all ${
                        currentConvId === conv.id
                          ? 'bg-gray-100 font-medium text-orange-600 dark:bg-gray-800 dark:text-orange-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className='flex items-center gap-2'>
                        {/* 状态指示器 */}
                        {isConvLoading && (
                          <span className='relative flex h-2 w-2 flex-shrink-0'>
                            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75' />
                            <span className='relative inline-flex h-2 w-2 rounded-full bg-orange-500' />
                          </span>
                        )}
                        <span className='truncate pr-4'>{conv.title}</span>
                      </div>
                      <div className='mt-0.5 font-mono text-[10px] opacity-50'>
                        {new Date(conv.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>

                      {/* Delete Button - Visible on hover or active */}
                      <div
                        className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 ${currentConvId === conv.id ? 'opacity-100' : ''}`}
                      >
                        <button
                          onClick={e => deleteConversation(conv.id, e)}
                          className='rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700'
                          title='Delete Chat'
                        >
                          <CloseIcon className='h-3 w-3' />
                        </button>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chat Area (Right) */}
            <div className='relative flex flex-1 flex-col bg-white dark:bg-gray-900'>
              {/* Chat Header */}
              <div className='flex h-14 items-center justify-between border-b border-gray-100 px-6 dark:border-gray-800'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/20'>
                    <FireIcon className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-sm font-bold text-gray-800 dark:text-white'>
                      {t('title')}
                    </h2>
                    <p className='text-xs text-gray-500'>{t('modelDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                >
                  <CloseIcon className='h-5 w-5' />
                </button>
              </div>

              {/* Messages */}
              <div className='flex-1 space-y-6 overflow-y-auto bg-white p-6 dark:bg-black/10'>
                {msgs.length === 0 ? (
                  <div className='flex h-full flex-col items-center justify-center pb-10 opacity-60'>
                    <FireIcon className='mb-6 h-12 w-12 text-orange-200 dark:text-gray-700' />
                    <h3 className='mb-8 text-xl font-semibold text-gray-700 dark:text-gray-300'>
                      {t('welcome')}
                    </h3>
                    <motion.div
                      className='flex w-full max-w-2xl flex-col gap-3 px-4'
                      initial='hidden'
                      animate='visible'
                      variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.1 } },
                      }}
                    >
                      {SUGGESTED_PROMPTS.map((prompt, i) => (
                        <motion.button
                          key={i}
                          onClick={() => handleSendMessage(prompt)}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          whileHover={{ scale: 1.02, x: 8 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className='rounded-xl border border-gray-100 bg-gray-50 p-4 text-left text-sm leading-relaxed text-gray-600 transition-colors duration-200 hover:border-orange-200 hover:bg-gray-100 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-orange-500'
                          style={{
                            transitionProperty: 'border-color,background-color,box-shadow,color',
                            transitionDuration: '200ms',
                            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', // 符合前摇感受
                          }}
                        >
                          {prompt}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {msgs.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className='border-t border-gray-100 p-4 dark:border-gray-800'>
                <form onSubmit={handleSubmit} className='relative mx-auto max-w-3xl'>
                  <input
                    type='text'
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t('inputPlaceholder')}
                    className='h-12 w-full rounded-full border border-transparent bg-gray-50 pl-5 pr-12 text-sm outline-none ring-0 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:bg-gray-800 dark:text-white dark:focus:border-orange-400'
                  />
                  {isLoading ? (
                    <button
                      type='button'
                      onClick={handleStopGeneration}
                      className='absolute right-2 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600'
                      title={t('stopGeneration') || '停止生成'}
                    >
                      <StopIcon className='h-4 w-4' />
                    </button>
                  ) : (
                    <button
                      type='submit'
                      disabled={!input.trim()}
                      className='absolute right-2 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white transition-colors hover:bg-orange-700 disabled:opacity-50 disabled:hover:bg-orange-600'
                    >
                      <ArrowUpIcon className='h-4 w-4' />
                    </button>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chat
