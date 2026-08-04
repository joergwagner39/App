/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // better-sqlite3 ist ein natives Modul und darf nicht gebündelt werden.
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}

module.exports = nextConfig
