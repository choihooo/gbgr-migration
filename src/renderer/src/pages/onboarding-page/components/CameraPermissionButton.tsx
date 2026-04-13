import { Button } from '@shared/ui/button'
import { useCameraStore } from '@widgets/camera'
import { useNavigate } from 'react-router-dom'

const CameraPermissionButton = () => {
  const navigate = useNavigate()
  const { setShow } = useCameraStore()

  const requestCameraPermission = async () => {
    try {
      const isWindows = navigator.platform.includes('Win')

      let stream: MediaStream | null = null
      let selectedDeviceId: string | null = null

      // Windows 환경이면 Device 1 (두 번째 카메라) 사용
      if (isWindows) {
        const devices = await navigator.mediaDevices.enumerateDevices() // 연결된 모든 미디어 장치 탐색
        const videoDevices = devices.filter(d => d.kind === 'videoinput') // 카메라 목록만 구함

        const targetDevice = videoDevices[1] // 카메라 목록중 두 번째 카메라 선택
        if (targetDevice) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: targetDevice.deviceId } }, //지정한 카메라에 스트림 요청
            audio: false,
          })
          selectedDeviceId = targetDevice.deviceId //사용하는 카메라id 저장 변수
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          }) // 카메라 1대이면 기존 방식 사용
        }
      } else {
        // macOS 등 다른 환경: 기존 로직

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

      // 스트림이 완전히 해제될 때까지 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 100))

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
