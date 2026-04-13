#!/usr/bin/env node

;(async () => {
  const { createServer, build, createLogger } = await import('vite')
  const electronPath = (await import('electron')).default
  const { spawn } = await import('node:child_process')
  const { generateAsync } = await import('dts-for-context-bridge')

  /** @type 'production' | 'development'' */
  const mode = (process.env.MODE = process.env.MODE || 'development')

  /** @type {import('vite').LogLevel} */
  const LOG_LEVEL = 'info'

  /** @type {import('vite').InlineConfig} */
  const sharedConfig = {
    mode,
    build: {
      watch: {},
    },
    logLevel: LOG_LEVEL,
  }

  /** Messages on stderr that match any of the contained patterns will be stripped from output */
  const stderrFilterPatterns = [
    // warning about devtools extension
    // https://github.com/cawa-93/vite-electron-builder/issues/492
    // https://github.com/MarshallOfSound/electron-devtools-installer/issues/143
    /ExtensionLoadWarning/,
  ]

  /**
   * @param {{name: string; configFile: string; writeBundle: import('rollup').OutputPlugin['writeBundle'] }} param0
   */
  const getWatcher = ({ name, configFile, writeBundle }) => {
    return build({
      ...sharedConfig,
      configFile,
      plugins: [{ name, writeBundle }],
    })
  }

  /**
   * Start or restart App when source files are changed
   * @param {{config: {server: import('vite').ResolvedServerOptions}}} ResolvedServerOptions
   */
  const setupMainPackageWatcher = ({ config: { server } }) => {
    // Create VITE_DEV_SERVER_URL environment variable to pass it to the main process.
    {
      const protocol = server.https ? 'https:' : 'http:'
      const host = server.host || 'localhost'
      const port = server.port // Vite searches for and occupies the first free port: 3000, 3001, 3002 and so on
      const path = '/'
      process.env.VITE_DEV_SERVER_URL = `${protocol}//${host}:${port}${path}`
    }

    const logger = createLogger(LOG_LEVEL, {
      prefix: '[main]',
    })

    /** @type {ChildProcessWithoutNullStreams | null} */
    let spawnProcess = null

    return getWatcher({
      name: 'reload-app-on-main-package-change',
      configFile: 'src/main/vite.config.js',
      writeBundle() {
        if (spawnProcess !== null) {
          spawnProcess.off('exit', process.exit)
          spawnProcess.kill('SIGINT')
          spawnProcess = null
        }

        console.log({ electronPath })
        // Force Electron app mode even if the shell exports ELECTRON_RUN_AS_NODE.
        const electronEnv = { ...process.env }
        electronEnv.ELECTRON_RUN_AS_NODE = undefined
        spawnProcess = spawn(String(electronPath), ['.'], {
          env: electronEnv,
        })
        spawnProcess.stdout.on(
          'data',
          d =>
            d.toString().trim() &&
            logger.warn(d.toString(), { timestamp: true }),
        )
        spawnProcess.stderr.on('data', d => {
          const data = d.toString().trim()
          if (!data) return
          const mayIgnore = stderrFilterPatterns.some(r => r.test(data))
          if (mayIgnore) return
          logger.error(data, { timestamp: true })
        })

        // Stops the watch script when the application has been quit
        spawnProcess.on('exit', process.exit)
      },
    })
  }

  /**
   * Start or restart App when source files are changed
   * @param {{ws: import('vite').WebSocketServer}} WebSocketServer
   */
  const setupPreloadPackageWatcher = ({ ws }) =>
    getWatcher({
      name: 'reload-page-on-preload-package-change',
      configFile: 'src/preload/vite.config.js',
      writeBundle() {
        // Generating exposedInMainWorld.d.ts when preload package is changed.
        generateAsync({
          input: 'src/preload/src/**/*.ts',
          output: 'src/preload/exposedInMainWorld.d.ts',
        })

        ws.send({
          type: 'full-reload',
        })
      },
    })

  /**
   * Start web app dev server (external)
   */
  const setupWebAppWatcher = () => {
    console.log('Web app should be running on http://localhost:5173')
    console.log('Start web app with: cd ../../apps/web && npm run dev')
  }

  try {
    const viteDevServer = await createServer({
      ...sharedConfig,
      configFile: 'vite.config.mts',
    })

    await viteDevServer.listen()

    await setupPreloadPackageWatcher(viteDevServer)
    await setupMainPackageWatcher(viteDevServer)
    setupWebAppWatcher()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
