/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  images: {
    domains: ['cbarvnrqvxroetrcuikv.supabase.co', 'www.gravatar.com'],
  },
};

export default nextConfig;