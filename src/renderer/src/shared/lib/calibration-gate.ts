const CALIBRATION_GATE_PREFIX = 'calibration_gate_v1:'
const CALIBRATION_GATE_GLOBAL_KEY = 'calibration_gate_v1'

export type CalibrationGateState =
  | 'initial_required'
  | 'reset_requested'
  | 'locked'

const getCalibrationGateKey = (userId: string) =>
  `${CALIBRATION_GATE_PREFIX}${userId}`

export const getCalibrationGateState = (
  userId: string | null | undefined,
): CalibrationGateState => {
  const raw =
    (userId ? localStorage.getItem(getCalibrationGateKey(userId)) : null) ??
    localStorage.getItem(CALIBRATION_GATE_GLOBAL_KEY)
  if (raw === 'initial_required' || raw === 'reset_requested') {
    return raw
  }
  return 'locked'
}

export const setCalibrationGateState = (
  userId: string | null | undefined,
  state: CalibrationGateState,
) => {
  if (userId) {
    localStorage.setItem(getCalibrationGateKey(userId), state)
  }
  localStorage.setItem(CALIBRATION_GATE_GLOBAL_KEY, state)
}

export const markCalibrationInitialRequired = (
  userId: string | null | undefined,
) => {
  setCalibrationGateState(userId, 'initial_required')
}

export const requestCalibrationReset = (userId: string | null | undefined) => {
  setCalibrationGateState(userId, 'reset_requested')
}

export const lockCalibrationGate = (userId: string | null | undefined) => {
  setCalibrationGateState(userId, 'locked')
}

export const clearCalibrationGate = (userId: string | null | undefined) => {
  if (userId) {
    localStorage.removeItem(getCalibrationGateKey(userId))
  }
  localStorage.removeItem(CALIBRATION_GATE_GLOBAL_KEY)
}

export const canAccessCalibrationFlow = (userId: string | null | undefined) => {
  const state = getCalibrationGateState(userId)
  return state === 'initial_required' || state === 'reset_requested'
}
