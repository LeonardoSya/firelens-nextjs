import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: [
      '@ant-design/charts',
      '@ant-design/plots',
      '@antv/g2',
      'd3-array',
    ],
  },
  env: {
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
  images: {
    domains: ['localhost'],
  },
  reactStrictMode: false,
  output: 'standalone',
}

export default withNextIntl(nextConfig)
