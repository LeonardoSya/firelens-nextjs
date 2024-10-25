'use client'

import React, { useEffect, useState } from 'react'
import { Scatter } from '@ant-design/plots'

interface DataItem {
  datetime: string;
  bright: number;
}

const baseUrl = 'http://localhost:3000'

const TimeScatter: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${baseUrl}/api/plot-get-time`
        const res = await fetch(url)
        const jsonData = await res.json()

        const scatterData = jsonData.map((item: DataItem) => ({
          datetime: new Date(item.datetime).getTime(),
          bright: item.bright,
        }))

        setData(scatterData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  if (data.length === 0) {
    return <div>加载中...</div>
  }

  const config = {
    data,
    xField: 'datetime',
    yField: 'bright',
    colorField: 'bright',
    shapeField: 'circle',
    sizeField: 5,
    theme: 'dark',
    tooltip: {
      title: () => '火灾发生时间与火点亮温',
      items: [
        {
          channel: 'x',
          valueFormatter: (value: number) => {
            const date = new Date(value)
            return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          },
        },
        { channel: 'y', valueFormatter: (value: number) => `${value} K` },
      ],
    },
    axis: {
      x: {
        title: '火灾发生时间（全球标准时间 GMT）',
        labelFormatter: (value: number) => {
          const date = new Date(value)
          return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        },
      },

      y: { title: '火点亮温（开尔文）' },
    },
  }

  return (
    <div className='h-96 w-full md:h-[40rem] md:w-3/4'>
      <Scatter {...config} />
    </div>
  )
}

export default TimeScatter
