/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  async redirects() {
    return [
      // Das Tagebuch lag früher unter /journal – alte Lesezeichen und bereits
      // installierte Home-Bildschirm-Symbole landen weiter richtig.
      { source: '/journal', destination: '/', permanent: false },
    ]
  },
}

module.exports = nextConfig
