import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./map'), {
  ssr: false,
})

const MapView: React.FC = () => {
  return <Map />
}

export default MapView
