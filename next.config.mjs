/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // pdfjs-dist optionally requires "canvas" (Node only). We only use it in the browser.
    config.resolve.alias.canvas = false;
    return config;
  },
};
export default nextConfig;
