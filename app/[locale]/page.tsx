'use client'

import React, { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import Slider from 'react-slick'
import mapImg from '@/public/img/map.png'
import mapSatellite from '@/public/img/map-satellite.png'
import mapCity from '@/public/img/map-city.png'
import mapWind from '@/public/img/map-wind.png'
import mapMobile from '@/public/img/homepage-mobile.png'
import fireIcon from '@/public/img/fire-icon.png'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import '@/app/styles/bg.css'

const LazyHeatMap = dynamic(() => import('@/components/charts/heat-pg'), {
  ssr: false,
  loading: () => <ChartSkeleton className='h-96 md:h-[36rem] md:w-3/4' />,
})
const LazyAreaScatter = dynamic(() => import('@/components/charts/area'), {
  ssr: false,
  loading: () => <ChartSkeleton className='h-64 flex-1' />,
})
const LazyTimeScatter = dynamic(() => import('@/components/charts/time'), {
  ssr: false,
  loading: () => <ChartSkeleton className='h-96 md:h-[40rem] md:w-3/4' />,
})
const LazyCountryPie = dynamic(() => import('@/components/charts/pie'), {
  ssr: false,
  loading: () => <ChartSkeleton className='h-64 flex-1' />,
})

const LazyBackgroundAnimation = dynamic(
  () => import('../../components/background-animation').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <div className='absolute h-full w-full' />,
  },
)

const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 2000,
  arrows: false,
}

const images = [
  // priority: 首图优先加载
  { src: mapImg, alt: 'map', priority: true },
  { src: mapSatellite, alt: 'satellite' },
  { src: mapWind, alt: 'wind' },
  { src: mapCity, alt: 'city' },
  { src: mapMobile, alt: 'mobile' },
]

const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}>
    <div className='flex h-full items-center justify-center'>
      <div className='text-gray-400 dark:text-gray-500'>loading...</div>
    </div>
  </div>
)

const OptimizedBackground = () => (
  <div className='absolute inset-0 overflow-hidden'>
    <div className='animate-float-slow absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 blur-2xl' />
    <div className='animate-float-medium absolute right-1/4 top-3/4 h-24 w-24 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl' />
    <div className='animate-float-fast absolute left-3/4 top-1/2 h-20 w-20 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-xl' />
  </div>
)

const MotionLink = motion.create(Link)

