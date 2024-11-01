'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GlobeMinimap from 'mapbox-gl-globe-minimap'

import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import SideMenu from '@/components/side-menu'

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<mapboxgl.Map | null>(null)
  const [mapState, setMapState] = useState({
    isMapLoaded: false,
    style: 'mapbox://styles/mapbox/standard',
    showWindLayer: false,
  })

  // 初始化地图
  useEffect(() => {
    if (!mapboxgl.supported()) {
      alert('您的浏览器不支持Mapbox')
      return
    }

    if (!mapInstance.current && mapContainer.current) {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapState.style,
        center: [116.27, 40],
        zoom: 5,
        accessToken,
        attributionControl: false,
      })

      map.on('load', () => {
        setMapState(prev => ({ ...prev, isMapLoaded: true }))

        // 地图控件
        map.addControl(new MapboxGeocoder({ accessToken, mapboxgl: mapboxgl }))
        map.addControl(new mapboxgl.NavigationControl())
        map.addControl(new mapboxgl.FullscreenControl())
        map.addControl(new mapboxgl.GeolocateControl())
        map.addControl(
          new GlobeMinimap({
            landColor: 'rgb(250,250,250)',
            waterColor: 'rgba(3,7,18,.8)',
          }),
          'top-left',
        )
      })

      // 光影效果
      map.on('style.load', () => {
        map.setConfigProperty('basemap', 'lightPreset', 'dusk')
        map.setConfigProperty('basemap', 'show3dObjects', true)
      })

      mapInstance.current = map
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('load', () => {})
        mapInstance.current.off('style.load', () => {})
        mapInstance.current.off('styledata', () => {})

        if (mapInstance.current._controls) {
          const controls = [...mapInstance.current._controls]
          controls.forEach(control => {
            try {
              mapInstance.current.removeControl(control)
            } catch (error) {
              console.error('Error removing control:', error)
            }
          })
        }

        if (mapInstance.current.getStyle()) {
          const layers = mapInstance.current.getStyle().layers || []
          layers.forEach(layer => {
            if (mapInstance.current.getLayer(layer.id)) {
              mapInstance.current.removeLayer(layer.id)
            }
          })

          const sources = mapInstance.current.getStyle().sources || {}
          Object.keys(sources).forEach(sourceId => {
            if (mapInstance.current.getSource(sourceId)) {
              mapInstance.current.removeSource(sourceId)
            }
          })
        }

        try {
          mapInstance.current.remove()
        } catch (error) {
          console.error('Error removing map:', error)
        }

        mapInstance.current = null
      }
    }
  }, [])

  // 底图切换
  useEffect(() => {
    if (!mapInstance.current || !mapState.isMapLoaded) return

    const applyStyle = () => {
      if (mapState.style === 'mapbox://styles/mapbox/standard') {
        mapInstance.current.setConfigProperty('basemap', 'lightPreset', 'dusk')
        mapInstance.current.setConfigProperty('basemap', 'show3dObjects', true)
      }
    }

    mapInstance.current.once('style.load', applyStyle)
    mapInstance.current.setStyle(mapState.style)

    return () => {
      if (mapInstance.current) mapInstance.current.off('style.load', applyStyle)
    }
  }, [mapState.style])

  // 风场图层
  useEffect(() => {
    if (!mapInstance.current) return

    const handleStyleLoad = () => {
      if (mapState.showWindLayer) {
        try {
          if (!mapInstance.current.getSource('raster-array-source')) {
            mapInstance.current.addSource('raster-array-source', {
              type: 'raster-array',
              url: 'mapbox://rasterarrayexamples.gfs-winds',
              tileSize: 512,
            })
            if (!mapInstance.current.getLayer('wind-layer')) {
              mapInstance.current.addLayer({
                id: 'wind-layer',
                type: 'raster-particle',
                source: 'raster-array-source',
                'source-layer': '10winds',
                paint: {
                  'raster-particle-speed-factor': 0.4,
                  'raster-particle-fade-opacity-factor': 0.9,
                  'raster-particle-reset-rate-factor': 0.4,
                  'raster-particle-count': 4000,
                  'raster-particle-max-speed': 40,
                  'raster-particle-color': [
                    'interpolate',
                    ['linear'],
                    ['raster-particle-speed'],
                    1.5,
                    'rgba(134,163,171,256)',
                    2.5,
                    'rgba(126,152,188,256)',
                    4.12,
                    'rgba(110,143,208,256)',
                    4.63,
                    'rgba(110,143,208,256)',
                    6.17,
                    'rgba(15,147,167,256)',
                    7.72,
                    'rgba(15,147,167,256)',
                    9.26,
                    'rgba(57,163,57,256)',
                    10.29,
                    'rgba(57,163,57,256)',
                    11.83,
                    'rgba(194,134,62,256)',
                    13.37,
                    'rgba(194,134,63,256)',
                    14.92,
                    'rgba(200,66,13,256)',
                    16.46,
                    'rgba(200,66,13,256)',
                    18.0,
                    'rgba(210,0,50,256)',
                    20.06,
                    'rgba(215,0,50,256)',
                    21.6,
                    'rgba(175,80,136,256)',
                    23.66,
                    'rgba(175,80,136,256)',
                    25.21,
                    'rgba(117,74,147,256)',
                    27.78,
                    'rgba(117,74,147,256)',
                    29.32,
                    'rgba(68,105,141,256)',
                    31.89,
                    'rgba(68,105,141,256)',
                    33.44,
                    'rgba(194,251,119,256)',
                    42.18,
                    'rgba(194,251,119,256)',
                    43.72,
                    'rgba(241,255,109,256)',
                    48.87,
                    'rgba(241,255,109,256)',
                    50.41,
                    'rgba(256,256,256,256)',
                    57.61,
                    'rgba(256,256,256,256)',
                    59.16,
                    'rgba(0,256,256,256)',
                    68.93,
                    'rgba(0,256,256,256)',
                    69.44,
                    'rgba(256,37,256,256)',
                  ],
                },
              })
            }
            mapInstance.current.easeTo({
              zoom: 2,
              duration: 2000,
            })
            mapInstance.current.setFog({
              'horizon-blend': 0.01,
              'space-color': 'rgb(11, 11, 25)',
              'star-intensity': 0.6,
              color: 'rgb(11, 11, 25)',
              'high-color': 'rgb(11, 11, 25)',
            })
          }
        } catch (error) {
          console.error('Error loading wind layer:', error)
        }
      } else {
        if (mapInstance.current.getLayer('wind-layer')) {
          mapInstance.current.removeLayer('wind-layer')
        }
        if (mapInstance.current.getSource('raster-array-source')) {
          mapInstance.current.removeSource('raster-array-source')
        }
        mapInstance.current.setFog(null)
        mapInstance.current.easeTo({
          zoom: 5,
          duration: 1500,
        })
      }
    }

    const newStyle = mapState.showWindLayer
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/standard'

    if (mapInstance.current.loaded() && mapInstance.current.getStyle().name !== newStyle) {
      mapInstance.current.once('styledata', handleStyleLoad)
      mapInstance.current.setStyle(newStyle)
    } else if (mapInstance.current.loaded()) {
      handleStyleLoad()
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('style.load', handleStyleLoad)
      }
    }
  }, [mapState.showWindLayer])

  return (
    <>
      <div ref={mapContainer} className='left-0 h-screen w-screen' />
      <button
        className='absolute left-0 top-32 z-50 h-24 w-24 cursor-pointer'
        onClick={() =>
          setMapState(prev => ({
            ...prev,
            style:
              prev.style === 'mapbox://styles/mapbox/standard'
                ? 'mapbox://styles/mapbox/standard-satellite'
                : 'mapbox://styles/mapbox/standard',
          }))
        }
      />

      {/* 侧边栏 */}
      <SideMenu
        toggleWindLayer={() => {
          console.log('toggleWindLayer')
          setMapState(prev => ({ ...prev, showWindLayer: !prev.showWindLayer }))
        }}
      />
    </>
  )
}

export default Map
