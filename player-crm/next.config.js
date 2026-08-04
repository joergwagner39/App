/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  // Static export so the same build can be wrapped by Electron (desktop)
  // and served as a plain set of files; the app is client-only (no
  // server routes), so this works without changes.
  output: process.env.ELECTRON_BUILD ? 'export' : undefined,
}

module.exports = nextConfig