const HomePage: React.FC = () => {
  const t = useTranslations()
  const [showCharts, setShowCharts] = useState(false)
  const [showBackground, setShowBackground] = useState(false)

  // 分阶段渲染：首屏渲染完成后再加载图表和背景动画
  useEffect(() => {
    // 延迟加载背景动画
    const backgroundTimer = setTimeout(() => setShowBackground(true), 500)
    // 延迟加载图表组件
    const chartsTimer = setTimeout(() => setShowCharts(true), 1000)

    return () => {
      clearTimeout(backgroundTimer)
      clearTimeout(chartsTimer)
    }
  }, [])

  return (
    <main className='relative h-screen w-full'>
      <div className='g-bg absolute h-full w-full overflow-hidden'>
        {showBackground ? (
          <Suspense fallback={<div className='absolute h-full w-full' />}>
            <LazyBackgroundAnimation />
          </Suspense>
        ) : (
          <OptimizedBackground />
        )}
      </div>
      <div className='relative z-10 mx-auto max-w-7xl px-6 pt-24 sm:pt-32 md:pt-56 lg:px-8'>
        <div className='mx-auto max-w-2xl items-center justify-between lg:flex lg:max-w-none'>
          <motion.div
            className='max-w-3xl'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1
              style={{ userSelect: 'none' }}
              className='m-2 text-balance font-tiny text-4xl font-medium tracking-wide text-neutral-950 dark:text-[#e54e1b] sm:m-4 sm:text-6xl'
            >
              FIRELENS
            </h1>
            <h1
              style={{ userSelect: 'none' }}
              className='mb-4 text-balance font-serif text-4xl font-medium tracking-tight text-neutral-950 dark:text-gray-100 sm:text-6xl'
            >
              {t('home.title1')}
            </h1>
            <h1
              style={{ userSelect: 'none' }}
              className='mt-6 text-balance font-serif text-4xl font-medium tracking-tight text-neutral-950 dark:text-gray-100 sm:mt-10 sm:text-6xl'
            >
              {t('home.title2')}
            </h1>
            <p
              style={{ userSelect: 'none' }}
              className='my-6 text-lg leading-tight tracking-wide text-neutral-600 dark:text-slate-400 sm:text-2xl sm:leading-normal'
            >
              {t('home.introduction')}
            </p>
            <p
              style={{ userSelect: 'none' }}
              className='my-6 leading-tight tracking-wide text-neutral-600 dark:text-gray-500 sm:text-xl sm:leading-normal'
            >
              {t('home.team')}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Slider {...settings} className='my-6 w-full shrink-0 rounded-xl lg:w-[30rem]'>
              {images.map((image, index) => (
                <div key={index}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={480}
                    height={320}
                    priority={image.priority || false}
                    placeholder='blur'
                    blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
                    className='h-72 w-full rounded-2xl object-cover lg:h-full'
                  />
                </div>
              ))}
            </Slider>
          </motion.div>
        </div>
      </div>
      {/* chart-view */}
      <div className='mt-8 bg-gradient-radial px-6 pt-10 dark:from-gray-900 dark:to-slate-950 sm:mt-12 md:mt-20 lg:mt-44 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <motion.div
            className='flex flex-col items-center gap-4 text-center'
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className='flex items-center'>
              <Image src={fireIcon} alt='fire-icon' className='h-16 w-auto sm:h-24' />
            </div>
            <p className='md:max-w-x font-montserrat text-sm leading-tight md:text-lg'>
              {new Date()
                .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                .replace(/(\w+) (\d+), (\d+)/, '$1 $2, $3')}
            </p>
            <h1 className='max-w-80 font-montserrat text-3xl leading-relaxed tracking-wider md:max-w-xl lg:text-4xl'>
              动态监测世界范围 48h 内的火情并且进行可视化分析
            </h1>
            <p className='max-w-72 font-montserrat text-lg leading-tight tracking-wider md:max-w-lg md:text-xl'>
              数据来源于 NASA VIIRS 375m Active Fire 产品
            </p>
          </motion.div>
          <div className='m-4 flex flex-col items-center'>
            <motion.button
              onClick={() => {
                window.scrollTo({
                  top: 20,
                  behavior: 'smooth',
                })
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='font-inherit group flex cursor-pointer items-center rounded-2xl border-2 border-slate-900 bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] px-6 py-3 text-lg font-medium tracking-widest text-white transition-all duration-300 ease-in-out hover:shadow-lg'
            >
              <svg
                className='rotate-30 mr-1 h-6 w-6 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-1 group-hover:rotate-90'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M0 0h24v24H0z' fill='none'></path>
                <path
                  d='M5 13c0-5.088 2.903-9.436 7-11.182C16.097 3.564 19 7.912 19 13c0 .823-.076 1.626-.22 2.403l1.94 1.832a.5.5 0 0 1 .095.603l-2.495 4.575a.5.5 0 0 1-.793.114l-2.234-2.234a1 1 0 0 0-.707-.293H9.414a1 1 0 0 0-.707.293l-2.234 2.234a.5.5 0 0 1-.793-.114l-2.495-4.575a.5.5 0 0 1 .095-.603l1.94-1.832C5.077 14.626 5 13.823 5 13zm1.476 6.696l.817-.817A3 3 0 0 1 9.414 18h5.172a3 3 0 0 1 2.121.879l.817.817.982-1.8-1.1-1.04a2 2 0 0 1-.593-1.82c.124-.664.187-1.345.187-2.036 0-3.87-1.995-7.3-5-8.96C8.995 5.7 7 9.13 7 13c0 .691.063 1.372.187 2.037a2 2 0 0 1-.593 1.82l-1.1 1.039.982 1.8zM12 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z'
                  fill='currentColor'
                ></path>
              </svg>
              <span className='transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:translate-x-2'>
                尝试一下
              </span>
            </motion.button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='mt-8 flex flex-col items-center justify-center'
          >
            <p className='font-montserrat text-lg tracking-wider text-neutral-300 md:max-w-xl lg:max-w-4xl lg:text-xl'>
              Firelens
              基于高分热点数据产品，能够进行全球火灾发生时间模型的识别，如火灾频发的时段。4μm通道的火点亮温和火灾辐射功率（FRP）能够反映火灾强度，较高的亮温和较大的FRP值通常表示更严重的火灾。Firelens
              提供的动态火灾数据可视化有助于用户了解不同地区、不同时间的火灾发生情况,为全球尺度的火灾管理和决策提供支持
            </p>
            <p className='mt-6 font-montserrat tracking-wider text-neutral-400'>
              全球48h内特大火灾发生时间与火点亮温图
            </p>
            {showCharts ? (
              <Suspense fallback={<ChartSkeleton className='h-96 md:h-[40rem] md:w-3/4' />}>
                <LazyTimeScatter />
              </Suspense>
            ) : (
              <ChartSkeleton className='h-96 md:h-[40rem] md:w-3/4' />
            )}
            <div className='mt-12 flex w-full flex-col gap-4 lg:max-w-5xl lg:flex-row'>
              {showCharts ? (
                <>
                  <Suspense fallback={<ChartSkeleton className='h-64 flex-1' />}>
                    <LazyCountryPie />
                  </Suspense>
                  <Suspense fallback={<ChartSkeleton className='h-64 flex-1' />}>
                    <LazyAreaScatter />
                  </Suspense>
                </>
              ) : (
                <>
                  <ChartSkeleton className='h-64 flex-1' />
                  <ChartSkeleton className='h-64 flex-1' />
                </>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className='mb-2 mt-8 flex flex-col items-center justify-center'
          >
            <p className='max-w-lg font-montserrat text-lg tracking-wider text-neutral-300 md:max-w-xl lg:max-w-4xl lg:text-xl'>
              Firelens 通过多元数据交叉实现了高质量上游火点数据质量控制
              <br />
              借助NDVI（归一化植被指数）进行火点筛选。NDVI使用近红外和红光波段进行计算，计算公式为(NIR-R)/(NIR+R)，够反映植被的生长状态和覆盖程度。在区分植被与化工厂、城市热岛区域方面具有优势。通过将NDVI与火点检测算法相结合可以更精准地识别出真正的火灾点，减少因其他高温源（如城市热岛效应区域、工厂热源等）造成的误判
            </p>
            <p className='mt-6 font-montserrat tracking-wider text-neutral-400'>
              京津冀部分地区NDVI 3D蜂窝热力图 （ 2024年7月 ）
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className='flex flex-col items-center justify-center'
          >
            {showCharts ? (
              <Suspense fallback={<ChartSkeleton className='h-96 md:h-[36rem] md:w-3/4' />}>
                <LazyHeatMap />
              </Suspense>
            ) : (
              <ChartSkeleton className='h-96 md:h-[36rem] md:w-3/4' />
            )}
          </motion.div>
        </div>
      </div>
      {/* footer */}
      <div className='mx-2 mb-20 mt-24 max-w-7xl border-t-2 border-neutral-700/80 pt-12 md:mx-auto'>
        <MotionLink
          href='/'
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='flex transform cursor-pointer items-center justify-between rounded-lg duration-75 focus-visible:outline-none focus-visible:outline-1 focus-visible:outline-slate-400'
        >
          <div className='flex flex-row gap-2'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-auto w-7 pb-16'
              viewBox='0 0 512 512'
              style={{ fill: 'rgb(194,65,12)' }}
            >
              <path d='M390.42 75.28a10.45 10.45 0 01-5.32-1.44C340.72 50.08 302.35 40 256.35 40c-45.77 0-89.23 11.28-128.76 33.84C122 77 115.11 74.8 111.87 69a12.4 12.4 0 014.63-16.32A281.81 281.81 0 01256.35 16c49.23 0 92.23 11.28 139.39 36.48a12 12 0 014.85 16.08 11.3 11.3 0 01-10.17 6.72zm-330.79 126a11.73 11.73 0 01-6.7-2.16 12.26 12.26 0 01-2.78-16.8c22.89-33.6 52-60 86.69-78.48 72.58-38.84 165.51-39.12 238.32-.24 34.68 18.48 63.8 44.64 86.69 78a12.29 12.29 0 01-2.78 16.8 11.26 11.26 0 01-16.18-2.88c-20.8-30.24-47.15-54-78.36-70.56-66.34-35.28-151.18-35.28-217.29.24-31.44 16.8-57.79 40.8-78.59 71a10 10 0 01-9.02 5.08zM204.1 491a10.66 10.66 0 01-8.09-3.6C175.9 466.48 165 453 149.55 424c-16-29.52-24.27-65.52-24.27-104.16 0-71.28 58.71-129.36 130.84-129.36S387 248.56 387 319.84a11.56 11.56 0 11-23.11 0c0-58.08-48.32-105.36-107.72-105.36S148.4 261.76 148.4 319.84c0 34.56 7.39 66.48 21.49 92.4 14.8 27.6 25 39.36 42.77 58.08a12.67 12.67 0 010 17 12.44 12.44 0 01-8.56 3.68zm165.75-44.4c-27.51 0-51.78-7.2-71.66-21.36a129.1 129.1 0 01-55-105.36 11.57 11.57 0 1123.12 0 104.28 104.28 0 0044.84 85.44c16.41 11.52 35.6 17 58.72 17a147.41 147.41 0 0024-2.4c6.24-1.2 12.25 3.12 13.4 9.84a11.92 11.92 0 01-9.47 13.92 152.28 152.28 0 01-27.95 2.88zM323.38 496a13 13 0 01-3-.48c-36.76-10.56-60.8-24.72-86-50.4-32.37-33.36-50.16-77.76-50.16-125.28 0-38.88 31.9-70.56 71.19-70.56s71.2 31.68 71.2 70.56c0 25.68 21.5 46.56 48.08 46.56s48.08-20.88 48.08-46.56c0-90.48-75.13-163.92-167.59-163.92-65.65 0-125.75 37.92-152.79 96.72-9 19.44-13.64 42.24-13.64 67.2 0 18.72 1.61 48.24 15.48 86.64 2.32 6.24-.69 13.2-6.7 15.36a11.34 11.34 0 01-14.79-7 276.39 276.39 0 01-16.88-95c0-28.8 5.32-55 15.72-77.76 30.75-67 98.94-110.4 173.6-110.4 105.18 0 190.71 84.24 190.71 187.92 0 38.88-31.9 70.56-71.2 70.56s-71.2-31.68-71.2-70.56c.01-25.68-21.49-46.6-48.07-46.6s-48.08 20.88-48.08 46.56c0 41 15.26 79.44 43.23 108.24 22 22.56 43 35 75.59 44.4 6.24 1.68 9.71 8.4 8.09 14.64a11.39 11.39 0 01-10.87 9.16z' />
            </svg>
            <h2 className='px-1 pb-16 font-tiny text-2xl tracking-wide text-slate-950 dark:text-neutral-200 lg:text-4xl'>
              FIRELENS
            </h2>
          </div>

          <h6 className='px-1 pb-16 text-slate-950 dark:text-neutral-300'>
            © Firelens System Inc. 2024
          </h6>
        </MotionLink>
      </div>
    </main>
  )
}

export default HomePage
