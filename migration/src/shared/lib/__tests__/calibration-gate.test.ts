import { beforeEach, describe, expect, it, vi } from 'vitest'

// localStorage mock for test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

import {
  canAccessCalibrationFlow,
  clearCalibrationGate,
  getCalibrationGateState,
  lockCalibrationGate,
  markCalibrationInitialRequired,
  requestCalibrationReset,
  setCalibrationGateState,
} from '../calibration-gate'

describe('calibration-gate', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getCalibrationGateState', () => {
    it('returns "locked" when no state is stored', () => {
      // 키가 없으면 locked 반환 (레거시 동일)
      expect(getCalibrationGateState(null)).toBe('locked')
    })

    it('returns "initial_required" when state is "initial_required"', () => {
      localStorage.setItem('calibration_gate_v1', 'initial_required')
      expect(getCalibrationGateState(null)).toBe('initial_required')
    })

    it('returns "reset_requested" when state is "reset_requested"', () => {
      localStorage.setItem('calibration_gate_v1', 'reset_requested')
      expect(getCalibrationGateState(null)).toBe('reset_requested')
    })

    it('returns "locked" when state is "locked"', () => {
      localStorage.setItem('calibration_gate_v1', 'locked')
      expect(getCalibrationGateState(null)).toBe('locked')
    })

    it('returns "locked" for unknown values', () => {
      localStorage.setItem('calibration_gate_v1', 'corrupted_value')
      expect(getCalibrationGateState(null)).toBe('locked')
    })

    it('uses userId-specific key when userId is provided', () => {
      localStorage.setItem('calibration_gate_v1:user123', 'initial_required')
      expect(getCalibrationGateState('user123')).toBe('initial_required')
    })

    it('falls back to global key when userId-specific key is missing', () => {
      localStorage.setItem('calibration_gate_v1', 'reset_requested')
      expect(getCalibrationGateState('user999')).toBe('reset_requested')
    })

    it('prefers userId-specific key over global key', () => {
      localStorage.setItem('calibration_gate_v1:user123', 'initial_required')
      localStorage.setItem('calibration_gate_v1', 'locked')
      expect(getCalibrationGateState('user123')).toBe('initial_required')
    })
  })

  describe('setCalibrationGateState', () => {
    it('sets both userId-specific and global keys', () => {
      setCalibrationGateState('user123', 'locked')
      expect(localStorage.getItem('calibration_gate_v1:user123')).toBe('locked')
      expect(localStorage.getItem('calibration_gate_v1')).toBe('locked')
    })

    it('sets only global key when userId is null', () => {
      setCalibrationGateState(null, 'initial_required')
      expect(localStorage.getItem('calibration_gate_v1')).toBe(
        'initial_required',
      )
    })
  })

  describe('markCalibrationInitialRequired', () => {
    it('sets state to "initial_required"', () => {
      markCalibrationInitialRequired('user123')
      expect(getCalibrationGateState('user123')).toBe('initial_required')
    })
  })

  describe('requestCalibrationReset', () => {
    it('sets state to "reset_requested"', () => {
      requestCalibrationReset('user123')
      expect(getCalibrationGateState('user123')).toBe('reset_requested')
    })
  })

  describe('lockCalibrationGate', () => {
    it('sets state to "locked"', () => {
      markCalibrationInitialRequired('user123')
      lockCalibrationGate('user123')
      expect(getCalibrationGateState('user123')).toBe('locked')
    })
  })

  describe('clearCalibrationGate', () => {
    it('removes both userId-specific and global keys', () => {
      setCalibrationGateState('user123', 'initial_required')
      clearCalibrationGate('user123')
      expect(localStorage.getItem('calibration_gate_v1:user123')).toBeNull()
      expect(localStorage.getItem('calibration_gate_v1')).toBeNull()
    })
  })

  describe('canAccessCalibrationFlow', () => {
    it('returns true when state is "initial_required"', () => {
      markCalibrationInitialRequired('user123')
      expect(canAccessCalibrationFlow('user123')).toBe(true)
    })

    it('returns true when state is "reset_requested"', () => {
      requestCalibrationReset('user123')
      expect(canAccessCalibrationFlow('user123')).toBe(true)
    })

    it('returns false when state is "locked"', () => {
      lockCalibrationGate('user123')
      expect(canAccessCalibrationFlow('user123')).toBe(false)
    })
  })
})
