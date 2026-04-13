import { Button } from '@shared/ui/button'
import { useCameraStore } from '@widgets/camera'
import { useNavigate } from 'react-router-dom'

const CameraPermissionButton = () => {
  const navigate = useNavigate()
  const { setShow } = useCameraStore()

  const requestCameraPermission = async () => {
    try {
      let stream: MediaStream | null = null
      let selectedDeviceId: string | null = null
      const preferredDeviceId = localStorage.getItem('preferred-camera-device')

      // 1) 기본 카메라를 먼저 시도하고, 2) 저장된 카메라, 3) 연결된 카메라 순으로 fallback
      const constraintsToTry: Array<{
        video: true | { deviceId: { exact: string } }
        audio: false
      }> = [{ video: true, audio: false }]
      if (preferredDeviceId) {
        constraintsToTry.push({
          video: { deviceId: { exact: preferredDeviceId } },
          audio: false,
        })
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      for (const device of videoDevices) {
        if (!device.deviceId || device.deviceId === preferredDeviceId) continue
        constraintsToTry.push({
          video: { deviceId: { exact: device.deviceId } },
          audio: false,
        })
      }

      let lastError: unknown
      for (const constraints of constraintsToTry) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          break
        } catch (error) {
          lastError = error
        }
      }

      if (!stream) {
        if (lastError) throw lastError
        throw new Error('사용 가능한 카메라를 찾을 수 없습니다.')
      }

      const track = stream.getVideoTracks()[0]
      if (track) {
        selectedDeviceId = track.getSettings().deviceId || null
      }

      stream.getTracks().forEach(track => {
        track.stop()
      })

      // 스트림이 완전히 해제될 때까지 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 200))

      // 성공한 카메라 저장
      if (selectedDeviceId) {
        localStorage.setItem('preferred-camera-device', selectedDeviceId)
      }

      setShow() // Set camera state to 'show' after permission is granted

      navigate('/onboarding/calibration')
    } catch (error) {
      console.error('[CameraPermission] 카메라 권한 요청 실패:', error)
      if (error instanceof Error) {
        console.error('[CameraPermission] Error name:', error.name)
        console.error('[CameraPermission] Error message:', error.message)
      }
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
