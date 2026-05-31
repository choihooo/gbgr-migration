import unittest

from main import PostureEngineService


class PostureEngineServiceTests(unittest.TestCase):
    def test_start_opens_camera_before_detector_initialization(self):
        service = PostureEngineService()
        calls = []

        def start_camera():
            calls.append("camera")
            service._background_loop.running = True

        def initialize_detector():
            calls.append("detector")
            return True

        service._background_loop.start = start_camera
        service._detector.initialize = initialize_detector

        result = service.handle({"command": "start"})

        self.assertEqual(result["engine_status"], "ready")
        self.assertEqual(calls, ["camera", "detector"])

    def test_stop_clears_stream_url_and_latest_frame(self):
        service = PostureEngineService()
        service._background_loop.running = True
        service._background_loop.stream_url = "http://127.0.0.1:49152/video?token=test-token"
        service._background_loop._latest_jpeg = b"\xff\xd8frame"
        service._state.stream_url = service._background_loop.stream_url
        service._state.camera_owner = "python"

        result = service.handle({"command": "stop"})

        self.assertEqual(result["engine_status"], "idle")
        self.assertEqual(result["camera_owner"], "none")
        self.assertIsNone(result["stream_url"])
        self.assertIsNone(service._background_loop.latest_jpeg())


if __name__ == "__main__":
    unittest.main()
