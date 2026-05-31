/**
 * 카메라 권한 요청 버튼
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-page/components/CameraPermissionButton.tsx
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCameraStore } from '@/features/main-panels/model/use-camera-store'
import {
  startPostureEngine,
  stopPostureEngine,
} from '@/features/posture-engine'
import { getCameraPermissionErrorMessage } from '@/shared/lib/camera-permission'
import { Button } from '@/shared/ui/button'

const CameraPermissionButton = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setShow = useCameraStore(state => state.setShow)
  const [isRequesting, setIsRequesting] = useState(false)

  const requestStream = (constraints: MediaStreamConstraints) =>
    navigator.mediaDevices.getUserMedia(constraints)

  const stopStream = (stream: MediaStream | null) => {
    stream?.getTracks().forEach(track => {
      track.stop()
    })
  }

  const requestCameraPermission = async () => {
    if (isRequesting) return

    setIsRequesting(true)
    let stream: MediaStream | null = null
    try {
      const isTauriRuntime =
        typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

      if (isTauriRuntime) {
        stream = await requestStream({
          video: true,
          audio: false,
        })
        stopStream(stream)
        stream = null
        await new Promise(resolve => setTimeout(resolve, 100))

        await startPostureEngine()
        try {
          await stopPostureEngine()
        } catch (error) {
          console.warn(
            '[CameraPermission] 권한 확인 후 자세 엔진 정리 실패:',
            error,
          )
        }
        setShow()
        navigate('/onboarding/calibration')
        return
      }

      const isWindows = navigator.platform.includes('Win')

      let selectedDeviceId: string | null = null

      if (isWindows) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')

        const targetDevice = videoDevices[1]
        if (targetDevice) {
          try {
            stream = await requestStream({
              video: { deviceId: { exact: targetDevice.deviceId } },
              audio: false,
            })
            selectedDeviceId = targetDevice.deviceId
          } catch {
            stream = await requestStream({
              video: true,
              audio: false,
            })
          }
        } else {
          stream = await requestStream({
            video: true,
            audio: false,
          })
        }
      } else {
        stream = await requestStream({
          video: true,
          audio: false,
        })
        const track = stream.getVideoTracks()[0]
        selectedDeviceId = track.getSettings().deviceId || null
      }

      if (!stream) {
        throw new Error('사용 가능한 카메라를 찾을 수 없습니다.')
      }

      stopStream(stream)
      stream = null

      await new Promise(resolve => setTimeout(resolve, 100))

      if (selectedDeviceId) {
        localStorage.setItem('preferred-camera-device', selectedDeviceId)
      }

      setShow()
      navigate('/onboarding/calibration')
    } catch (error) {
      console.error('[CameraPermission] 카메라 권한 요청 실패:', error)
      window.alert(getCameraPermissionErrorMessage(error))
    } finally {
      stopStream(stream)
      setIsRequesting(false)
    }
  }

  return (
    <Button
      variant="primary"
      size="xl"
      className="w-[440px]"
      text={t('onboarding.camera.button')}
      onClick={requestCameraPermission}
      disabled={isRequesting}
    />
  )
}

export default CameraPermissionButton
