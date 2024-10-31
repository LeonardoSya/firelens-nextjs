'use client'

import React from 'react'
import useSWR from 'swr'
import DeckGL from '@deck.gl/react'
import { Map } from 'react-map-gl/maplibre'
import { HexagonLayer } from '@deck.gl/aggregation-layers'
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core'
import type { PickingInfo, MapViewState } from '@deck.gl/core'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 120.13383079335335,
  latitude: 29.651873105004427,
  zoom: 7.068989519212174,
  minZoom: 5,
  maxZoom: 15,
  pitch: 43,
  bearing: 0,
}

const dataUrl = '/data/heat.json'
const fetcher = async (url: string) => fetch(url).then(res => res.json())

const getTooltip = ({ object }: PickingInfo) => {
  if (!object) {
    return null
  }
  const lat = object.position[1]
  const lng = object.position[0]
  const count = object.points.length
  const ndvi = object.points.reduce((sum, p) => sum + p.ndvi, 0) / count

  return `\
    纬度: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}
    经度: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}
    数据点数量: ${count}
    平均 NDVI: ${ndvi.toFixed(4)}`
}

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

const Heatmap: React.FC = () => {
  const { data, error } = useSWR(dataUrl, fetcher)

  if (error) return <div>Failed to load...</div>
  if (!data) return <div>Loading...</div>

  const layers = [
    new HexagonLayer({
      id: 'heatmap',
      colorRange: [
        [65, 182, 196],
        [127, 205, 187],
        [199, 233, 180],
        [237, 248, 177],
        [255, 255, 204],
      ],
      coverage: 0.9,
      data,
      elevationRange: [0, 1000],
      elevationScale: data && data.length ? 10 : 0,
      extruded: true,
      getPosition: d => [d.longitude, d.latitude],
      pickable: true,
      radius: 800,
      upperPercentile: 95,
      lowerPercentile: 5,

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

export default Heatmap
