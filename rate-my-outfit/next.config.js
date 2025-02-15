/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SERP_API_KEY: process.env.SERP_API_KEY,
    FASHN_API_KEY: process.env.FASHN_API_KEY,
  },
}

module.exports = nextConfig 