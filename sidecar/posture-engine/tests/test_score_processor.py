from engine.score_processor import ScoreProcessor


def test_clamps_and_preserves_constant_scores():
    processor = ScoreProcessor()
    last_score = 0.0

    for _ in range(40):
        last_score = processor.next(5.0)

    assert -10.0 <= last_score <= 40.0
    assert last_score == 5.0


def test_smooths_step_changes():
    processor = ScoreProcessor()

    for _ in range(20):
        processor.next(0.0)

    last_score = 0.0
    for _ in range(10):
        last_score = processor.next(5.0)

    assert 0.0 < last_score < 5.0
