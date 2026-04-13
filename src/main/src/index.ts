import { appendFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { config as loadDotenv } from 'dotenv'
import { app, ipcMain, nativeTheme } from 'electron'
import { autoUpdater } from 'electron-updater'
import './security-restrictions'
import { setupAnalyticsHandlers } from '/@/analytics'
import { restoreOrCreateWindow } from '/@/mainWindow'
import { setupNotificationHandlers } from '/@/notificationHandlers'
import { initializeUpdater, setupUpdaterHandlers } from '/@/updaterHandlers'
import {
  closeWidgetWindow,
  isWidgetWindowOpen,
  openWidgetWindow,
} from '/@/widgetWindow'

type StartupSettingsResponse = {
  success: boolean
  enabled: boolean
  supported: boolean
  error?: string
}

const isStartupSupported = () =>
  process.platform === 'darwin' || process.platform === 'win32'

const getLoginItemSettingsOptions = (openAtLogin: boolean) => {
  const options: Parameters<typeof app.setLoginItemSettings>[0] = {
    openAtLogin,
  }

  if (process.defaultApp && process.argv[1]) {
    options.path = process.execPath
    options.args = [resolve(process.argv[1])]
  }

  return options
}

const getStartupSettings = (): StartupSettingsResponse => {
  if (!isStartupSupported()) {
    return {
      success: true,
      enabled: false,
      supported: false,
    }
  }

  try {
    const settings = app.getLoginItemSettings()

    return {
      success: true,
      enabled: settings.openAtLogin,
      supported: true,
    }
  } catch (error) {
    console.error('Failed to get startup settings:', error)

    return {
      success: false,
      enabled: false,
      supported: true,
      error: '자동 실행 상태를 불러오지 못했습니다.',
    }
  }
}

// 개발 환경: 루트 .env, 패키징 환경: resources/config/runtime.env
loadDotenv({ path: join(process.cwd(), '.env') })
loadDotenv({ path: join(process.resourcesPath, 'config', 'runtime.env') })

/**
 * Setup IPC handlers for Electron-specific features
 */
function setupAPIHandlers() {
  // Write log file handler (Electron 전용 기능)
  ipcMain.handle(
    'api:writeLog',
    async (_event, data: string, filename?: string) => {
      try {
        const userDataPath = app.getPath('userData')
        const logDir = join(userDataPath, 'logs')
        await mkdir(logDir, { recursive: true })

        const logFilename =
          filename || `score_${new Date().toISOString().split('T')[0]}.log`
        const logPath = join(logDir, logFilename)

        const timestamp = new Date().toISOString()
        const logLine = `[${timestamp}] ${data}\n`

        await appendFile(logPath, logLine, 'utf-8')

        return { success: true, path: logPath }
      } catch (error) {
        console.error('Failed to write log:', error)
        throw error
      }
    },
  )

  /* 리액트에서 Main Process로 오는 요청을 처리하는 함수*/

  /* 위젯 오픈 요청 핸들러 */
  ipcMain.handle('widget:open', async () => {
    try {
      await openWidgetWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to open widget window:', error)
      throw error
    }
  })

  /* 위젯 닫기 요청 핸들러 */
  ipcMain.handle('widget:close', () => {
    try {
      closeWidgetWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to close widget window:', error)
      throw error
    }
  })

  /* 시스템 테마 조회 핸들러 */
  ipcMain.handle('theme:getSystemTheme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  ipcMain.handle('startup:get', () => {
    return getStartupSettings()
  })

  ipcMain.handle('startup:set', (_event, enabled: boolean) => {
    if (!isStartupSupported()) {
      return {
        success: true,
        enabled: false,
        supported: false,
      } satisfies StartupSettingsResponse
    }

    try {
      app.setLoginItemSettings(getLoginItemSettingsOptions(enabled))
      return getStartupSettings()
    } catch (error) {
      console.error('Failed to update startup settings:', error)

      const currentSettings = getStartupSettings()
      return {
        ...currentSettings,
        success: false,
        error: '자동 실행 설정을 변경하지 못했습니다.',
      } satisfies StartupSettingsResponse
    }
  })

  /* Notification 핸들러 설정 */
  setupNotificationHandlers()

  /* Updater 핸들러 설정 */
  setupUpdaterHandlers()

  /* Analytics 핸들러 설정 */
  setupAnalyticsHandlers()
}
/* 위젯 상태 확인 요청 핸들러 */
ipcMain.handle('widget:isOpen', () => {
  return isWidgetWindowOpen()
})

/**
 * Set App User Model ID for Windows notifications
 * mac은 필요 x
 */
if (process.platform === 'win32') {
  app.setAppUserModelId('거부기린')
}

/**
 * Prevent multiple instances
 */
const isSingleInstance = app.requestSingleInstanceLock()
if (!isSingleInstance) {
  app.quit()
  process.exit(0)
}
app.on('second-instance', restoreOrCreateWindow)

/**
 * Enable Hardware Acceleration for GPU support (required for WebGL)
 */
// app.disableHardwareAcceleration(); // GPU 사용을 위해 주석 처리

// GPU 가속 활성화를 위한 command line switches
app.commandLine.appendSwitch('enable-gpu')
app.commandLine.appendSwitch('enable-webgl')
app.commandLine.appendSwitch('enable-accelerated-2d-canvas')
app.commandLine.appendSwitch('ignore-gpu-blacklist') // GPU 블랙리스트 무시

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * @see https://www.electronjs.org/docs/v14-x-y/api/app#event-activate-macos Event: 'activate'
 */
app.on('activate', restoreOrCreateWindow)

/**
 * Create app window when background process will be ready
 */
app
  .whenReady()
  .then(restoreOrCreateWindow)
  .then(async () => {
    // 앱 시작 시 app_open 이벤트 전송
    try {
      const { postToGa4 } = await import('/@/analytics')
      await postToGa4('app_open', {})
      console.log('[analytics] app_open event sent')
    } catch (error) {
      console.warn('[analytics] Failed to send app_open event:', error)
    }
  })
  .then(() => {
    /**
     * Install React & Redux devtools in development mode only
     */
    if (import.meta.env.DEV) {
      try {
        // 동적 import로 devtools 설치 (프로덕션에서 오류 방지)
        import('electron-devtools-installer')
          .then(
            ({
              default: installExtension,
              REACT_DEVELOPER_TOOLS,
              REDUX_DEVTOOLS,
            }) => {
              installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
                .then(name => console.log(`Added Extensions:  ${name}`))
                .catch(err =>
                  console.log('An error occurred installing extensions: ', err),
                )
            },
          )
          .catch(error => {
            console.log('DevTools installation skipped:', error)
          })
      } catch (error) {
        console.log('DevTools installation skipped:', error)
      }
    } else {
      console.log('DevTools installation skipped in production mode')
    }

    // Setup IPC handlers for Electron-specific features
    setupAPIHandlers()

    /**
     * Initialize auto updater in production mode only
     * (setupUpdaterHandlers로 리스너가 먼저 등록된 뒤에 체크해야 이벤트를 놓치지 않음)
     */
    if (import.meta.env.PROD) {
      initializeUpdater()
      // 앱 시작 시 자동으로 업데이트 체크 (선택사항)
      // 필요시 주석 해제
      autoUpdater.checkForUpdates()
    }
  })
  .catch(e => console.error('Failed during app startup:', e))
