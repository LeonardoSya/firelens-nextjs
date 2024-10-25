'use client'

import { Scatter } from '@ant-design/plots'
import React from 'react'
import countryData from '@/public/data/country.json'

const AreaScatter: React.FC = () => {
  const config = {
    title: '火点数量与国土面积散点图',
    data: countryData,
    xField: 'area',
    yField: 'counts',
    colorField: 'counts',
    shapeField: 'circle',
    sizeField: [4, 6],
    theme: 'dark',
    padding: [20, 20, 50, 50],
    scale: {
      color: {
        type: 'log',
        field: 'counts',
        base: 10,
        range: ['#1890ff', '#fa8c16', '#d4380d'],
      },
      x: {
        type: 'log',
        base: 10,
        nice: true,
      },
      y: {
        type: 'log',
        base: 10,
        nice: true,
      },
    },
    tooltip: {
      title: (datum: { country_zh: string, country_en: string }) =>
        `${datum.country_zh} (${datum.country_en})`,
    },
    axis: {
      x: { title: '国土面积（平方公里）' },
      y: { title: '火点数量', label: null },
    },
  }

  return (
    <div className='h-96 w-full lg:h-[36rem] lg:w-1/2'>
      <Scatter {...config} />
    </div>
  )
}

export default AreaScatter
