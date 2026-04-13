import { URL } from 'node:url'
import { app, shell } from 'electron'

/**
 * List of origins that you allow open INSIDE the application and permissions for each of them.
 *
 * In development mode you need allow open `VITE_DEV_SERVER_URL`
 */
const ALLOWED_ORIGINS_AND_PERMISSIONS = new Map<string, Set<string>>(
  import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL
    ? [
        [
          new URL(import.meta.env.VITE_DEV_SERVER_URL).origin,
          new Set(['media']),
        ],
        // localhost:3000도 허용 (Electron 앱에서 사용)
        ['http://localhost:3000', new Set(['media'])],
        ['http://localhost:5173', new Set(['media'])],
      ]
    : [
        // 프로덕션에서도 localhost 허용
        ['http://localhost:3000', new Set(['media'])],
        ['http://localhost:5173', new Set(['media'])],
        // 프로덕션 배포 URL에 media 권한 추가 (모든 가능한 variant 포함)
        ['https://app.bugi.co.kr', new Set(['media'])],
      ],
)

/**
 * List of origins that you allow open IN BROWSER.
 * Navigation to origins below is possible only if the link opens in a new window
 *
 * @example
 * <a
 *   target="_blank"
 *   href="https://github.com/"
 * >
 */
const ALLOWED_EXTERNAL_ORIGINS = new Set<`https://${string}`>([
  'https://github.com',
  'https://clean-rail-ebf.notion.site',
  'https://adhesive-wrench-b12.notion.site',
])

app.on('web-contents-created', (_, contents) => {
  /**
   * Block navigation to origins not on the allowlist.
   *
   * Navigation is a common attack vector. If an attacker can convince the app to navigate away
   * from its current page, they can possibly force the app to open web sites on the Internet.
   *
   * @see https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
   */
  contents.on('will-navigate', (event, url) => {
    const { origin } = new URL(url)
    if (ALLOWED_ORIGINS_AND_PERMISSIONS.has(origin)) {
      return
    }

    // Prevent navigation
    event.preventDefault()

    if (import.meta.env.DEV) {
      console.warn('Blocked navigating to an unallowed origin:', origin)
    }
  })

  /**
   * Block requested unallowed permissions.
   * By default, Electron will automatically approve all permission requests.
   *
   * @see https://www.electronjs.org/docs/latest/tutorial/security#5-handle-session-permission-requests-from-remote-content
   */
  contents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const currentUrl = webContents.getURL()
      const { origin } = new URL(currentUrl)

      const allowedPermissions = ALLOWED_ORIGINS_AND_PERMISSIONS.get(origin)
      const permissionGranted = !!allowedPermissions?.has(permission)

      // 프로덕션에서도 로그 출력하여 디버깅 가능하게 함
      if (permission === 'media') {
        console.log(
          `[Permission Request] URL: ${currentUrl}, Origin: ${origin}, Permission: ${permission}, Granted: ${permissionGranted}`,
        )
        console.log(
          '[Permission Details] Allowed permissions for origin:',
          Array.from(allowedPermissions || []),
        )
        console.log(
          '[Permission Details] All allowed origins:',
          Array.from(ALLOWED_ORIGINS_AND_PERMISSIONS.keys()),
        )
      }

      callback(permissionGranted)

      if (!permissionGranted) {
        const logMessage = `${origin} requested permission for '${permission}', but was blocked.`
        if (import.meta.env.DEV) {
          console.warn(logMessage)
        } else {
          console.error(logMessage)
        }
      }
    },
  )

  /**
   * Hyperlinks to allowed sites open in the default browser.
   *
   * The creation of new `webContents` is a common attack vector. Attackers attempt to convince the app to create new windows,
   * frames, or other renderer processes with more privileges than they had before; or with pages opened that they couldn't open before.
   * You should deny any unexpected window creation.
   *
   * @see https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
   * @see https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-openexternal-with-untrusted-content
   */
  contents.setWindowOpenHandler(({ url }) => {
    const { origin } = new URL(url)

    // @ts-expect-error Type checking is performed in runtime
    if (ALLOWED_EXTERNAL_ORIGINS.has(origin)) {
      // Open default browser
      shell.openExternal(url).catch(console.error)
    } else if (import.meta.env.DEV) {
      console.warn('Blocked the opening of an unallowed origin:', origin)
    }

    // Prevent creating new window in application
    return { action: 'deny' }
  })

  /**
   * Verify webview options before creation
   *
   * Strip away preload scripts, disable Node.js integration, and ensure origins are on the allowlist.
   *
   * @see https://www.electronjs.org/docs/latest/tutorial/security#12-verify-webview-options-before-creation
   */
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    const { origin } = new URL(params.src)
    if (!ALLOWED_ORIGINS_AND_PERMISSIONS.has(origin)) {
      if (import.meta.env.DEV) {
        console.warn(
          `A webview tried to attach ${params.src}, but was blocked.`,
        )
      }

      event.preventDefault()
      return
    }

    // Strip away preload scripts if unused or verify their location is legitimate
    webPreferences.preload = undefined
    // @ts-expect-error `preloadURL` exists - see https://www.electronjs.org/docs/latest/api/web-contents#event-will-attach-webview
    webPreferences.preloadURL = undefined

    // Disable Node.js integration
    webPreferences.nodeIntegration = false
  })

  /**
   * Prevent page reload (F5, Ctrl+R, Cmd+R).
   * In production, block common DevTools shortcuts and allow only a hidden one.
   */
  contents.on('before-input-event', (event, input) => {
    if (import.meta.env.DEV) {
      return
    }

    const key = input.key.toLowerCase()
    const withCtrlOrCmd = input.control || input.meta
    const withAlt = input.alt
    const withShift = input.shift

    const isReloadShortcut =
      input.key === 'F5' || (key === 'r' && withCtrlOrCmd)
    const isDefaultDevToolsShortcut =
      input.key === 'F12' ||
      ((key === 'i' || key === 'j') && withCtrlOrCmd && withShift)
    const isHiddenDevToolsShortcut =
      key === 'd' && withCtrlOrCmd && withAlt && withShift

    if (isReloadShortcut) {
      event.preventDefault()
      return
    }

    if (isHiddenDevToolsShortcut) {
      event.preventDefault()
      if (contents.isDevToolsOpened()) {
        contents.closeDevTools()
      } else {
        contents.openDevTools({ mode: 'detach' })
      }
      return
    }

    if (isDefaultDevToolsShortcut) {
      event.preventDefault()
    }
  })

  /**
   * Prevent programmatic reload
   * 개발 모드에서는 허용하고 프로덕션에서만 막기
   */
  if (import.meta.env.PROD) {
    contents.reload = () => {
      console.warn('Page reload is disabled in production mode')
      // 새로고침 실행하지 않음
    }
  }
})
