from engine.posture_classifier import PostureClassifier


def test_preserves_current_calibration_api():
    classifier = PostureClassifier()
    classifier.set_calibration(0.0, 0.1)

    for _ in range(40):
        result = classifier.classify(2.0)

    assert result.cls >= 4
    assert "enter_bad" in result.events or result.Score >= 1.2


def test_accepts_inline_calibration_args():
    classifier = PostureClassifier()

    for _ in range(40):
        result = classifier.classify(2.0, 0.0, 0.1)

    assert result.cls >= 4
    assert "enter_bad" in result.events or result.Score >= 1.2


def test_zero_sigma_calibration_still_classifies_posture():
    classifier = PostureClassifier()
    classifier.set_calibration(0.0, 0.0)

    result = classifier.classify(2.0)

    assert result.cls > 0
    assert result.text != "측정중"
