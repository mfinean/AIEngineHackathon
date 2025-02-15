/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['serpapi.com', 'encrypted-tbn0.gstatic.com'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SERP_API_KEY: process.env.SERP_API_KEY,
  },
}

module.exports = nextConfig 