'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { throttle } from 'lodash'
import { format } from 'date-fns'
import mapboxgl from 'mapbox-gl'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GlobeMinimap from 'mapbox-gl-globe-minimap'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'
import { useAppSelector } from '@/lib/hooks'
import { RootState } from '@/lib/store'
import SideMenu from '@/components/side-menu'
import { type FirePoint, MapboxEvent } from 'map-types'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const baseUrl = 'http://localhost:3000'

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [mapState, setMapState] = useState({
    isMapLoaded: false,
    style: 'mapbox://styles/mapbox/standard',
    showWindLayer: false,
  })
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false)
  const [firePoint, setFirePoint] = useState<FirePoint | null>(null)
  const [firePointId, setFirePointId] = useState<number>(0) // 控制火点信息弹窗显示
  const filterParams = useAppSelector((state: RootState) => state.filter)

  // 初始化地图
  useEffect(() => {
    if (!mapboxgl.supported()) {
      alert('您的浏览器不支持Mapbox')
      return
    }
    if (!map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapState.style,
        center: [116.27, 40],
        zoom: 5,
        accessToken,
        // pitch: 45,
        attributionControl: false,
      })

      map.current.on('load', () => {
        setMapState(prev => ({ ...prev, isMapLoaded: true }))
      })
    }
    map.current.on('style.load', () => {
      map.current.setConfigProperty('basemap', 'lightPreset', 'dusk')
      map.current.setConfigProperty('basemap', 'show3dObjects', true)
    })

    let globeMinimap: unknown
    map.current.on('load', () => {
      // 地图控件
      setMapState(prev => ({ ...prev, isMapLoaded: true }))

      map.current.addControl(
        new MapboxGeocoder({
          accessToken,
          mapboxgl: mapboxgl,
        }),
      )
      map.current.addControl(new mapboxgl.NavigationControl())
      map.current.addControl(new mapboxgl.FullscreenControl())
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: false,
        }),
      )
      globeMinimap = new GlobeMinimap({
        landColor: 'rgb(250,250,250)',
        waterColor: 'rgba(3,7,18,.8)',
      })
      map.current.addControl(globeMinimap as mapboxgl.IControl, 'top-left')
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [mapState.style])

  // 监听style更新底图样式
  useEffect(() => {
    if (!map.current || !mapState.isMapLoaded) return

    map.current.setStyle(mapState.style)
    if (mapState.style === 'mapbox://styles/mapbox/standard') {
      map.current.on('style.load', () => {
        if (map.current.getConfigProperty('basemap')) {
          map.current.setConfigProperty('basemap', 'lightPreset', 'dusk')
          map.current.setConfigProperty('basemap', 'show3dObjects', true)
        }
      })
    }
  }, [mapState.isMapLoaded, mapState.style])

  // 加载火点数据并处理交互事件
  const fetchData = useCallback(async () => {
    try {
      setIsDataLoaded(true)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort() // 拦截上一次请求
      }
      abortControllerRef.current = new AbortController() // 被中断的请求会抛出AbortError

      const bounds = map.current.getBounds()
      const baseParams = {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLon: bounds.getWest(),
        maxLon: bounds.getEast(),
        ...filterParams,
      }

      const queryParams = new URLSearchParams(
        Object.entries(baseParams).filter(([value]) => value != null) as [string, string][],
      ).toString()
      const url = `${baseUrl}/api/global-48h-data?${queryParams}`

      const response = await fetch(url, { signal: abortControllerRef.current.signal })
      const data = await response.json()
      if (!data.features || !Array.isArray(data.features)) {
        console.error('Invalid data structure:', data)
        return null
      }
      return data
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted')
      } else {
        console.error('Error fetching data:', error)
      }
      return null
    } finally {
      setIsDataLoaded(false)
    }
  }, [filterParams])

  // 渲染火点数据
  const updateData = useCallback(async () => {
    const data = await fetchData()
    if (!data) {
      console.log('No data received')
      return
    }
    if (map.current.getSource('firePoints')) {
      // 若数据源已存在，使用setData更新数据
      ;(map.current.getSource('firePoints') as mapboxgl.GeoJSONSource).setData(data)
    } else {
      map.current.addSource('firePoints', {
        type: 'geojson',
        data,
      })
      map.current.addLayer({
        id: 'firePointsLayer',
        type: 'circle',
        source: 'firePoints',
        paint: {
          'circle-radius': 6,
          'circle-color': '#e20303',
          'circle-blur': 0.4,
          'circle-stroke-color': '#333333',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.7,
          'circle-emissive-strength': 1,
        },
      })
      map.current.on('mouseenter', 'firePointsLayer', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'firePointsLayer', () => {
        map.current.getCanvas().style.cursor = ''
      })
      map.current.on('click', 'firePointsLayer', (e: MapboxEvent) => {
        const feature = e.features[0]
        const properties = feature.properties
        const coordinates = feature.geometry.coordinates.slice()

        const acqDate = new Date(properties.acq_date)
        const hours = Math.floor(properties.acq_time / 100)
        const minutes = properties.acq_time % 100
        acqDate.setUTCHours(hours, minutes)
        const dateTime = format(acqDate, 'yyyy-MM-dd HH:mm:ss')

        setFirePoint({
          loc: coordinates,
          district: '',
          confidence: properties.confidence,
          frp: properties.frp,
          bright_ti4: properties.bright_ti4,
          bright_ti5: properties.bright_ti5,
          daynight: properties.daynight === 'D',
          dateTime: dateTime,
          satellite: properties.satellite,
          ndvi: properties.ndvi / 10000,
        })
        setFirePointId(properties.bright_ti4)
        map.current.flyTo({
          center: coordinates,
          zoom: 9,
          duration: 2000,
          pitch: 30,
        })
      })
    }
  }, [fetchData])

  const updateOnMove = useCallback(
    throttle(() => {
      updateData()
    }, 500),
    [updateData],
  )

  useEffect(() => {
    if (!map.current || !mapState.isMapLoaded) return
    updateData()
    map.current.on('moveend', updateOnMove)
    map.current.on('zoomend', updateOnMove)

    return () => {
      if (map.current) {
        map.current.off('moveend', updateOnMove)
        map.current.off('zoomend', updateOnMove)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [mapState.isMapLoaded, updateData, updateOnMove])

  useEffect(() => {
    if (map.current && mapState.isMapLoaded) {
      updateData()
    }
    if (!map.current || !mapState.isMapLoaded) return

    // 当底图样式重新加载时重新渲染数据
    map.current.on('style.load', () => {
      updateData()
    })
  }, [mapState.isMapLoaded, updateData])

  // 火点逆向地理编码
  useEffect(() => {
    if (!firePoint) return

    const fetchDistrict = async () => {
      try {
        const geocodingClient = mbxGeocoding({
          accessToken,
        })
        const response = await geocodingClient
          .reverseGeocode({
            query: firePoint.loc,
            limit: 1,
            language: ['zh'],
          })
          .send()

        const match = response.body.features[0]
        if (match) {
          const { context = [] } = match
          const getText = (idPart: string) =>
            context.find((c: { id: string | string[] }) => c.id.includes(idPart))?.text || ''
          const country = getText('country')
          const province = getText('region')
          const city = getText('place')
          const locality = getText('locality')
          setFirePoint(prev => ({
            ...prev,
            district: `${country} ${province} ${city}${locality}`,
          }))
        }
      } catch (error) {
        console.error('Reverse Geocoding Error: ', error)
      }
    }

    fetchDistrict()
  }, [firePoint])

  // 风场图层切换
  useEffect(() => {
    if (!map.current || !mapState.isMapLoaded) return

    const handleStyleLoad = () => {
      setFirePointId(0)
      if (mapState.showWindLayer) {
        try {
          if (!map.current.getSource('raster-array-source')) {
            map.current.addSource('raster-array-source', {
              type: 'raster-array',
              url: 'mapbox://rasterarrayexamples.gfs-winds',
              tileSize: 512,
            })
            if (!map.current.getLayer('wind-layer')) {
              map.current.addLayer({
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
            map.current.easeTo({
              zoom: 2,
              duration: 2000,
            })
            map.current.setFog({
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
        if (map.current.getLayer('wind-layer')) {
          map.current.removeLayer('wind-layer')
        }
        if (map.current.getSource('raster-array-source')) {
          map.current.removeSource('raster-array-source')
        }
        map.current.setFog(null)
        map.current.easeTo({
          zoom: 5,
          duration: 1500,
        })
      }
    }

    const newStyle = mapState.showWindLayer
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/standard'

    if (map.current.getStyle().name !== newStyle) {
      map.current.once('styledata', handleStyleLoad)
      map.current.setStyle(newStyle)
    } else {
      handleStyleLoad()
    }

    return () => {
      if (map.current) {
        map.current.off('style.load', handleStyleLoad)
      }
    }
  }, [mapState.isMapLoaded, mapState.showWindLayer])

  return (
    <>
      {/* 火点信息弹窗 */}
      <AnimatePresence>
        {firePointId !== 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 0 }}
            className='absolute right-32 top-1/2 z-10 max-w-96 transform rounded-xl bg-white bg-opacity-85 p-6 duration-100 dark:bg-gray-950 dark:bg-opacity-80'
          >
            <div
              onClick={() => setFirePointId(0)}
              className='absolute right-2 top-2 transform cursor-pointer text-gray-900 duration-150 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-auto' viewBox='0 0 512 512'>
                <path
                  fill='none'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='32'
                  d='M368 368L144 144M368 144L144 368'
                />
              </svg>
            </div>
            <motion.ul
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              exit='hidden'
              className='space-y-1 font-semibold text-gray-950 dark:text-gray-400'
            >
              {[
                `受灾地区：${firePoint.district}`,
                `火点地理坐标：${firePoint.loc.map(c => c.toFixed(2)).join(', ')}`,
                `火点置信度：${firePoint.confidence}`,
                `Ti4通道亮温 (开尔文)：${firePoint.bright_ti4}`,
                `Ti5通道亮温 (开尔文)：${firePoint.bright_ti5}`,
                `火灾辐射功率 (兆瓦)：${firePoint.frp}`,
                `受灾区域 NDVI：${firePoint.ndvi}`,
                `受灾时间：${firePoint.dateTime}`,
                `受灾时段：${firePoint.daynight ? '白天' : '夜晚'}`,
                `监测卫星：${firePoint.satellite}`,
                `数据来源：VIIRS 375m / NOAA-21`,
              ].map((item, index) => (
                <motion.li key={index} variants={listItemVariants} transition={{ duration: 0.3 }}>
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 地图 */}
      <div ref={mapContainer} className='absolute left-0 h-screen w-screen' />
      <div
        className='relative left-0 top-0 z-10 h-24 w-24 cursor-pointer'
        onClick={() =>
          setMapState(prev =>
            prev.style === 'mapbox://styles/mapbox/standard'
              ? { ...prev, style: 'mapbox://styles/mapbox/standard-satellite' }
              : { ...prev, style: 'mapbox://styles/mapbox/standard' },
          )
        }
      />
      {/* 加载指示器 */}
      {isDataLoaded && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-opacity-50'>
          <div
            style={{
              borderTopColor: 'transparent',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
            className='h-12 w-12 animate-spin rounded-full border-4 border-orange-700/80'
          />
        </div>
      )}
      {/* 侧边栏 */}
      <SideMenu
        toggleWindLayer={() =>
          setMapState(prev => ({ ...prev, showWindLayer: !prev.showWindLayer }))
        }
      />
    </>
  )
}

export default Map
