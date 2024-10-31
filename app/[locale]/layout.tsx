import Script from 'next/script'
import type { Metadata } from 'next'
import { Anton, Montserrat } from 'next/font/google'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Providers } from '@/lib/provider'
import RootLayout from '@/app/[locale]/root-layout'
import '@/app/styles/globals.css'

const anton = Anton({ subsets: ['latin'], variable: '--font-anton', weight: '400' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const tiny5 = localFont({ src: '../../public/fonts/Tiny5.ttf', variable: '--font-tiny5' })

export const metadata: Metadata = {
  title: 'Firelens 全球火灾动态监测平台 多维热点数据一站式解决方案',
  description: '全球火灾动态监测平台',
}

export default async function Layout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!routing.locales.includes(locale as any)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale} className={`dark ${anton.variable} ${montserrat.variable} ${tiny5.variable}`}>
      <head>
        <link rel='icon' type='image/png' href='/favicon.png' />
        <link href='https://api.mapbox.com/mapbox-gl-js/v2.8.1/mapbox-gl.css' rel='stylesheet' />
      </head>
      <body>
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <RootLayout>{children}</RootLayout>
          </NextIntlClientProvider>
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
