'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { ThinkingIcon, BulbIcon, ChevronIcon } from './icons'
import { useTranslations } from 'next-intl'

export const ThinkingBlock = ({
  reasoning,
  isThinking,
  isFinished,
}: {
  reasoning: string,
  isThinking: boolean,
  isFinished: boolean,
}) => {
  const t = useTranslations('chat')
  const [isExpanded, setIsExpanded] = useState(isThinking)

  useEffect(() => {
    if (isThinking) {
      setIsExpanded(true)
    } else if (isFinished) {
      setIsExpanded(false)
    }
  }, [isThinking, isFinished])

  return (
    <div className='my-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50'>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      >
        <div className='flex items-center gap-2'>
          {isThinking ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <ThinkingIcon className='h-3 w-3' />
            </motion.div>
          ) : (
            <BulbIcon className='h-3 w-3 text-orange-500' />
          )}
          <span>{isThinking ? t('thinking') : t('deepThinking')}</span>
        </div>
        <ChevronIcon
          className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className='max-h-[300px] overflow-y-auto whitespace-pre-wrap break-words border-t border-gray-200 px-4 py-3 font-mono text-xs leading-relaxed text-gray-600 dark:border-gray-700 dark:text-gray-300'>
              <div className='prose-xs prose max-w-none dark:prose-invert prose-headings:my-0 prose-p:my-0 prose-pre:my-0 prose-ol:my-0 prose-ul:my-0 prose-li:my-0'>
                <ReactMarkdown>{reasoning.replace(/\n{2,}/g, '\n')}</ReactMarkdown>
              </div>
              {isThinking && (
                <span className='ml-1 inline-block h-3 w-1.5 animate-pulse bg-orange-500 align-middle' />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
