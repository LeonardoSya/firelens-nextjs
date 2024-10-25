import Script from 'next/script'
import type { Metadata } from 'next'
import { Providers } from '@/lib/provider'
import RootLayout from '@/app/root-layout'
import { Anton, Montserrat } from 'next/font/google'
import localFont from 'next/font/local'
import '@/app/styles/globals.css'

const anton = Anton({ subsets: ['latin'], variable: '--font-anton', weight: '400' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const tiny5 = localFont({ src: '../public/fonts/Tiny5.ttf', variable: '--font-tiny5' })

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: 'Firelens 全球火灾动态监测平台 多维热点数据一站式解决方案',
  description: '全球火灾动态监测平台',
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode,
}>) {
  return (
    <html lang='en' className={`dark ${anton.variable} ${montserrat.variable} ${tiny5.variable}`}>
      <head>
        <link rel='icon' type='image/png' href='/favicon.png' />
        <link href='https://api.mapbox.com/mapbox-gl-js/v2.8.1/mapbox-gl.css' rel='stylesheet' />
      </head>
      <body>
        <Providers>
          <RootLayout>{children}</RootLayout>
        </Providers>
        <Script
          src='https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js'
          type='module'
        />
        <Script src='https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js' noModule />
      </body>
    </html>
  )
}
