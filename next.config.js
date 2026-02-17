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
}

module.exports = nextConfig
