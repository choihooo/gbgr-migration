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


if __name__ == "__main__":
    unittest.main()
