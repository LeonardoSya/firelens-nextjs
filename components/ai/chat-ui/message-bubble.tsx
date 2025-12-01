'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Msg } from './types'
import { ThinkingBlock } from './thinking-block'
import { useTranslations } from 'next-intl'

export const MessageBubble = ({ msg }: { msg: Msg }) => {
  const t = useTranslations('chat')
  const isUser = msg.role === 'user'
  const hasContent = !!msg.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[90%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Thinking Block (Only for Agent) */}
        {!isUser && msg.reasoning && (
          <div className='mb-1 w-full min-w-[300px]'>
            <ThinkingBlock
              reasoning={msg.reasoning}
              isThinking={!!msg.isThinking}
              isFinished={hasContent}
            />
          </div>
        )}

        {/* Main Content Bubble */}
        <div
          className={`relative px-4 py-3 text-sm shadow-sm ${
            isUser
              ? 'rounded-2xl rounded-br-none bg-orange-600 text-white'
              : 'w-full rounded-2xl rounded-bl-none border border-gray-100 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
          }`}
        >
          <div
            className={`whitespace-pre-wrap break-words leading-5 ${!isUser && !msg.content && !msg.reasoning ? 'italic text-gray-400' : ''}`}
          >
            {isUser ? (
              msg.content
            ) : (
              <div className='prose-xs prose max-w-none leading-3 dark:prose-invert prose-headings:my-0 prose-p:my-0 prose-p:leading-6 prose-pre:my-0 prose-ol:my-0 prose-ul:my-0 prose-li:my-1 prose-li:leading-6 prose-hr:my-1'>
                <ReactMarkdown>{msg.content.replace(/\n{2,}/g, '\n')}</ReactMarkdown>
              </div>
            )}

            {!isUser && !msg.content && !msg.reasoning && (
              <div className='flex items-center gap-3'>
                {/* loading animation */}
                <div className='flex items-center gap-1.5'>
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className='h-2 w-2 rounded-full bg-orange-500'
                      animate={{
                        y: [0, -4, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        repeatDelay: 1,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  {t('agentPreparing')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
