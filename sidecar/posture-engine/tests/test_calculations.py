from engine.calculations import (
    calculate_pi,
    check_frontality,
    process_calibration_data,
)


def build_landmarks():
    landmarks = [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(33)]
    landmarks[0] = {"x": 0.5, "y": 0.3, "z": 0.0}
    landmarks[7] = {"x": 0.4, "y": 0.2, "z": -0.2}
    landmarks[8] = {"x": 0.6, "y": 0.2, "z": -0.2}
    landmarks[11] = {"x": 0.4, "y": 0.5, "z": 0.3}
    landmarks[12] = {"x": 0.6, "y": 0.5, "z": 0.3}
    return landmarks


def test_calculate_pi_matches_expected_formula():
    landmarks = build_landmarks()
    pi_result = calculate_pi(landmarks, landmarks)

    assert pi_result is not None
    assert round(pi_result["PI_raw"], 3) == 2.5
    assert round(pi_result["W"], 3) == 0.2


def test_frontality_rules_match_expected_thresholds():
    landmarks = build_landmarks()
    result = check_frontality(landmarks)

    assert result["pass"] is True
    assert result["roll"] == 0
    assert result["centerRatio"] == 0


def test_frontality_roll_is_not_affected_by_horizontal_side_order():
    landmarks = build_landmarks()
    landmarks[7]["x"] = 0.6
    landmarks[8]["x"] = 0.4

    result = check_frontality(landmarks)

    assert result["pass"] is True
    assert result["roll"] == 0


def test_frontality_fails_safely_when_landmarks_are_missing():
    result = check_frontality([])

    assert result["pass"] is False


def test_skip_frontal_check_ignores_missing_landmarks():
    frames = [{"pi": {"PI_raw": 1.0}, "pi_ema": 1.0} for _ in range(5)]

    result = process_calibration_data(frames, skip_frontal_check=True)

    assert result["success"] is True
    assert result["nPass"] == 5
