from main import PostureEngineService


def test_latest_result_matches_rust_result_contract():
    service = PostureEngineService()

    result = service.handle({"command": "latest_result", "session_id": "session-1"})

    assert set(result) == {
        "result_id",
        "session_id",
        "timestamp",
        "posture_class",
        "score",
        "pi",
        "landmarks",
        "source",
        "engine_mode",
        "events",
    }
    assert result["session_id"] == "session-1"
    assert result["posture_class"] == 0
    assert result["engine_mode"] == "foreground"
    assert result["events"] == []


def test_set_calibration_reports_effective_sigma():
    service = PostureEngineService()

    result = service.handle({"command": "set_calibration", "mu": 0.0, "sigma": 0.0})

    assert result["status"] == "calibration_set"
    assert result["mu"] == 0.0
    assert result["sigma"] > 0.0


def test_calibrate_finish_matches_rust_calibration_contract():
    service = PostureEngineService()
    service._calib_buffer = [
        {"pi": {"PI_raw": 1.0}, "pi_ema": 1.0} for _ in range(5)
    ]

    result = service.handle({"command": "calibrate_finish"})

    assert result["status"] == "completed"
    assert result["success"] is True
    assert result["nTotal"] == 5
    assert result["nPass"] == 5
    assert result["mu_PI"] == 1.0
    assert result["sigma_PI"] == 0.0
    assert result["passRate"] == 1.0
