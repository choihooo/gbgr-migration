/**
 * 카메라 권한 요청 버튼
 *
 * 포팅 원본: src/renderer/src/pages/onboarding-page/components/CameraPermissionButton.tsx
 * 변경점: CameraStore 대신 localStorage 직접 관리 (CameraStore는 008에서 도입)
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'

const CameraPermissionButton = () => {
  const navigate = useNavigate()

  const requestCameraPermission = async () => {
    try {
      const isWindows = navigator.platform.includes('Win')

      let stream: MediaStream | null = null
      let selectedDeviceId: string | null = null

      if (isWindows) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')

        const targetDevice = videoDevices[1]
        if (targetDevice) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: targetDevice.deviceId } },
            audio: false,
          })
          selectedDeviceId = targetDevice.deviceId
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        const track = stream.getVideoTracks()[0]
        selectedDeviceId = track.getSettings().deviceId || null
      }

      if (!stream) {
        throw new Error('사용 가능한 카메라를 찾을 수 없습니다.')
      }

      stream.getTracks().forEach(track => {
        track.stop()
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      if (selectedDeviceId) {
        localStorage.setItem('preferred-camera-device', selectedDeviceId)
      }

      navigate('/onboarding/calibration')
    } catch (error) {
      console.error('[CameraPermission] 카메라 권한 요청 실패:', error)
    }
  }

  return (
    <Button
      variant="primary"
      size="xl"
      className="w-[440px]"
      text="카메라 권한 허용"
      onClick={requestCameraPermission}
    />
  )
}

export default CameraPermissionButton
