'use client'

import React, { useEffect, useState } from 'react'
import { Map } from 'react-map-gl/maplibre'
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core'
import { HexagonLayer } from '@deck.gl/aggregation-layers'
import DeckGL from '@deck.gl/react'
import { CSVLoader } from '@loaders.gl/csv'
import { load } from '@loaders.gl/core'
import type { Color, PickingInfo, MapViewState } from '@deck.gl/core'

// ! 数据使用自产ndvi 并修改ts类型定义
const DATA_URL = '@/assets/data/heatmap-data.csv'

// 环境光和两个点光源
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
})

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000],
})

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000],
})

const lightingEffect = new LightingEffect({ ambientLight, pointLight1, pointLight2 })

// 初始视图状态
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -1.415727,
  latitude: 52.232395,
  zoom: 6.6,
  minZoom: 5,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -27,
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'

export const colorRange: Color[] = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78],
]

function getTooltip({ object }: PickingInfo) {
  if (!object) {
    return null
  }
  const lat = object.position[1]
  const lng = object.position[0]
  const count = object.points.length

  return `\
    latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}
    longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}
    ${count} Accidents`
}

const HeatMap: React.FC = () => {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const loadedData = (await load(DATA_URL, CSVLoader)).data
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      const points = loadedData.map(d => [d.lng, d.lat])
      setData(points)
    }
    fetchData()
  }, [])

  // 创建热力图图层
  const layers = [
    new HexagonLayer<any>({
      id: 'heatmap',
      colorRange,
      coverage: 1,
      data,
      elevationRange: [0, 3000],
      elevationScale: data && data.length ? 50 : 0,
      extruded: true,
      getPosition: d => d,
      pickable: true,
      radius: 1000,
      upperPercentile: 100,
      material: {
        ambient: 0.64,
        diffuse: 0.6,
        shininess: 32,
        specularColor: [51, 51, 51],
      },
      transitions: {
        elevationScale: 3000,
      },
    }),
  ]

  return (
    <div className='relative h-96 w-full md:h-[36rem] md:w-3/4'>
      <DeckGL
        layers={layers}
        effects={[lightingEffect]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map reuseMaps mapStyle={MAP_STYLE} />
      </DeckGL>
    </div>
  )
}

export default HeatMap
