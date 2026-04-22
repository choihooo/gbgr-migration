from engine.calculations import calculate_pi, check_frontality
from engine.posture_classifier import PostureClassifier
from engine.score_processor import ScoreProcessor


def build_landmarks():
    landmarks = [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(33)]
    landmarks[0] = {"x": 0.5, "y": 0.3, "z": 0.0}
    landmarks[7] = {"x": 0.4, "y": 0.2, "z": -0.2}
    landmarks[8] = {"x": 0.6, "y": 0.2, "z": -0.2}
    landmarks[11] = {"x": 0.4, "y": 0.5, "z": 0.3}
    landmarks[12] = {"x": 0.6, "y": 0.5, "z": 0.3}
    return landmarks


def test_calculate_pi_matches_legacy_formula():
    landmarks = build_landmarks()
    pi_result = calculate_pi(landmarks, landmarks)

    assert pi_result is not None
    assert round(pi_result["PI_raw"], 3) == 2.5
    assert round(pi_result["W"], 3) == 0.2


def test_frontality_rules_match_legacy_thresholds():
    landmarks = build_landmarks()
    result = check_frontality(landmarks)

    assert result["pass"] is True
    assert result["roll"] == 0
    assert result["centerRatio"] == 0


def test_score_processor_clamps_and_smooths_scores():
    processor = ScoreProcessor()
    last_score = 0.0

    for _ in range(40):
        last_score = processor.next(5.0)

    assert -10.0 <= last_score <= 40.0
    assert last_score < 5.0


def test_posture_classifier_preserves_hysteresis_events():
    classifier = PostureClassifier()

    for _ in range(40):
        result = classifier.classify(2.0, 0.0, 0.1)

    assert result.cls >= 4
    assert "enter_bad" in result.events or result.Score >= 1.2
