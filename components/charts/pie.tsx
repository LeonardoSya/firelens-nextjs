'use client'

import React, { useEffect, useState } from 'react'
import { Pie } from '@ant-design/plots'
import countryData from '@/public/data/country.json'

interface CountryData {
  country_zh: string;
  country_en: string;
  counts: number;
  area: number;
}

const CountryPie: React.FC = () => {
  const [data, setData] = useState<CountryData[]>([])
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sortedData = countryData.sort((a, b) => b.counts - a.counts).slice(0, 20)
        setData(sortedData)
      } catch (error) {
        console.error('获取数据时出错:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const config = {
    data,
    angleField: 'counts',
    colorField: 'country_zh',
    radius: 0.4,
    theme: 'dark',
    innerRadius: 0.9,
    labels:
      windowWidth >= 768
        ? [
            { text: 'country_zh', style: { fontSize: 12, fontWeight: 'bold' } },
            { text: 'counts', dy: 14, style: { fontWeight: 'bold' } },
          ]
        : [],
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
    legend: {
      layout: 'vertical',
      position: 'right',
    },
    style: {
      stroke: '#000',
      inset: 1,
      radius: 15,
    },
    scale: {
      color: {
        palette: 'spectral',
        offset: (t: number) => t + 0.1,
      },
    },
    annotations: [
      {
        type: 'text',
        style: {
          text: '48h内发生火灾\n最多的20个国家',
          textAlign: 'center',
          fontSize: '2rem',
          fontStyle: 'bold',
          x: '50%',
          y: '50%',
          fill: '#f0f0f0',
        },
      },
    ],
  }

  return (
    <div className='h-[30rem] w-full lg:h-[40rem] lg:w-1/2'>
      <Pie {...config} />
    </div>
  )
}

export default CountryPie
