'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { setFilterParams } from '@/features/filter-slice'
import { RootState } from '@/lib/store'
import RangeInput from '@/components/range-input'
import { useState, useEffect } from 'react'

interface SideMenuProps {
  toggleWindLayer: () => void;
  // toggleHeatLayer?: () => void
}

const SideMenu: React.FC<SideMenuProps> = props => {
  const { toggleWindLayer } = props
  const [isOpen, setIsOpen] = useState(true)

  // 在小屏幕上默认隐藏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const dispatch = useAppDispatch()
  const filterParams = useAppSelector((state: RootState) => state.filter)

  const confidenceOptions = [
    { value: '', label: '全部' },
    { value: 'nominal', label: '一般' },
    { value: 'low', label: '较低' },
    { value: 'high', label: '较高' },
  ]

  const daynightOptions = [
    { value: '', label: '全天' },
    { value: 'D', label: '白天' },
    { value: 'N', label: '晚上' },
  ]
  const handleFilterChange = (key: string, value: unknown) => {
    dispatch(setFilterParams({ [key]: value }))
  }

  const springTransition = {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  }

  return (
    <>
      <motion.button
        initial={false}
        animate={{ x: isOpen ? '11.5rem' : 0 }}
        transition={springTransition}
        onClick={() => setIsOpen(!isOpen)}
        className='fixed left-0 top-60 z-10 rounded-r-xl bg-white p-2 shadow-lg dark:bg-gray-950'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
        </svg>
      </motion.button>

      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className='fixed left-0 top-60 w-56 rounded-br-xl bg-white p-4 shadow-lg dark:bg-gradient-to-t dark:from-gray-900 dark:to-gray-950'
      >
        <div className='flex items-center gap-x-5 px-2 py-4'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-auto w-6 fill-neutral-700 dark:fill-neutral-200'
            viewBox='0 0 512 512'
          >
            <path d='M479.66 268.7l-32-151.81C441.48 83.77 417.68 64 384 64H128c-16.8 0-31 4.69-42.1 13.94s-18.37 22.31-21.58 38.89l-32 151.87A16.65 16.65 0 0032 272v112a64 64 0 0064 64h320a64 64 0 0064-64V272a16.65 16.65 0 00-.34-3.3zm-384-145.4v-.28c3.55-18.43 13.81-27 32.29-27H384c18.61 0 28.87 8.55 32.27 26.91 0 .13.05.26.07.39l26.93 127.88a4 4 0 01-3.92 4.82H320a15.92 15.92 0 00-16 15.82 48 48 0 11-96 0A15.92 15.92 0 00192 256H72.65a4 4 0 01-3.92-4.82z' />
            <path d='M368 160H144a16 16 0 010-32h224a16 16 0 010 32zM384 224H128a16 16 0 010-32h256a16 16 0 010 32z' />
          </svg>
          <span className='font-tiny text-xl font-bold tracking-tight text-neutral-700 dark:text-neutral-200'>
            FILTER MENU
          </span>
        </div>
        {/* confidence */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className='flex items-center justify-between py-1 pl-2'
        >
          <p className='text-md font-semibold tracking-widest'>置信度</p>
          <select
            className='cursor-pointer rounded-md border border-gray-800 bg-white py-1 pl-4 pr-3 text-sm transition-colors duration-200 hover:bg-gray-900 hover:text-white focus:border-gray-800 focus:outline-none focus:ring-0 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:focus:border-gray-800'
            value={filterParams.confidence || ''}
            onChange={e => handleFilterChange('confidence', e.target.value)}
          >
            {confidenceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>
        {/* daynight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className='mt-2 flex items-center justify-between py-1 pl-2'
        >
          <p className='text-md font-semibold tracking-widest'>筛选时段</p>
          <select
            className='cursor-pointer rounded-md border border-gray-800 bg-white py-1 pl-4 pr-3 text-sm transition-colors duration-200 hover:bg-gray-900 hover:text-white focus:border-gray-800 focus:outline-none focus:ring-0 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:focus:border-gray-800'
            value={filterParams.daynight || ''}
            onChange={e => handleFilterChange('daynight', e.target.value)}
          >
            {daynightOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>
        {/* bright_ti4 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <RangeInput
            label='Ti4通道亮温(K)'
            defaultMinValue={290}
            defaultMaxValue={360}
            minValue={filterParams.minBrightTi4}
            maxValue={filterParams.maxBrightTi4}
            onMinChange={value => handleFilterChange('minBrightTi4', value)}
            onMaxChange={value => handleFilterChange('maxBrightTi4', value)}
          />
        </motion.div>
        {/* bright_ti5 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <RangeInput
            label='Ti5通道亮温(K)'
            defaultMinValue={250}
            defaultMaxValue={360}
            minValue={filterParams.minBrightTi5}
            maxValue={filterParams.maxBrightTi5}
            onMinChange={value => handleFilterChange('minBrightTi5', value)}
            onMaxChange={value => handleFilterChange('maxBrightTi5', value)}
          />
        </motion.div>
        {/* frp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className='mb-1'
        >
          <RangeInput
            label='火灾辐射功率(MW)'
            defaultMinValue={0.01}
            defaultMaxValue={400}
            minValue={filterParams.minFrp}
            maxValue={filterParams.maxFrp}
            onMinChange={value => handleFilterChange('minFrp', value)}
            onMaxChange={value => handleFilterChange('maxFrp', value)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.2 }}
          className='ml-2 mt-4 flex items-center justify-between'
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleWindLayer}
            className='rounded-md border border-gray-800 bg-white px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-900 hover:text-white focus:border-gray-800 focus:outline-none focus:ring-0 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:focus:border-gray-800'
          >
            风场图层
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {}}
            className='rounded-md border border-gray-800 bg-white px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-900 hover:text-white focus:border-gray-800 focus:outline-none focus:ring-0 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:focus:border-gray-800'
          >
            热图图层
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  )
}

export default SideMenu
