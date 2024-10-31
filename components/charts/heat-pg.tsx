// ! Read data from pg

'use client'

import React from 'react'
import useSWR from 'swr'
import { Map } from 'react-map-gl/maplibre'
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core'
import { HexagonLayer } from '@deck.gl/aggregation-layers'
import DeckGL from '@deck.gl/react'
import type { Color, PickingInfo, MapViewState } from '@deck.gl/core'

// 环境光
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1,
})

// 点光源
const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.4,
  position: [-0.144528, 49.739968, 80000],
})

const lightingEffect = new LightingEffect({ ambientLight, pointLight1 })

// 初始视图状态
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 116.569039,
  latitude: 40.156928,
  zoom: 9.5,
  minZoom: 5,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -27,
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'

export const colorRange: Color[] = [
  [9, 88, 217],
  [22, 119, 255],
  [56, 158, 13],
  [160, 217, 17],
]

function getTooltip({ object }: PickingInfo) {
  if (!object) {
    return null
  }

  console.log(object)

  const lat = object.position[1]
  const lng = object.position[0]
  const ndvi = object.points[0].source.ndvi

  return `\
    纬度: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}
    经度: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}
    归一化植被系数: ${ndvi}`
}

const fetcher = async (url: string) => await fetch(url).then(res => res.json())

const HeatMap: React.FC = () => {
  const { data, error } = useSWR('/api/heat', fetcher)

  if (error) return <div>Failed to load...</div>
  if (!data) return <div>Loading...</div>

  const layers = [
    new HexagonLayer({
      id: 'heatmap',
      colorRange,
      coverage: 0.85,
      data,
      elevationRange: [0, 1000],
      elevationScale: data && data.length ? 10 : 0,
      extruded: true,
      getPosition: d => [d.longitude, d.latitude],
      pickable: true,
      radius: 800,
      upperPercentile: 95,
      lowerPercentile: 5,
      material: {
        ambient: 0.8,
        diffuse: 0.8,
        shininess: 16,
        specularColor: [51, 51, 51],
      },
      transitions: {
        elevationScale: 3000,
      },
    }),
  ]

  return (
    <div className='relative h-96 w-full overflow-y-hidden md:h-[36rem] md:w-3/4'>
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
