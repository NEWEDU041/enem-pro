import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  webpack: (config) => {
    const reactPath = require.resolve('react')
    const reactDomPath = require.resolve('react-dom')
    config.resolve.alias = {
      ...config.resolve.alias,
      react: reactPath,
      'react-dom': reactDomPath,
    }
    return config
  },
}

export default nextConfig
