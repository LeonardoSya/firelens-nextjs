'use client'

import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GlobeMinimap from 'mapbox-gl-globe-minimap'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import SideMenu from '@/components/side-menu'
import { BASE_URL } from '@/lib/api'
import Chat from '@/components/ai/chat'
import { useAppSelector } from '@/lib/hooks'
import { RootState } from '@/lib/store'
import { type FirePoint } from 'map-types'
import { format } from 'date-fns'
import { throttle } from 'lodash'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const Map: React.FC = () => {
  const t = useTranslations('map')
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<mapboxgl.Map | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [mapState, setMapState] = useState({
    isMapLoaded: false,
    style: 'mapbox://styles/mapbox/standard',
    showWindLayer: false,
  })
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false)
  const [firePoint, setFirePoint] = useState<FirePoint | null>(null)
  const [showFirePointId, setShowFirePointId] = useState<number>(0)
  const [firePointPanelPos, setFirePointPanelPos] = useState({ x: 0, y: 0 })
  const constraintsRef = useRef<HTMLDivElement>(null)

  const filterParams = useAppSelector((state: RootState) => state.filter)

  // 初始化地图
  useEffect(() => {
    if (!mapboxgl.supported()) {
      alert(t('browserNotSupported'))
      return
    }

    if (!mapInstance.current && mapContainer.current) {
      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapState.style,
        center: [116.27, 40],
        zoom: 5,
        accessToken,
        attributionControl: false,
      })

      mapInstance.current.on('load', () => {
        setMapState(prev => ({ ...prev, isMapLoaded: true }))

        // 地图控件
        const geocoder = new MapboxGeocoder({
          accessToken,
          mapboxgl: mapboxgl,
          placeholder: t('searchPlaceholder'),
        })

        const geocoderContainer = document.createElement('div')
        geocoderContainer.className = 'geocoder-container'
        mapInstance.current.addControl(geocoder, 'top-right')

        const style = document.createElement('style')
        style.textContent = `
          @media (max-width: 768px) {
            .mapboxgl-ctrl-geocoder {
              min-width: 120px !important;
              width: auto !important;
              max-width: 160px !important;
            }
            .mapboxgl-ctrl-geocoder--input {
              height: 36px !important;
              font-size: 14px !important;
            }
            .mapboxgl-ctrl-geocoder--icon {
              top: 8px !important;
            }
          }
        `
        document.head.appendChild(style)

        mapInstance.current.addControl(new mapboxgl.NavigationControl())
        mapInstance.current.addControl(new mapboxgl.FullscreenControl())
        mapInstance.current.addControl(new mapboxgl.GeolocateControl())
        mapInstance.current.addControl(
          new GlobeMinimap({
            landColor: 'rgb(250,250,250)',
            waterColor: 'rgba(3,7,18,.8)',
          }),
          'top-left',
        )
      })

      // 光影效果
      mapInstance.current.on('style.load', () => {
        mapInstance.current.setConfigProperty('basemap', 'lightPreset', 'dusk')
        mapInstance.current.setConfigProperty('basemap', 'show3dObjects', true)
      })
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

  // 加载火点数据
  const fetchData = useCallback(async () => {
    try {
      setIsDataLoaded(true)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const bounds = mapInstance.current.getBounds()
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

      const resData = await fetch(`${BASE_URL}/api/map?${queryParams}`, {
        signal: abortControllerRef.current.signal,
      }).then(res => res.json())

      if (!resData.features || !Array.isArray(resData.features)) {
        console.error('Invalid data sturcture: ', resData)
        return null
      }
      return resData
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError')
        console.error('Error fetchig data: ', error)
      return null
    } finally {
      setIsDataLoaded(false)
    }
  }, [filterParams])

  // 渲染火点数据
  const renderData = useCallback(async () => {
    const data = await fetchData()
    if (!data) {
      console.log('No data received')
      return
    }
    if (mapInstance.current.getSource('fire_points')) {
      // 若数据源已存在，直接使用setData更新数据
      ;(mapInstance.current.getSource('fire_points') as mapboxgl.GeoJSONSource).setData(data)
    } else {
      mapInstance.current.addSource('fire_points', {
        type: 'geojson',
        data,
      })

      // 脉冲光环图层（底层）
      mapInstance.current.addLayer({
        id: 'fire_points_pulse',
        type: 'circle',
        source: 'fire_points',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ea580c',
          'circle-opacity': 0.6,
          'circle-blur': 0.8,
        },
      })

      // 火点主图层（顶层）
      mapInstance.current.addLayer({
        id: 'fire_points_layer',
        type: 'circle',
        source: 'fire_points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ea580c',
          'circle-blur': 0.2,
          'circle-stroke-color': '#7c2d12',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.8,
          'circle-emissive-strength': 1,
        },
      })

      // 脉冲动画 - 节流到 ~24fps 优化性能
      let lastTime = 0
      const frameInterval = 42 // ~24fps (1000/24 ≈ 42ms)
      const animatePulse = (currentTime: number) => {
        if (currentTime - lastTime >= frameInterval) {
          lastTime = currentTime
          const time = currentTime / 1000
          const pulseRadius = 8 + Math.sin(time * 2.5) * 4
          const pulseOpacity = 0.4 + Math.sin(time * 2.5) * 0.3

          if (mapInstance.current?.getLayer('fire_points_pulse')) {
            mapInstance.current.setPaintProperty('fire_points_pulse', 'circle-radius', pulseRadius)
            mapInstance.current.setPaintProperty(
              'fire_points_pulse',
              'circle-opacity',
              pulseOpacity,
            )
          }
        }
        requestAnimationFrame(animatePulse)
      }
      requestAnimationFrame(animatePulse)
      // 鼠标事件
      mapInstance.current.on('mouseenter', 'fire_points_layer', () => {
        mapInstance.current.getCanvas().style.cursor = 'pointer'
      })
      mapInstance.current.on('mouseleave', 'fire_points_layer', () => {
        mapInstance.current.getCanvas().style.cursor = ''
      })
      mapInstance.current.on('click', 'fire_points_layer', e => {
        const feature = e.features?.[0] as mapboxgl.GeoJSONFeature
        const properties = feature.properties
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice()
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
        setShowFirePointId(properties.bright_ti4)
        mapInstance.current.flyTo({
          center: coordinates as [number, number],
          zoom: 9,
          duration: 2000,
          pitch: 30,
        })
      })
    }
  }, [fetchData])

  const updateOnMove = useCallback(
    throttle(() => {
      renderData()
    }, 500),
    [renderData],
  )

  // 地图加载后挂载渲染火点逻辑
  useEffect(() => {
    if (!mapInstance.current) return
    renderData()
    mapInstance.current.on('moveend', updateOnMove)
    mapInstance.current.on('zoomend', updateOnMove)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('moveend', updateOnMove)
        mapInstance.current.off('zoomend', updateOnMove)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [mapState.isMapLoaded, renderData, updateOnMove])

  useEffect(() => {
    if (mapInstance.current && mapState.isMapLoaded) {
      renderData()
    } else {
      return
    }
    mapInstance.current.on('style.load', () => {
      renderData()
    })
  }, [mapState.isMapLoaded])

  // 逆向地理编码
  useEffect(() => {
    if (!firePoint?.loc) return

    const getDistrict = async () => {
      try {
        const geocodingClient = mbxGeocoding({ accessToken })
        const res = await geocodingClient
          .reverseGeocode({ query: firePoint.loc, limit: 1, language: ['zh'] })
          .send()

        const match = res.body.features[0]
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

    getDistrict()
  }, [firePoint?.loc])

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

  // 监听图表点击事件，跳转到对应坐标
  useEffect(() => {
    const handleChartFlyTo = (
      event: CustomEvent<{ latitude: number, longitude: number, frp: number }>,
    ) => {
      if (!mapInstance.current) return
      const { latitude, longitude, frp } = event.detail

      // 根据 FRP 强度决定缩放级别
      const zoom = frp > 30 ? 12 : frp > 15 ? 10 : 9

      // 计算偏移量：将目标点向左偏移，避免被右侧 Chat 窗口遮挡
      const mapWidth = mapInstance.current.getContainer().clientWidth
      const offsetPixels = mapWidth * 0.3

      mapInstance.current.flyTo({
        center: [longitude, latitude],
        zoom,
        duration: 2000,
        pitch: 45,
        bearing: 0,
        padding: { right: offsetPixels, left: 0, top: 0, bottom: 0 },
      })
    }

    window.addEventListener('firelens:map-fly-to', handleChartFlyTo as EventListener)
    return () => {
      window.removeEventListener('firelens:map-fly-to', handleChartFlyTo as EventListener)
    }
  }, [])

  // 风场图层
  useEffect(() => {
    if (!mapInstance.current || !mapState.isMapLoaded) return

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
      {/* 地图及控件 */}
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

      {/* 火点信息弹窗 */}
      <div ref={constraintsRef} className='pointer-events-none fixed inset-0 z-10' />
      <AnimatePresence>
        {showFirePointId !== 0 && (
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              setFirePointPanelPos(prev => ({
                x: prev.x + info.offset.x,
                y: prev.y + info.offset.y,
              }))
            }}
            initial={{ opacity: 0, scale: 0.95, x: firePointPanelPos.x, y: firePointPanelPos.y }}
            animate={{ opacity: 1, scale: 1, x: firePointPanelPos.x, y: firePointPanelPos.y }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='fixed right-4 top-1/2 z-20 max-w-96 -translate-y-1/2 cursor-grab rounded-xl bg-white/90 p-4 pr-10 text-xs shadow-2xl backdrop-blur-md active:cursor-grabbing dark:bg-gray-950/90 md:right-[26rem]'
            style={{ touchAction: 'none' }}
          >
            {/* 拖动提示条 */}
            <div className='absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300 dark:bg-gray-600' />
            {/* 关闭按钮 */}
            <div
              onClick={() => setShowFirePointId(0)}
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
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
              initial='hidden'
              animate='visible'
              exit='hidden'
              className='mt-2 space-y-1.5 font-semibold text-gray-950 dark:text-gray-400'
            >
              {[
                `${t('firePoint.district')}：${firePoint.district}`,
                `${t('firePoint.coordinates')}：${firePoint.loc.map(c => c.toFixed(2)).join(', ')}`,
                `${t('firePoint.confidence')}：${firePoint.confidence}`,
                `${t('firePoint.brightTi4')}：${firePoint.bright_ti4}`,
                `${t('firePoint.brightTi5')}：${firePoint.bright_ti5}`,
                `${t('firePoint.frp')}：${firePoint.frp}`,
                `${t('firePoint.ndvi')}：${firePoint.ndvi}`,
                `${t('firePoint.dateTime')}：${firePoint.dateTime}`,
                `${t('firePoint.dayNight')}：${firePoint.daynight ? t('firePoint.day') : t('firePoint.night')}`,
                `${t('firePoint.satellite')}：${firePoint.satellite}`,
                `${t('firePoint.dataSource')}：${t('firePoint.dataSourceValue')}`,
              ].map((item, index) => (
                <motion.li
                  key={index}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -10 },
                  }}
                  transition={{ duration: 0.25 }}
                >
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>

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
        toggleWindLayer={() => {
          console.log('toggleWindLayer')
          setMapState(prev => ({ ...prev, showWindLayer: !prev.showWindLayer }))
        }}
      />
      <Chat />
    </>
  )
}

export default Map
