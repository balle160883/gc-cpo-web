/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
