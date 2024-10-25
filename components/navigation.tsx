'use client'

import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { useIntl } from 'react-intl'

const menu: Variants = {
  hidden: {
    y: -20,
    opacity: 0,
  },
  visible: {
    y: 20,
    opacity: 1,
  },
}

export default function Navigation({ isOpen }: { isOpen: boolean }) {
  const intl = useIntl()

  return (
    <>
      <motion.ul
        initial='hidden'
        animate={isOpen ? 'visible' : 'hidden'}
        variants={menu}
        className='fixed inset-x-1 top-24 z-20 mx-7 rounded-2xl bg-slate-50 px-4 py-4 shadow-lg shadow-gray-300 ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-orange-700/80 dark:ring-orange-700/80 md:hidden'
      >
        <motion.li className='transform rounded-lg px-3 py-3 text-lg tracking-widest text-slate-950 duration-75 active:bg-slate-100 dark:font-semibold dark:text-neutral-200 dark:active:bg-gray-900'>
          <Link href='/'>{intl.formatMessage({ id: 'root.tab1' })}</Link>
        </motion.li>
        <motion.li className='transform rounded-lg px-3 py-3 text-lg tracking-widest text-slate-950 duration-75 active:bg-slate-100 dark:font-semibold dark:text-neutral-200 dark:active:bg-gray-900'>
          <Link href='/map'>{intl.formatMessage({ id: 'root.tab2' })}</Link>
        </motion.li>
        <motion.li className='transform rounded-lg px-3 py-3 text-lg tracking-widest text-slate-950 duration-75 active:bg-slate-100 dark:font-semibold dark:text-neutral-200 dark:active:bg-gray-900'>
          <Link href='/'>{intl.formatMessage({ id: 'root.tab3' })}</Link>
        </motion.li>
        <div className='mx-3 my-2 border-t-2 dark:border-orange-700/80' />
        <motion.li className='transform rounded-lg px-3 py-3 text-lg tracking-widest text-slate-950 duration-75 active:bg-slate-100 dark:font-semibold dark:text-neutral-200 dark:active:bg-gray-900'>
          <Link href='/'>{intl.formatMessage({ id: 'root.signIn' })}</Link>
        </motion.li>
      </motion.ul>
    </>
  )
}
