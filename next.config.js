/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // libSQL bringt optionale native Bindings mit und darf nicht gebündelt werden.
    serverComponentsExternalPackages: ['@libsql/client'],
    serverActions: {
      // Der Tabellen-Import schickt die Rohdaten im Formular — 1 MB reicht dafür nicht.
      bodySizeLimit: '8mb',
    },
  },
}

module.exports = nextConfig
