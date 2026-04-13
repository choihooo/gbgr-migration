import { join } from 'node:path'
// main/src/mainWindow.ts
import { BrowserWindow, app } from 'electron'

const MIN_W = 1280
const MIN_H = 800

async function createWindow() {
  const win = new BrowserWindow({
    show: false,
    useContentSize: true, // 프레임 제외한 콘텐츠 영역 기준
    width: MIN_W,
    height: MIN_H,
    minWidth: MIN_W,
    minHeight: MIN_H,
    fullscreenable: false, // 전체 화면 금지(원하면 true)
    // maximizable: false,          // 최대화 버튼 자체를 막고 싶으면 주석 해제
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: !app.isPackaged,
      allowRunningInsecureContent: false,
      backgroundThrottling: false,
    },
  })

  win.on('ready-to-show', () => {
    win.center()
    win.show()
  })

  const pageUrl =
    import.meta.env.DEV && process.env.VITE_DEV_SERVER_URL
      ? process.env.VITE_DEV_SERVER_URL
      : 'https://app.bugi.co.kr/'

  await win.loadURL(pageUrl)
  return win
}

export async function restoreOrCreateWindow() {
  let w = BrowserWindow.getAllWindows().find(x => !x.isDestroyed())
  if (!w) w = await createWindow()
  if (w.isMinimized()) w.restore()
  w.focus()
}
