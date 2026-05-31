import { describe, expect, it } from 'vitest'
import {
  getCameraPermissionErrorCode,
  getCameraPermissionErrorMessage,
  getSidecarCameraErrorMessage,
  isSidecarCameraPermissionError,
} from '../camera-permission'

const domExceptionLike = (name: string) => ({ name, message: name })

describe('camera-permission', () => {
  it('maps browser camera errors to normalized codes and guidance', () => {
    expect(
      getCameraPermissionErrorCode(domExceptionLike('NotAllowedError')),
    ).toBe('camera_permission_denied')
    expect(
      getCameraPermissionErrorCode(domExceptionLike('NotFoundError')),
    ).toBe('camera_unavailable')
    expect(
      getCameraPermissionErrorCode(domExceptionLike('NotReadableError')),
    ).toBe('camera_busy')

    expect(
      getCameraPermissionErrorMessage(domExceptionLike('NotAllowedError')),
    ).toContain('권한')
    expect(
      getCameraPermissionErrorMessage(domExceptionLike('NotFoundError')),
    ).toContain('찾을 수 없어요')
    expect(
      getCameraPermissionErrorMessage(domExceptionLike('NotReadableError')),
    ).toContain('다른 앱')
  })

  it('maps sidecar camera errors to recoverable user guidance', () => {
    for (const code of [
      'camera_permission_denied',
      'camera_unavailable',
      'camera_busy',
      'camera_frame_unavailable',
      'camera_stream_unauthorized',
    ]) {
      expect(isSidecarCameraPermissionError(code)).toBe(true)
      expect(getSidecarCameraErrorMessage(code)).toEqual(expect.any(String))
    }
  })
})
