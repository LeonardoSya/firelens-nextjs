'use client'

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { useTranslations } from 'next-intl'
import { Tour, ConfigProvider } from 'antd'
import type { TourProps } from 'antd'

// Import from new split files
import { Msg, Conversation } from './chat-ui/types'
import { ChatIcon, CloseIcon, FireIcon, ArrowUpIcon, PlusIcon, StopIcon } from './chat-ui/icons'
import { MessageBubble } from './chat-ui/message-bubble'
import { useConversationManager } from './chat-ui/use-conversation'

// Ant Design Tour 主题配置 - 匹配项目的深色橙色风格
const tourTheme = {
  token: {
    colorPrimary: '#ea580c', // orange-600
    colorBgElevated: '#1f2937', // gray-800 - 弹出层背景
    colorText: '#f3f4f6', // gray-100
    colorTextSecondary: '#9ca3af', // gray-400
    colorTextTertiary: '#6b7280', // gray-500
    colorBorder: '#374151', // gray-700
    borderRadius: 12,
  },
  components: {
    Tour: {
      colorBgContainer: '#1f2937', // gray-800 - 内容背景
      colorBgElevated: '#1f2937', // gray-800
      colorText: '#f9fafb', // gray-50
      colorTextDescription: '#d1d5db', // gray-300
      colorPrimary: '#ea580c', // orange-600
      colorPrimaryHover: '#f97316', // orange-500
      borderRadiusLG: 16,
    },
  },
}

const EMPTY_MSGS: Msg[] = []

// 窗口尺寸常量
const MIN_WIDTH = 600
const MIN_HEIGHT = 720
// 默认尺寸为屏幕百分比
const DEFAULT_WIDTH_PERCENT = 0.55 // 屏幕宽度的55%
const DEFAULT_HEIGHT_PERCENT = 0.75 // 屏幕高度的85%

// 计算默认尺寸的辅助函数
const getDefaultSize = () => {
  if (typeof window === 'undefined') {
    return { width: 1000, height: 800 }
  }
  const width = Math.max(MIN_WIDTH, Math.floor(window.innerWidth * DEFAULT_WIDTH_PERCENT))
  const height = Math.max(MIN_HEIGHT, Math.floor(window.innerHeight * DEFAULT_HEIGHT_PERCENT))
  return { width, height }
}

