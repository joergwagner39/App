const { Jimp } = require('jimp')
const path = require('path')

const NAVY = 0x0d1622ff
const GREEN = 0x8dc63fff

async function makeIcon(size, outPath) {
  const img = new Jimp({ width: size, height: size, color: NAVY })
  const barHeight = Math.round(size * 0.12)
  for (let y = size - barHeight; y < size; y++) {
    for (let x = 0; x < size; x++) {
      img.setPixelColor(GREEN, x, y)
    }
  }
  await img.write(outPath)
  console.log('wrote', outPath)
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public')
  await makeIcon(192, path.join(publicDir, 'icon-192.png'))
  await makeIcon(512, path.join(publicDir, 'icon-512.png'))
  await makeIcon(180, path.join(publicDir, 'apple-touch-icon.png'))
}

main()
