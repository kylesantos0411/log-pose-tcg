/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://miywbfkbdscnzxbnycme.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_fv6BrsbJZV-hutcDA-pOcA_cR6rxvLE',
  },
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/dev.db'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'en.onepiece-cardgame.com',
      },
      {
        protocol: 'https',
        hostname: 'asia-en.onepiece-cardgame.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'optcg.app',
      },
    ],
  },
};

export default nextConfig;
