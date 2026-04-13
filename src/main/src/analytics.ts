import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, ipcMain } from 'electron'

type AnalyticsParams = Record<string, unknown>

const ANALYTICS_STORE_FILENAME = 'analytics.json'
const GA_COLLECT_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect'

const PII_KEY_PATTERNS = [
  /email/i,
  /e-mail/i,
  /phone/i,
  /mobile/i,
  /tel/i,
  /contact/i,
]

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_PATTERN = /\+?\d[\d\s\-().]{7,}\d/

type AnalyticsStore = {
  clientId: string
  userId?: string
}

const runtimeSessionId = Math.floor(Date.now() / 1000)
const runtimeAppSessionId = randomUUID()
let cachedStore: AnalyticsStore | null = null
let analyticsConfigWarned = false

const getAnalyticsConfig = () => {
  const measurementId =
    process.env.GA4_MEASUREMENT_ID ??
    process.env.VITE_GA_MEASUREMENT_ID ??
    import.meta.env.VITE_GA_MEASUREMENT_ID
  const apiSecret = process.env.GA4_API_SECRET
  const debugEnabled = process.env.GA4_DEBUG_MP === 'true'
  const enabled = Boolean(measurementId && apiSecret)

  if (!enabled && !analyticsConfigWarned) {
    analyticsConfigWarned = true
    console.warn(
      '[analytics] disabled: missing GA4_MEASUREMENT_ID or GA4_API_SECRET',
    )
  }

  return { measurementId, apiSecret, debugEnabled, enabled }
}

const getAnalyticsStorePath = () =>
  join(app.getPath('userData'), ANALYTICS_STORE_FILENAME)

const isPIIKey = (key: string) =>
  PII_KEY_PATTERNS.some(pattern => pattern.test(key))

const maskPotentialPII = (value: string): string => {
  if (EMAIL_PATTERN.test(value)) return '[redacted_email]'
  if (PHONE_PATTERN.test(value)) return '[redacted_phone]'
  return value
}

const sanitizeValue = (
  value: unknown,
): string | number | boolean | undefined => {
  if (typeof value === 'string') return maskPotentialPII(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  return undefined
}

const sanitizeParams = (params?: AnalyticsParams) => {
  if (!params) return {}

  const sanitized: Record<string, string | number | boolean> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (isPIIKey(key)) return
    const safeValue = sanitizeValue(value)
    if (safeValue !== undefined) {
      sanitized[key] = safeValue
    }
  })
  return sanitized
}

const readStore = async (): Promise<AnalyticsStore | null> => {
  try {
    const raw = await readFile(getAnalyticsStorePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AnalyticsStore>
    if (!parsed.clientId || typeof parsed.clientId !== 'string') {
      return null
    }
    return {
      clientId: parsed.clientId,
      userId: typeof parsed.userId === 'string' ? parsed.userId : undefined,
    }
  } catch {
    return null
  }
}

const writeStore = async (store: AnalyticsStore) => {
  const storePath = getAnalyticsStorePath()
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(storePath, JSON.stringify(store, null, 2), 'utf-8')
}

export const getOrCreateClientId = async (): Promise<string> => {
  if (cachedStore?.clientId) return cachedStore.clientId

  const existing = await readStore()
  if (existing) {
    cachedStore = existing
    return existing.clientId
  }

  const created: AnalyticsStore = { clientId: randomUUID() }
  cachedStore = created
  await writeStore(created)
  return created.clientId
}

const getStoredUserId = async (): Promise<string | undefined> => {
  if (cachedStore?.userId) return cachedStore.userId
  const existing = cachedStore ?? (await readStore())
  if (!existing) return undefined
  cachedStore = existing
  return existing.userId
}

const getReleaseChannel = () => {
  const fromEnv = process.env.RELEASE_CHANNEL ?? process.env.APP_CHANNEL
  if (fromEnv) return fromEnv
  return app.isPackaged ? 'stable' : 'development'
}

const sendRequest = async (url: string, payload: object) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(
      `GA4 request failed: ${response.status} ${response.statusText}`,
    )
  }
  return response
}

export const postToGa4 = async (
  eventName: string,
  eventParams?: AnalyticsParams,
  sourceScreen?: string,
) => {
  const { measurementId, apiSecret, debugEnabled, enabled } =
    getAnalyticsConfig()
  if (!enabled || !measurementId || !apiSecret) return

  const clientId = await getOrCreateClientId()
  const userId = await getStoredUserId()
  const sanitizedEventParams = sanitizeParams(eventParams)

  const commonParams = {
    app_version: app.getVersion(),
    platform: process.platform,
    release_channel: getReleaseChannel(),
    session_id: runtimeSessionId,
    app_session_id: runtimeAppSessionId,
    engagement_time_msec: 1,
    screen:
      typeof sourceScreen === 'string' && sourceScreen.length > 0
        ? sourceScreen
        : 'unknown',
  }

  const payload = {
    client_id: clientId,
    ...(userId ? { user_id: userId } : {}),
    events: [
      {
        name: eventName,
        params: {
          ...commonParams,
          ...sanitizedEventParams,
        },
      },
    ],
  }

  const collectUrl = `${GA_COLLECT_ENDPOINT}?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`
  const debugUrl = `${GA_DEBUG_ENDPOINT}?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`

  try {
    // DebugView 노출을 위해 debug_mode를 포함한 collect 전송을 유지
    const collectPayload = debugEnabled
      ? {
          ...payload,
          events: payload.events.map(event => ({
            ...event,
            params: {
              ...event.params,
              debug_mode: 1,
            },
          })),
        }
      : payload
    await sendRequest(collectUrl, collectPayload)

    // debug/mp/collect 응답 검증은 디버그 토글 시 추가 수행
    if (debugEnabled) {
      const debugResponse = await sendRequest(debugUrl, payload)
      const body = await debugResponse.text()
      if (body) {
        console.log('[analytics] debug/mp/collect response:', body)
      }
    }
  } catch (error) {
    console.warn('[analytics] Failed to send event:', error)
  }
}

const normalizeScreen = (screen: unknown, fallbackUrl?: string) => {
  if (typeof screen === 'string' && screen.length > 0) return screen
  if (fallbackUrl) return fallbackUrl
  return 'unknown'
}

export const setAnalyticsUserId = async (userId: string) => {
  const trimmed = userId.trim()
  if (!trimmed) return

  const clientId = await getOrCreateClientId()
  const nextStore: AnalyticsStore = { clientId, userId: trimmed }
  cachedStore = nextStore
  await writeStore(nextStore)
}

export const setupAnalyticsHandlers = () => {
  void getOrCreateClientId().catch(error => {
    console.warn('[analytics] Failed to initialize client_id store:', error)
  })

  ipcMain.handle(
    'analytics:logEvent',
    async (event, name: string, params?: AnalyticsParams) => {
      await postToGa4(
        name,
        params,
        normalizeScreen(params?.screen, event.senderFrame?.url),
      )
      return { success: true }
    },
  )

  ipcMain.handle('analytics:setUserId', async (_event, userId: string) => {
    await setAnalyticsUserId(userId)
    return { success: true }
  })
}
