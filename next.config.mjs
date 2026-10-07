/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      // Keep soft-navigated dashboard/admin pages warm longer so jumps feel instant.
      dynamic: 120,
      static: 300,
    },
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
