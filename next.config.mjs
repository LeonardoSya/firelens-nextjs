/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
  images: {
    domains: ['localhost'],
  },
  reactStrictMode: false,
}

export default nextConfig
