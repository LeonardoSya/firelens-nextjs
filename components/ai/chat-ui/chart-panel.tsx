'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  BubbleController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Bar, Bubble } from 'react-chartjs-2'
import { ChartData as ChartDataType, TrendDataPoint, ScatterDataPoint } from './types'

// 注册 Chart.js 组件（包括 annotation 插件和控制器）
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  BubbleController,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
)

// 图表图标
const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    />
  </svg>
)

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    fill='none'
    viewBox='0 0 24 24'
    stroke='currentColor'
    strokeWidth={2}
  >
    <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
  </svg>
)

interface ChartPanelProps {
  chartData: ChartDataType;
}

export const ChartPanel = ({ chartData }: ChartPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!chartData.analysis_valid || !chartData.viz_data) {
    return null
  }

  const { trend_chart, scatter_chart } = chartData.viz_data

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className='mt-3 w-full overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 shadow-sm dark:border-blue-900/30 dark:from-blue-950/30 dark:to-indigo-950/30'
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-blue-100/50 dark:hover:bg-blue-900/20'
      >
        <div className='flex items-center gap-2'>
          <div className='flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400'>
            <ChartIcon className='h-4 w-4' />
          </div>
          <span className='text-sm font-medium text-blue-800 dark:text-blue-200'>
            目标地区火情智能分析图
          </span>
          <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'>
            {trend_chart?.length || 0} 个时段 · {scatter_chart?.length || 0} 个热点
          </span>
        </div>
        <ChevronIcon expanded={isExpanded} />
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='overflow-hidden'
          >
            <div className='space-y-4 p-4 pt-0'>
              {trend_chart && trend_chart.length > 0 && <TrendChart data={trend_chart} />}

              {scatter_chart && scatter_chart.length > 0 && <QuadrantChart data={scatter_chart} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const TrendChart = ({ data }: { data: TrendDataPoint[] }) => {
  // scan_time 格式: "2025-11-30 0253" (YYYY-MM-DD HHMM)
  const labels = data.map(d => {
    // 提取时间部分 HHMM
    const parts = d.scan_time.split(' ')
    if (parts.length === 2) {
      const time = parts[1].padStart(4, '0')
      return `${time.slice(0, 2)}:${time.slice(2)}`
    }
    return d.scan_time
  })

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: '火点数量',
        data: data.map(d => d.count),
        backgroundColor: 'rgba(251, 146, 60, 0.6)',
        borderColor: 'rgba(251, 146, 60, 1)',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: '能量释放 (MW)',
        data: data.map(d => d.energy),
        borderColor: 'rgba(220, 38, 38, 1)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(220, 38, 38, 1)',
        yAxisID: 'y1',
        order: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: '火势能量与频次时空演变趋势 (Temporal Evolution of Energy & Frequency)',
        font: { size: 14, weight: 'bold' as const },
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          afterBody: (context: { dataIndex: number }[]) => {
            const idx = context[0]?.dataIndex
            if (idx !== undefined && data[idx]) {
              const d = data[idx]
              const ratio = d.count > 0 ? (d.energy / d.count).toFixed(1) : '0'
              return [`单点平均能量: ${ratio} MW`]
            }
            return []
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '火点数量',
          font: { size: 13, weight: 'bold' as const },
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 11 } },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '能量 (MW)',
          font: { size: 13, weight: 'bold' as const },
        },
        grid: { drawOnChartArea: false },
        ticks: { font: { size: 11 } },
      },
    },
  }

  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false)

  return (
    <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800/50'>
      <div className='h-[360px]'>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Bar data={chartData as any} options={options as any} />
      </div>

      {/* 简述 */}
      <div className='mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
        <div className='flex items-start gap-2'>
          <p className='text-sm leading-relaxed text-blue-800 dark:text-blue-200'>
            <strong>简述：</strong>
            双轴对比展示火点数量（柱状）与总辐射能量（折线）的动态关系，用于识别&ldquo;火势合并&rdquo;或&ldquo;爆发性增强&rdquo;的关键时间节点。
          </p>
        </div>
      </div>

      {/* 深度解读折叠区 */}
      <div className='mt-2'>
        <button
          onClick={() => setShowDeepAnalysis(!showDeepAnalysis)}
          className='flex w-full items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-left text-sm text-amber-800 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30'
        >
          <span>💡</span>
          <span className='flex-1 font-medium'>Firelens深度解读</span>
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${showDeepAnalysis ? 'rotate-180' : ''}`}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
          </svg>
        </button>

        <AnimatePresence>
          {showDeepAnalysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='overflow-hidden'
            >
              <div className='mt-2 space-y-3 rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>分析原理</p>
                  <p className='mt-1'>
                    本图表旨在揭示火灾发展的非线性特征。单纯的&ldquo;火点数量&rdquo;往往具有误导性（例如：大量低强度的农田秸秆焚烧会产生很多火点，但危害较低）。
                  </p>
                </div>

                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>关键点</p>
                  <ul className='mt-1 space-y-2'>
                    <li>
                      <span className='font-medium text-red-600 dark:text-red-400'>
                        剪刀差效应 (Divergence)：
                      </span>
                      当柱状图（数量）下降或持平，而折线图（能量）急剧上升时，这是极度危险的信号。在林火动力学中，这通常意味着零星的火点正在合并（Merging），形成了一个燃烧效率更高、难以控制的立体火场。
                    </li>
                    <li>
                      <span className='font-medium text-orange-600 dark:text-orange-400'>
                        能量峰值 (Energy Spike)：
                      </span>
                      红色折线的波峰代表了
                      FRP（火辐射功率）的瞬间释放极值，通常对应着树冠火爆发或风力助燃最为猛烈的时刻。
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** 计算动态 Y 轴配置，根据数据分布优化显示 */
function calculateYAxisConfig(data: ScatterDataPoint[]) {
  const frpValues = data.map(d => d.frp).sort((a, b) => a - b)
  const len = frpValues.length

  // 计算分位数
  const p50 = frpValues[Math.floor(len * 0.5)] || 0
  const p75 = frpValues[Math.floor(len * 0.75)] || 0
  const maxFrp = frpValues[len - 1] || 0

  // 简化策略：始终包含所有数据点，Y 轴上限为最大值的 1.1 倍
  let suggestedMax = Math.ceil(maxFrp * 1.1)

  // 确保最小上限
  suggestedMax = Math.max(suggestedMax, 15)

  // 计算合适的步长
  let stepSize: number
  if (suggestedMax <= 10) {
    stepSize = 2
  } else if (suggestedMax <= 25) {
    stepSize = 5
  } else if (suggestedMax <= 50) {
    stepSize = 10
  } else {
    stepSize = Math.ceil(suggestedMax / 5 / 5) * 5
  }

  // 调整 suggestedMax 为步长的整数倍
  suggestedMax = Math.ceil(suggestedMax / stepSize) * stepSize

  // 象限阈值：基于中位数和 P75 的平均值，更贴近实际分布
  const quadrantThreshold = Math.max(5, Math.round((p50 + p75) / 2))

  return {
    suggestedMax,
    stepSize,
    quadrantThreshold,
    maxFrp, // 返回实际最大值用于判断是否有超出范围的点
  }
}

// 触发地图跳转的自定义事件
const emitMapFlyTo = (lat: number, lng: number, frp: number) => {
  const event = new CustomEvent('firelens:map-fly-to', {
    detail: { latitude: lat, longitude: lng, frp },
  })
  window.dispatchEvent(event)
}

const QuadrantChart = ({ data }: { data: ScatterDataPoint[] }) => {
  // 计算动态 Y 轴配置
  const yAxisConfig = calculateYAxisConfig(data)

  // 根据 FRP 强度获取颜色
  const getColor = (_confidence: string, frp: number) => {
    // 根据 FRP 强度渐变：黄 -> 橙 -> 红 -> 紫
    if (frp > 50) return 'rgba(147, 51, 234, 0.7)' // 紫色 - 极高
    if (frp > 30) return 'rgba(220, 38, 38, 0.7)' // 红色 - 高
    if (frp > 15) return 'rgba(249, 115, 22, 0.7)' // 橙色 - 中
    return 'rgba(234, 179, 8, 0.7)' // 黄色 - 低
  }

  const getBorderColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'rgba(220, 38, 38, 1)'
      case 'nominal':
        return 'rgba(59, 130, 246, 1)'
      default:
        return 'rgba(156, 163, 175, 1)'
    }
  }

  // 转换数据为气泡图格式
  const bubbleData = data.map(d => ({
    x: d.ndvi / 1000, // NDVI 通常是 0-10000，转换为 0-10
    y: d.frp,
    r: d.confidence === 'high' ? 8 : d.confidence === 'nominal' ? 6 : 4,
    raw: d,
  }))

  const chartData = {
    datasets: [
      {
        label: '热异常点',
        data: bubbleData,
        backgroundColor: bubbleData.map(d => getColor(d.raw.confidence, d.raw.frp)),
        borderColor: bubbleData.map(d => getBorderColor(d.raw.confidence)),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '植被载量与燃烧强度相关性分析 (Fuel Load vs. Combustion Intensity)',
        font: { size: 14, weight: 'bold' as const },
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: () => '🔥 热点详情',
          label: (context: { raw: { raw: ScatterDataPoint } }) => {
            const d = context.raw.raw
            const lines = [
              `FRP: ${d.frp.toFixed(1)} MW`,
              `NDVI: ${d.ndvi}`,
              `置信度: ${d.confidence}`,
            ]
            // 仅当有坐标数据时显示
            if (d.latitude !== undefined && d.longitude !== undefined) {
              lines.push(`坐标: ${d.latitude.toFixed(2)}°N, ${d.longitude.toFixed(2)}°E`)
            }
            return lines
          },
        },
      },
      // 注解插件（象限分割线）
      annotation: {
        annotations: {
          verticalLine: {
            type: 'line',
            xMin: 6,
            xMax: 6,
            borderColor: 'rgba(156, 163, 175, 0.6)',
            borderWidth: 1.5,
            borderDash: [6, 4],
          },
          horizontalLine: {
            type: 'line',
            yMin: yAxisConfig.quadrantThreshold,
            yMax: yAxisConfig.quadrantThreshold,
            borderColor: 'rgba(156, 163, 175, 0.6)',
            borderWidth: 1.5,
            borderDash: [6, 4],
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '🌲 NDVI (植被指数 ×1000)',
          font: { size: 13, weight: 'bold' as const },
        },
        min: 0,
        max: 10,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 11 } },
      },
      y: {
        title: {
          display: true,
          text: '🔥 FRP (辐射功率 MW)',
          font: { size: 13, weight: 'bold' as const },
        },
        min: 0,
        // 使用 max 强制限制 Y 轴范围，让主要数据分布更清晰
        // 超出范围的异常点会被裁剪显示在边界上
        max: yAxisConfig.suggestedMax,
        ticks: {
          font: { size: 11 },
          stepSize: yAxisConfig.stepSize,
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
  }

  // 计算象限统计（使用动态阈值）
  const threshold = yAxisConfig.quadrantThreshold
  const quadrantStats = {
    topRight: data.filter(d => d.ndvi > 6000 && d.frp > threshold).length,
    topLeft: data.filter(d => d.ndvi <= 6000 && d.frp > threshold).length,
    bottomRight: data.filter(d => d.ndvi > 6000 && d.frp <= threshold).length,
    bottomLeft: data.filter(d => d.ndvi <= 6000 && d.frp <= threshold).length,
  }

  // 统计超出显示范围的异常点
  // 注意：当前策略是 Y 轴上限 = maxFrp * 1.1，所以所有点都会在范围内
  // 只有在未来启用截断策略时才会有超出范围的点
  const outliersCount = data.filter(d => d.frp > yAxisConfig.suggestedMax).length

  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false)

  // 添加 onClick 到 options
  const chartOptions = {
    ...options,
    onClick: (_event: unknown, elements: { index: number }[]) => {
      if (elements.length > 0) {
        const index = elements[0].index
        const point = data[index]
        if (point && point.latitude !== undefined && point.longitude !== undefined) {
          emitMapFlyTo(point.latitude, point.longitude, point.frp)
        }
      }
    },
    onHover: (
      event: { native: { target: { style: { cursor: string } } } },
      elements: unknown[],
    ) => {
      const target = event.native?.target as HTMLElement | undefined
      if (target) {
        target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
      }
    },
  }

  return (
    <div className='rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800/50'>
      {/* 点击提示 */}
      <div className='mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
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
            d='M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122'
          />
        </svg>
        <span className='text-base font-medium text-orange-600'>
          点击图表中的热点可快速定位到地图位置
        </span>
      </div>
      <div className='h-[450px]'>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Bubble data={chartData} options={chartOptions as any} />
      </div>

      {/* 异常点提示 */}
      {outliersCount > 0 && (
        <div className='mt-2 rounded-lg bg-purple-50 p-2 text-xs text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'>
          ⚡ 有 <strong>{outliersCount}</strong> 个高强度异常点超出显示范围 (FRP &gt;{' '}
          {yAxisConfig.suggestedMax} MW)，已在图表顶部标注
        </div>
      )}

      {/* 象限图例 */}
      <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
        <div className='flex items-center gap-2 rounded-lg bg-red-50 p-2 dark:bg-red-900/20'>
          <span className='h-3 w-3 rounded-full bg-red-500' />
          <span className='text-red-800 dark:text-red-200'>
            第一象限 高危区 (高植被+高强度): <strong>{quadrantStats.topRight}</strong> 个
          </span>
        </div>
        <div className='flex items-center gap-2 rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/20'>
          <span className='h-3 w-3 rounded-full bg-yellow-500' />
          <span className='text-yellow-800 dark:text-yellow-200'>
            第四象限 关注区 (高植被+低强度): <strong>{quadrantStats.bottomRight}</strong> 个
          </span>
        </div>
        <div className='flex items-center gap-2 rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20'>
          <span className='h-3 w-3 rounded-full bg-orange-500' />
          <span className='text-orange-800 dark:text-orange-200'>
            第二象限 荒地火 (低植被+高强度): <strong>{quadrantStats.topLeft}</strong> 个
          </span>
        </div>
        <div className='flex items-center gap-2 rounded-lg bg-green-50 p-2 dark:bg-green-900/20'>
          <span className='h-3 w-3 rounded-full bg-green-500' />
          <span className='text-green-800 dark:text-green-200'>
            第三象限 低风险 (低植被+低强度): <strong>{quadrantStats.bottomLeft}</strong> 个
          </span>
        </div>
      </div>

      {/* 颜色图例 */}
      <div className='mt-2 flex items-center justify-center gap-4 text-xs text-gray-500'>
        <span>FRP 强度：</span>
        <span className='flex items-center gap-1'>
          <span className='h-2 w-2 rounded-full bg-yellow-500' /> 低
        </span>
        <span className='flex items-center gap-1'>
          <span className='h-2 w-2 rounded-full bg-orange-500' /> 中
        </span>
        <span className='flex items-center gap-1'>
          <span className='h-2 w-2 rounded-full bg-red-500' /> 高
        </span>
        <span className='flex items-center gap-1'>
          <span className='h-2 w-2 rounded-full bg-purple-500' /> 极高
        </span>
      </div>

      {/* 简述 */}
      <div className='mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
        <div className='flex items-start gap-2'>
          <p className='text-sm leading-relaxed text-blue-800 dark:text-blue-200'>
            <strong>简述：</strong>基于 NDVI（植被指数）与
            FRP（辐射功率）的四象限分布，通过&ldquo;燃料-强度&rdquo;耦合模型，定性判定火灾类型（如树冠火、地表火或农业用火）。
          </p>
        </div>
      </div>

      {/* 深度解读折叠区 */}
      <div className='mt-2'>
        <button
          onClick={() => setShowDeepAnalysis(!showDeepAnalysis)}
          className='flex w-full items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-left text-sm text-amber-800 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30'
        >
          <span>💡</span>
          <span className='flex-1 font-medium'>Firelens深度解读</span>
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${showDeepAnalysis ? 'rotate-180' : ''}`}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
          </svg>
        </button>

        <AnimatePresence>
          {showDeepAnalysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='overflow-hidden'
            >
              <div className='mt-2 space-y-3 rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                <div>
                  <p className='mt-1'>本图表依据燃烧物理学原理，将火点映射到四个特征象限中：</p>
                </div>

                <div className='space-y-2'>
                  <div className='rounded-md bg-red-50 p-2 dark:bg-red-900/20'>
                    <p>
                      <span className='font-medium text-red-700 dark:text-red-400'>
                        高危区 (右上象限 - High NDVI / High FRP)：
                      </span>
                      代表高密度植被（如原始森林）正在发生高强度燃烧。这是最危险的
                      <strong>树冠火 (Crown Fire)</strong>{' '}
                      特征，意味着大量生物质燃料被消耗，极难扑救。
                    </p>
                  </div>

                  <div className='rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20'>
                    <p>
                      <span className='font-medium text-yellow-700 dark:text-yellow-400'>
                        监测区 (右下象限 - High NDVI / Low FRP)：
                      </span>
                      代表森林区域的<strong>地表火 (Surface Fire)</strong>{' '}
                      或早期阴燃。虽然目前强度低，但燃料充足，具备爆发潜力，是
                      <strong>黄金扑救窗口期</strong>。
                    </p>
                  </div>

                  <div className='rounded-md bg-gray-100 p-2 dark:bg-gray-700'>
                    <p>
                      <span className='font-medium text-gray-700 dark:text-gray-300'>
                        低风险区 (左侧区域 - Low NDVI)：
                      </span>
                      通常对应荒地、稀树草原或农耕区的草地火/秸秆焚烧。燃料稀疏，蔓延速度快但持续时间短，自熄概率较高。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