// --- Main Chat Component ---
const Chat: React.FC = () => {
  const t = useTranslations('chat')
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Tour 引导相关
  const fabRef = useRef<HTMLButtonElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  // Tour 步骤配置
  const tourSteps: TourProps['steps'] = [
    {
      title: '🔥 Firelens AI Agent',
      description: 'Firelens 智能代理全新上线！立刻开始提问任何关于火情的监测、预测问题',
      target: () => fabRef.current,
      placement: 'left',
      nextButtonProps: {
        children: '立即体验',
      },
    },
    {
      title: '💬 开始对话',
      description:
        '在输入框发起提问，或直接点击预设的问题快速开始。在左侧新建对话和查询历史记录，窗口大小可自由拖动。立刻和 Firelens 开始对话吧～',
      target: () => chatWindowRef.current,
      placement: 'left',
      prevButtonProps: {
        style: { display: 'none' },
      },
      nextButtonProps: {
        children: '我知道了',
      },
    },
  ]

  // 检查是否需要显示引导
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('firelens-chat-tour-seen')
    if (!hasSeenTour) {
      // 延迟显示，等待页面渲染完成
      const timer = setTimeout(() => {
        setTourOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // 处理 Tour 步骤变化
  const handleTourChange = (current: number) => {
    // 当进入第二步时，自动打开对话窗口
    if (current === 1 && !isOpen) {
      setIsOpen(true)
      // 先隐藏 Tour，等待窗口动画完成后再显示
      setTourOpen(false)
      setTimeout(() => {
        setTourStep(current)
        setTourOpen(true)
      }, 300) // 等待动画完成
    } else {
      setTourStep(current)
    }
  }

  // 处理 Tour 关闭
  const handleTourClose = () => {
    setTourOpen(false)
    localStorage.setItem('firelens-chat-tour-seen', 'true')
  }

  // 窗口尺寸状态
  const [windowWidth, setWindowWidth] = useState(() => getDefaultSize().width)
  const [windowHeight, setWindowHeight] = useState(() => getDefaultSize().height)
  const [resizeType, setResizeType] = useState<'width' | 'height' | 'corner' | null>(null)
  const resizeRef = useRef<{
    startX: number,
    startY: number,
    startWidth: number,
    startHeight: number,
  } | null>(null)

  // 侧边栏折叠状态
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  // 拖拽调整宽度的处理函数
  const handleWidthResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setResizeType('width')
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: windowWidth,
        startHeight: windowHeight,
      }
    },
    [windowWidth, windowHeight],
  )

  // 拖拽调整高度的处理函数
  const handleHeightResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setResizeType('height')
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: windowWidth,
        startHeight: windowHeight,
      }
    },
    [windowWidth, windowHeight],
  )

  // 拖拽调整左上角（同时调整宽高）
  const handleCornerResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setResizeType('corner')
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: windowWidth,
        startHeight: windowHeight,
      }
    },
    [windowWidth, windowHeight],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeType || !resizeRef.current) return

      const maxWidth = window.innerWidth - 48
      const maxHeight = window.innerHeight - 48

      if (resizeType === 'width' || resizeType === 'corner') {
        // 向左拖动增加宽度（因为窗口在右下角）
        const deltaX = resizeRef.current.startX - e.clientX
        const newWidth = Math.max(MIN_WIDTH, resizeRef.current.startWidth + deltaX)
        const finalWidth = Math.min(newWidth, maxWidth)
        setWindowWidth(finalWidth)
        // 宽度小于600px时自动折叠侧边栏
        if (finalWidth < 600) {
          setIsSidebarCollapsed(true)
        }
      }

      if (resizeType === 'height' || resizeType === 'corner') {
        // 向上拖动增加高度（因为窗口在右下角）
        const deltaY = resizeRef.current.startY - e.clientY
        const newHeight = Math.max(MIN_HEIGHT, resizeRef.current.startHeight + deltaY)
        setWindowHeight(Math.min(newHeight, maxHeight))
      }
    }

    const handleMouseUp = () => {
      setResizeType(null)
      resizeRef.current = null
    }

    if (resizeType) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // 防止选中文本
      document.body.style.userSelect = 'none'
      // 根据拖拽类型设置光标
      document.body.style.cursor =
        resizeType === 'corner' ? 'nwse-resize' : resizeType === 'width' ? 'ew-resize' : 'ns-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [resizeType])

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={fabRef}
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
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ width: windowWidth, height: windowHeight }}
            className='fixed bottom-6 right-12 z-50 flex max-h-[calc(100vh-3rem)] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl bg-white font-sans shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10'
          >
            {/* 左上角拖拽手柄（同时调整宽高） */}
            <div
              onMouseDown={handleCornerResizeStart}
              className={`absolute left-0 top-0 z-20 h-4 w-4 cursor-nwse-resize ${resizeType === 'corner' ? 'bg-orange-500/50' : 'bg-transparent'}`}
              title='拖拽调整大小'
            />
            {/* 左侧拖拽手柄（调整宽度） */}
            <div
              onMouseDown={handleWidthResizeStart}
              className={`absolute left-0 top-4 z-10 h-[calc(100%-1rem)] w-1.5 cursor-ew-resize transition-colors hover:bg-orange-500/30 ${resizeType === 'width' ? 'bg-orange-500/50' : 'bg-transparent'}`}
              title='拖拽调整宽度'
            >
              {/* 视觉指示器 */}
              <div className='absolute left-0.5 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-full bg-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-600' />
            </div>
            {/* 顶部拖拽手柄（调整高度） */}
            <div
              onMouseDown={handleHeightResizeStart}
              className={`absolute left-4 right-0 top-0 z-10 h-1.5 w-[calc(100%-1rem)] cursor-ns-resize transition-colors hover:bg-orange-500/30 ${resizeType === 'height' ? 'bg-orange-500/50' : 'bg-transparent'}`}
              title='拖拽调整高度'
            />
            {/* Sidebar (Left) */}
            <motion.div
              className='flex flex-shrink-0 flex-col border-r border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50'
              animate={{ width: isSidebarCollapsed ? 48 : 256 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {/* Header */}
              <div className='flex h-14 items-center justify-between border-b border-gray-100 px-2 dark:border-gray-800'>
                {/* 折叠/展开按钮 */}
                <motion.button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className='rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                  title={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
                >
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                    />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {!isSidebarCollapsed && (
                    <>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: 0.1 }}
                        className='text-xs font-bold uppercase tracking-wider text-gray-500'
                      >
                        {t('history')}
                      </motion.span>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={createNewConversation}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className='rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        title={t('newChat')}
                      >
                        <PlusIcon className='h-4 w-4' />
                      </motion.button>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* 折叠状态下的新建按钮 */}
              {isSidebarCollapsed && (
                <div className='flex flex-col items-center gap-2 p-2'>
                  <motion.button
                    onClick={createNewConversation}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className='rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    title={t('newChat')}
                  >
                    <PlusIcon className='h-4 w-4' />
                  </motion.button>
                </div>
              )}

              {/* List - 展开状态 */}
              {!isSidebarCollapsed && (
                <div className='flex-1 space-y-1 overflow-y-auto p-2'>
                  {conversations.map(conv => {
                    const isConvLoading = conv.status === 'loading' || conv.status === 'streaming'
                    return (
                      <div
                        key={conv.id}
                        role='button'
                        tabIndex={0}
                        onClick={() => setCurrentConvId(conv.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setCurrentConvId(conv.id)
                          }
                        }}
                        className={`group relative w-full cursor-pointer rounded-lg px-3 py-3 text-left text-sm transition-all ${
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
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 折叠状态下的对话列表（只显示图标） */}
              {isSidebarCollapsed && (
                <div className='flex-1 space-y-1 overflow-y-auto p-1'>
                  {conversations.map(conv => {
                    const isConvLoading = conv.status === 'loading' || conv.status === 'streaming'
                    return (
                      <div
                        key={conv.id}
                        role='button'
                        tabIndex={0}
                        onClick={() => setCurrentConvId(conv.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setCurrentConvId(conv.id)
                          }
                        }}
                        className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all ${
                          currentConvId === conv.id
                            ? 'bg-gray-100 text-orange-600 dark:bg-gray-800 dark:text-orange-400'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title={conv.title}
                      >
                        {isConvLoading ? (
                          <span className='relative flex h-2 w-2'>
                            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75' />
                            <span className='relative inline-flex h-2 w-2 rounded-full bg-orange-500' />
                          </span>
                        ) : (
                          <svg
                            className='h-4 w-4'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                            />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

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

      {/* Tour 漫游式引导 */}
      <ConfigProvider theme={tourTheme}>
        <Tour
          open={tourOpen}
          onClose={handleTourClose}
          steps={tourSteps}
          current={tourStep}
          onChange={handleTourChange}
          zIndex={9999}
          rootClassName='firelens-tour'
        />
      </ConfigProvider>
    </>
  )
}

export default Chat
