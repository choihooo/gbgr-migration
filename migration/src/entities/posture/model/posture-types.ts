export type EngineMode = 'foreground' | 'background'

export type MeasurementSessionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'error'

export type PostureEngineStatus =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'switching'
  | 'measuring'
  | 'stopping'
  | 'error'

export type CameraOwner = 'react' | 'python' | 'none'
export type CameraLockState = 'free' | 'releasing' | 'acquiring' | 'held'

export type CameraErrorCode =
  | 'camera_permission_denied'
  | 'camera_unavailable'
  | 'camera_busy'
  | 'camera_frame_unavailable'
  | 'camera_api_unavailable'
  | 'camera_stream_unauthorized'
  | 'camera_unknown'

export type CameraDiagnosticTransition =
  | 'idle->checking'
  | 'checking->ready'
  | 'checking->error'
  | 'ready->paused'
  | 'paused->checking'
  | 'ready->stopped'
  | 'error->checking'
  | 'unknown'

export interface CameraDiagnosticEvent {
  errorCode: CameraErrorCode | null
  permissionState: 'unknown' | 'prompt' | 'granted' | 'denied' | 'unavailable'
  transition: CameraDiagnosticTransition
  durationMs: number | null
  occurredAt: string
}

export type PostureClass = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface MeasurementSession {
  sessionId: string
  status: MeasurementSessionStatus
  mode: EngineMode
  startedAt: string
  lastResultAt: string | null
  latestResultId: string | null
  lastErrorCode: string | null
}

export interface PostureEngineResult {
  resultId: string
  sessionId: string
  timestamp: string
  postureClass: PostureClass
  score: number
  pi: number | null
  landmarks: PoseLandmark[]
  source: 'python_camera'
  engineMode: EngineMode
  events: string[]
}

export interface EngineStateEvent {
  engineStatus: PostureEngineStatus
  mode: EngineMode
  cameraOwner: CameraOwner
  updatedAt: string
  message: string | null
  recoverable: boolean
  cameraDiagnostics?: CameraDiagnosticEvent[]
}

export interface CameraOwnershipState {
  owner: CameraOwner
  requestedOwner: CameraOwner
  lockState: CameraLockState
  updatedAt: string
}

export interface PostureWarningEvent {
  code:
    | 'camera_conflict'
    | 'frame_rejected'
    | 'inference_timeout'
    | 'device_unavailable'
    | 'bad_posture_detected'
  message: string
  sessionId: string | null
  occurredAt: string
}

export interface LatestPostureStateResponse {
  session: MeasurementSession | null
  latestResult: PostureEngineResult | null
  engineState: EngineStateEvent
}

export interface StartPostureEngineResponse {
  engineStatus: Extract<PostureEngineStatus, 'starting' | 'ready'>
  sessionId: string | null
  mode: EngineMode
  streamUrl: string | null
}

export interface WarmupPostureEngineResponse {
  engineStatus: Extract<PostureEngineStatus, 'ready' | 'error'>
  message: string | null
}

export interface StopPostureEngineResponse {
  engineStatus: 'idle'
  releasedOwner: CameraOwner
}

export interface BackgroundMeasurementResponse {
  engineStatus: Extract<
    PostureEngineStatus,
    'switching' | 'measuring' | 'ready'
  >
  mode: EngineMode
}

export interface StartBackgroundMeasurementPayload {
  sessionId: string
  reason: 'minimized' | 'hidden' | 'manual'
}

export interface StopBackgroundMeasurementPayload {
  sessionId: string
}

export const createEmptyEngineState = (): EngineStateEvent => ({
  engineStatus: 'idle',
  mode: 'foreground',
  cameraOwner: 'none',
  updatedAt: new Date(0).toISOString(),
  message: null,
  recoverable: true,
  cameraDiagnostics: [],
})

export const createEmptyOwnershipState = (): CameraOwnershipState => ({
  owner: 'none',
  requestedOwner: 'none',
  lockState: 'free',
  updatedAt: new Date(0).toISOString(),
})

// ── 캘리브레이션 관련 타입 ──────────────────────────────

export interface CalibrateStartResponse {
  status: string
}

export interface CalibrateFramePayload {
  sessionId: string
  imagePayload: string
  capturedAt: string
  frameSize: {
    width: number
    height: number
  }
}

export interface CalibrateCameraFramePayload {
  sessionId: string
  capturedAt: string
}

export interface CalibrateFrameResponse {
  status: string
  frameCount: number
  step1Error: string | null
  step2Error: string | null
}

export interface CalibrateFinishResponse {
  status: string
  success: boolean
  muPi: number | null
  sigmaPi: number | null
  quality: 'good' | 'medium' | 'poor' | null
  nTotal: number | null
  nPass: number | null
  passRate: number | null
  message: string | null
}

export interface CalibrationResult {
  mu_PI: number
  sigma_PI: number
  quality: string
  timestamp: number
}

export interface SetCalibrationPayload {
  mu: number
  sigma: number
}

export interface SetCalibrationResponse {
  status: string
  mu: number
  sigma: number
}
