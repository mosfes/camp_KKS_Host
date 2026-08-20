/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    // Bypass Vercel's image optimizer (quota-limited on the free plan) and
    // let Cloudinary resize/compress via URL transformations instead.
    loader: 'custom',
    loaderFile: './lib/cloudinary-image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Keep Prisma Client working in serverless environments
  serverExternalPackages: ['@prisma/client'],
};

module.exports = nextConfig;
