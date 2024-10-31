import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/app/[locale]/map/map'), {
  ssr: false,
})

const MapView: React.FC = () => {
  return <Map />
}

export default MapView
