const { app, BrowserWindow } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')

const isDev = !app.isPackaged

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// Next.js static exports reference assets with absolute paths (/_next/...),
// which don't resolve under file://. Serving the exported "out" folder over
// a plain local HTTP server sidesteps that entirely.
function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0])
      if (urlPath === '/') urlPath = '/index.html'
      let filePath = path.join(rootDir, urlPath)

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403)
        res.end()
        return
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // Next export writes per-route HTML files; fall back for direct hits.
          fs.readFile(path.join(rootDir, '404.html'), (err2, data2) => {
            res.writeHead(err2 ? 404 : 200, {
              'Content-Type': 'text/html',
            })
            res.end(err2 ? 'Not found' : data2)
          })
          return
        }
        const ext = path.extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
        res.end(data)
      })
    })

    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port)
    })
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Player Relations CRM',
    backgroundColor: '#0d1622',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:3001')
  } else {
    const outDir = path.join(__dirname, '..', 'out')
    const port = await startStaticServer(outDir)
    win.loadURL(`http://127.0.0.1:${port}`)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
