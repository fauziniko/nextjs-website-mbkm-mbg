/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', '::1', '10.10.10.186', '*.local'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio-mbkm.fauziniko.my.id',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://ml-mbkm.fauziniko.my.id,https://website-mbg-mbkm.fauziniko.my.id',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
