import unittest
from unittest.mock import patch

from engine.background_camera import (
    BackgroundCameraLoop,
    _camera_index_candidates,
    _parse_avfoundation_video_devices,
    _resolve_ffmpeg_command,
    is_authorized_stream_request,
)


class BackgroundCameraLoopTests(unittest.TestCase):
    def test_start_retries_until_camera_permission_is_granted(self):
        attempts = []

        class FakeCapture:
            def __init__(self, opened):
                self.opened = opened
                self.released = False

            def isOpened(self):
                return self.opened

            def release(self):
                self.released = True

        captures = [FakeCapture(False), FakeCapture(False), FakeCapture(True)]

        def fake_video_capture(index):
            attempts.append(index)
            return captures[len(attempts) - 1]

        loop = BackgroundCameraLoop()

        with (
            patch("engine.background_camera.cv2.VideoCapture", fake_video_capture),
            patch("engine.background_camera._camera_index_candidate_groups", lambda: [[0]]),
            patch("engine.background_camera.time.sleep", lambda _seconds: None),
            patch.object(loop, "_start_stream_server", lambda: None),
            patch.object(loop, "_capture_frames", lambda: None),
        ):
            loop.start()

        self.assertTrue(loop.running)
        self.assertIsNone(loop.last_error)
        self.assertIs(loop._capture, captures[-1])
        self.assertEqual(attempts, [0, 0, 0])
        self.assertTrue(captures[0].released)
        self.assertTrue(captures[1].released)

    def test_start_stops_immediately_when_camera_permission_is_denied(self):
        attempts = []

        class FakeCapture:
            def isOpened(self):
                return False

            def release(self):
                pass

        def fake_video_capture(index):
            attempts.append(index)
            return FakeCapture()

        loop = BackgroundCameraLoop()

        with (
            patch("engine.background_camera.cv2.VideoCapture", fake_video_capture),
            patch("engine.background_camera._camera_index_candidate_groups", lambda: [[0]]),
            patch("engine.background_camera._is_camera_permission_denied", lambda: True),
            patch("engine.background_camera.time.sleep", lambda _seconds: None),
            patch.object(loop, "_start_stream_server", lambda: None),
            patch.object(loop, "_capture_frames", lambda: None),
        ):
            loop.start()

        self.assertFalse(loop.running)
        self.assertEqual(loop.last_error, "camera_permission_denied")
        self.assertLessEqual(len(attempts), 1)

    def test_start_maps_busy_camera_without_sensitive_details(self):
        class FakeCapture:
            def isOpened(self):
                return False

            def release(self):
                pass

        loop = BackgroundCameraLoop()

        with (
            patch("engine.background_camera.cv2.VideoCapture", lambda _index: FakeCapture()),
            patch("engine.background_camera._camera_index_candidate_groups", lambda: [[0]]),
            patch("engine.background_camera._is_camera_busy", lambda: True),
            patch("engine.background_camera.time.sleep", lambda _seconds: None),
        ):
            loop.start()

        self.assertFalse(loop.running)
        self.assertEqual(loop.last_error, "camera_busy")

    def test_camera_index_candidates_prefers_builtin_camera_over_iphone(self):
        ffmpeg_output = """
        [AVFoundation indev @ 0x0] AVFoundation video devices:
        [AVFoundation indev @ 0x0] [0] ‘호이폰’ 카메라
        [AVFoundation indev @ 0x0] [1] FaceTime HD 카메라
        [AVFoundation indev @ 0x0] [2] ‘호이폰’ 데스크뷰 카메라
        [AVFoundation indev @ 0x0] [3] Capture screen 0
        [AVFoundation indev @ 0x0] AVFoundation audio devices:
        """
        devices = _parse_avfoundation_video_devices(ffmpeg_output)

        with (
            patch("engine.background_camera._list_avfoundation_video_devices", lambda: devices),
            patch.dict("os.environ", {}, clear=True),
        ):
            self.assertEqual(_camera_index_candidates(), [1])

    def test_camera_index_candidates_do_not_fallback_to_iphone_by_default(self):
        ffmpeg_output = """
        [AVFoundation indev @ 0x0] AVFoundation video devices:
        [AVFoundation indev @ 0x0] [0] ‘호이폰’ 카메라
        [AVFoundation indev @ 0x0] [1] ‘호이폰’ 데스크뷰 카메라
        [AVFoundation indev @ 0x0] AVFoundation audio devices:
        """
        devices = _parse_avfoundation_video_devices(ffmpeg_output)

        with (
            patch("engine.background_camera._list_avfoundation_video_devices", lambda: devices),
            patch.dict("os.environ", {}, clear=True),
        ):
            self.assertEqual(_camera_index_candidates(), [])

    def test_camera_index_candidates_uses_env_override(self):
        with patch.dict("os.environ", {"GBGR_CAMERA_INDEX": "2"}, clear=True):
            self.assertEqual(_camera_index_candidates(), [2])

    def test_stream_rejects_missing_wrong_token_and_non_video_path(self):
        self.assertFalse(is_authorized_stream_request("/video", "current-token"))
        self.assertFalse(
            is_authorized_stream_request("/video?token=wrong-token", "current-token")
        )
        self.assertFalse(
            is_authorized_stream_request("/status?token=current-token", "current-token")
        )
        self.assertTrue(
            is_authorized_stream_request("/video?token=current-token", "current-token")
        )

    def test_stop_shuts_down_stream_server_and_clears_latest_jpeg(self):
        loop = BackgroundCameraLoop()
        loop.running = True
        loop._latest_jpeg = b"\xff\xd8frame"
        loop.stream_url = "http://127.0.0.1:49152/video?token=test-token"

        self.assertIsNotNone(loop.stream_url)

        loop.stop()

        self.assertFalse(loop.running)
        self.assertIsNone(loop.stream_url)
        self.assertIsNone(loop.latest_jpeg())

    def test_start_rotates_stream_token_for_each_session(self):
        class FakeCapture:
            def isOpened(self):
                return True

            def release(self):
                pass

        loop = BackgroundCameraLoop()

        def fake_start_stream_server():
            loop.stream_url = f"http://127.0.0.1:49152/video?token={loop._token}"

        with (
            patch("engine.background_camera.cv2.VideoCapture", lambda _index: FakeCapture()),
            patch("engine.background_camera._camera_index_candidate_groups", lambda: [[0]]),
            patch.object(loop, "_start_stream_server", fake_start_stream_server),
            patch.object(loop, "_capture_frames", lambda: None),
        ):
            loop.start()
            first_url = loop.stream_url
            loop.stop()
            loop.start()
            second_url = loop.stream_url
            loop.stop()

        self.assertIsNotNone(first_url)
        self.assertIsNotNone(second_url)
        self.assertNotEqual(first_url, second_url)

    def test_resolve_ffmpeg_command_checks_common_homebrew_paths(self):
        def fake_which(candidate):
            if candidate == "/opt/homebrew/bin/ffmpeg":
                return candidate
            return None

        with patch("engine.background_camera.shutil.which", fake_which):
            self.assertEqual(_resolve_ffmpeg_command(), "/opt/homebrew/bin/ffmpeg")

    def test_start_does_not_try_iphone_after_preferred_camera_fails(self):
        attempts = []

        class FakeCapture:
            def __init__(self, opened):
                self.opened = opened
                self.released = False

            def isOpened(self):
                return self.opened

            def release(self):
                self.released = True

        captures = [FakeCapture(False), FakeCapture(False)]

        def fake_video_capture(index):
            attempts.append(index)
            return captures[len(attempts) - 1]

        loop = BackgroundCameraLoop()

        with (
            patch("engine.background_camera.cv2.VideoCapture", fake_video_capture),
            patch("engine.background_camera._camera_index_candidate_groups", lambda: [[1]]),
            patch("engine.background_camera.CAMERA_OPEN_RETRY_ATTEMPTS", 2),
            patch("engine.background_camera.time.sleep", lambda _seconds: None),
            patch.object(loop, "_start_stream_server", lambda: None),
            patch.object(loop, "_capture_frames", lambda: None),
        ):
            loop.start()

        self.assertFalse(loop.running)
        self.assertEqual(loop.last_error, "camera_unavailable")
        self.assertEqual(attempts, [1, 1])


if __name__ == "__main__":
    unittest.main()
