/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // libSQL bringt optionale native Bindings mit und darf nicht gebündelt werden.
    serverComponentsExternalPackages: ['@libsql/client'],
  },
}

module.exports = nextConfig
