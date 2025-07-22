/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'wodify.link',
          },
        ],
        destination: 'https://www.wodify.link',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
