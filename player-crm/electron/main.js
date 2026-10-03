const { app, BrowserWindow } = require('electron')
const path = require('path')
const serve = require('electron-serve')

const isDev = !app.isPackaged

// electron-serve registers a custom "app://" protocol that reads files
// straight from disk, instead of file:// (which breaks Next.js's absolute
// /_next/... asset paths) or a real TCP server (which can trigger Windows
// Firewall prompts and silently fail).
const loadApp = serve({ directory: path.join(__dirname, '..', 'out') })

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
    await loadApp(win)
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
