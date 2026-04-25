# 자세 추론 파이프라인 상세 설명

## 개요

자세 추론 파이프라인은 웹캠 프레임을 입력받아 사용자의 자세 상태를 6단계로 분류하는 시스템입니다. 전체 흐름은 다음과 같습니다.

```
웹캠 프레임 (base64)
  → MediaPipe Pose Landmarker (33개 랜드마크 추출)
  → 키 랜드마크 13개 추출
  → PI (Posture Index) 계산
  → EMA 스무딩
  → z-score 정규화
  → ScoreProcessor 필터링
  → PostureStabilizer 안정화
  → 6단계 자세 분류
```

---

## 1. 프레임 입력

### 1.1 Foreground 모드 (React → Sidecar)

React 웹캠(`react-webcam`)에서 매 프레임을 base64 JPEG로 캡처합니다. Tauri 명령어를 통해 stdin으로 sidecar 프로세스에 JSON 형태로 전달됩니다.

```json
{
  "command": "frame",
  "session_id": "abc-123",
  "image_payload": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

### 1.2 Background 모드 (Python 카메라)

React가 백그라운드에 있을 때는 Python의 `BackgroundCameraLoop`(OpenCV 기반)이 직접 카메라를 제어합니다. `background_tick` 명령이 들어오면 Python이 캡처한 프레임으로 동일한 분석을 수행합니다.

```json
{
  "command": "background_tick",
  "session_id": "abc-123"
}
```

### 1.3 프레임 디코딩

`pose_detector.py`의 `detect()` 메서드에서 base64 문자열을 numpy 이미지로 변환합니다.

```python
img_bytes = base64.b64decode(image_b64)
nparr = np.frombuffer(img_bytes, np.uint8)
bgr_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
mp_image = self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=rgb_image)
```

---

## 2. 포즈 감지 (Pose Detection)

### 2.1 MediaPipe Pose Landmarker

Google MediaPipe의 `PoseLandmarker`를 VIDEO 모드로 사용합니다.

**모델 설정:**
- 모델: `pose_landmarker_full.task` (TensorFlow Lite)
- 실행 모드: `VIDEO` (프레임 간 트래킹 지원)
- 타임스탬프: 50ms 간격 증가 (20fps 가정)

```python
options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=str(model_path)),
    running_mode=RunningMode.VIDEO,
    num_poses=1,
    min_pose_detection_confidence=0.2,
    min_pose_presence_confidence=0.2,
    min_tracking_confidence=0.2,
)
```

- `min_pose_detection_confidence=0.2`: 포즈가 감지되었는지 판단하는 최소 신뢰도. 낮추면 더 자주 감지하지만 오탐 증가.
- `min_pose_presence_confidence=0.2`: 프레임에 사람이 있는지 판단하는 최소 신뢰도.
- `min_tracking_confidence=0.2`: 프레임 간 트래킹 품질의 최소 신뢰도. 낮추면 트래킹이 유지되지만 정확도 하락.

### 2.2 랜드마크 추출

MediaPipe는 33개의 전신 랜드마크를 반환합니다. 각 랜드마크는 정규화된 좌표 `(x, y, z, visibility)`를 가집니다.

- **x, y**: 0~1 범위의 정규화된 2D 좌표 (이미지 내 위치)
- **z**: 깊이 정보. 엉덩이 중심을 원점으로 카메라 방향이 음수. x,y와 스케일이 다름 (대략적으로 절반 크기).
- **visibility**: 해당 관절이 이미지에 보이는지의 확률 (0~1)

**13개 키 랜드마크 (KEY_INDICES):**

| 인덱스 | 이름 | 용도 |
|--------|------|------|
| 0 | NOSE | 정면성 판단 (머리 중심) |
| 1 | LEFT_EYE_INNER | (참고) |
| 2 | LEFT_EYE | (참고) |
| 3 | LEFT_EYE_OUTER | (참고) |
| 4 | RIGHT_EYE_INNER | (참고) |
| 5 | RIGHT_EYE | (참고) |
| 6 | RIGHT_EYE_OUTER | (참고) |
| 7 | LEFT_EAR | PI 계산, 정면성 |
| 8 | RIGHT_EAR | PI 계산, 정면성 |
| 9 | MOUTH_LEFT | (참고) |
| 10 | MOUTH_RIGHT | (참고) |
| 11 | LEFT_SHOULDER | PI 계산, 정면성 |
| 12 | RIGHT_SHOULDER | PI 계산, 정면성 |

### 2.3 월드 랜드마크 (World Landmarks)

일반 랜드마크가 이미지 내 정규화된 좌표인 반면, **월드 랜드마크**는 실제 3D 공간 좌표(미터 단위 추정)입니다. PI 계산의 핵심 입력으로 사용됩니다.

- 월드 랜드마크가 없으면 2D 랜드마크를 fallback으로 사용하지만, z축 정보가 부정확해집니다.

---

## 3. PI (Posture Index) 계산

PI는 자세의 핵심 지표입니다. `calculations.py`의 `calculate_pi()`에서 계산합니다.

### 3.1 계산 공식

```
PI_raw = (어깨_중앙_z - 귀_중앙_z) / 어깨_너비
```

**상세:**
1. **어깨 중앙점**: `(LEFT_SHOULDER + RIGHT_SHOULDER) / 2` (월드 좌표)
2. **귀 중앙점**: `(LEFT_EAR + RIGHT_EAR) / 2` (월드 좌표)
3. **어깨 너비**: LEFT_SHOULDER ~ RIGHT_SHOULDER의 3D 유클리드 거리
4. **PI_raw**: z축 차이를 어깨 너비로 정규화한 값

### 3.2 PI 값의 의미

| PI_raw 범위 | 의미 |
|-------------|------|
| 양수 (큼) | 귀가 어깨보다 뒤에 있음 → 바른 자세 |
| 0 근처 | 귀와 어깨가 비슷한 z 위치 |
| 음수 | 귀가 어깨보다 앞에 있음 → 거북목 |

### 3.3 정규화 이유

z축 차이를 어깨 너비로 나누는 이유:
- 카메라 거리에 따른 z값 변화를 보정
- 체형(어깨 너비) 차이를 보정
- 결과적으로 0~1 근처의 무차원 값이 됨

---

## 4. 캘리브레이션 (Calibration)

### 4.1 목적

각 사용자의 "바른 자세" 기준을 잡기 위해 캘리브레이션을 수행합니다. 이 과정에서 사용자 고유의 **mu**(평균 PI)와 **sigma**(표준편차)를 구합니다.

### 4.2 캘리브레이션 프로세스

1. **`calibrate_start`**: 버퍼 초기화, EMA 리셋
2. **`calibrate_frame`** (반복): 프레임마다 PI 계산 + 정면성 체크 + 오류 검증 후 버퍼에 저장
3. **`calibrate_finish`**: 수집된 데이터로 mu/sigma 계산

### 4.3 정면성 체크 (Frontality Check)

캘리브레이션 중 사용자가 정면을 보고 있는지 확인합니다.

```
roll = |atan2(|R_ear_y - L_ear_y|, R_ear_x - L_ear_x)|
centerRatio = |nose_x - shoulder_center_x| / shoulder_width_2d
통과 조건: roll ≤ 10° AND centerRatio ≤ 0.15
```

- **roll**: 고개가 기울어진 정도. 10도 이하면 정면으로 간주.
- **centerRatio**: 코가 어깨 중앙에서 벗어난 정도. 15% 이하면 정면.

### 4.4 오류 검증 (Error Checks)

캘리브레이션 중 실시간으로 사용자에게 피드백을 제공합니다.

**Step 1 오류** (단일 프레임):
- `check_step1_error`: PI_raw > 0.7이면 "턱을 당겨주세요" 안내

**Step 2 오류** (다중 프레임 누적):
- `check_landmark_visibility`: 최근 10프레임 중 8개 이상에서 귀/어깨 가시성 < 0.3 → "뒤로 가주세요"
- `check_distance_and_position`: 어깠 너비 < 0.03 또는 중앙 이탈 > 0.7 → "가까이, 중앙으로 와주세요"
- `check_posture_stability`: PI 표준편차 > 0.04 또는 연속 변화 > 0.3 → "자세를 유지해주세요"
- `check_brightness`: 평균 밝기 < 0.2 → "밝게 해주세요"

### 4.5 mu/sigma 계산

`process_calibration_data()`에서 최종 통계를 계산합니다.

```python
# 절사 평균 (Trimmed Mean)
# 상하 5%를 제거한 후 평균과 표준편차 계산
stats = trimmed_stats(pi_values, trim_percent=0.05)
mu_PI = stats["mean"]      # 캘리브레이션 PI 평균
sigma_PI = stats["std"]    # 캘리브레이션 PI 표준편차
```

**품질 평가:**

| 품질 | 조건 |
|------|------|
| good | pass_rate ≥ 50% AND std < 0.2 |
| medium | pass_rate ≥ 30% AND std < 0.3 |
| poor | 그 외 |

최소 5개 이상의 정면성 통과 프레임이 필요합니다. 부족하면 캘리브레이션 실패.

---

## 5. 분류 (Classification)

### 5.1 EMA (Exponential Moving Average)

PI_raw에 EMA를 적용하여 노이즈를 줄입니다.

```python
alpha = 0.25  # 최근 값에 25% 가중치
PI_ema = alpha * PI_raw + (1 - alpha) * PI_ema_prev
```

- alpha=0.25는 상당히 강한 스무딩 (과거 값 75% 유지)
- 첫 프레임에서는 PI_ema = PI_raw

### 5.2 z-score 정규화

캘리브레이션 대비 현재 자세가 얼마나 벗어났는지를 z-score로 표현합니다.

```
z_pi = (PI_ema - mu) / (sigma + 1e-6)
```

- z_pi ≈ 0: 캘리브레이션과 비슷한 자세 (바른 자세)
- z_pi > 0: 캘리브레이션보다 더 바른 자세
- z_pi < 0: 캘리브레이션보다 나쁜 자세 (허리 굽힘, 거북목)

`1e-6`은 sigma=0인 경우(미보정) division by zero 방지용이며, sigma=0이면 측정중 상태로 분류 스킵.

### 5.3 ScoreProcessor

z-score를 시계열 필터링하여 안정적인 score를 만듭니다.

**동작:**
1. z-score를 버퍼에 저장 (최대 100개)
2. 버퍼가 30개 미만: **필터링 없이** raw z-score 그대로 반환 (clamp만 적용)
3. 버퍼가 30개 이상: 3단계 필터링 수행
   - **이동 평균** (window=15): 주변 15개 값의 단순 평균으로 급격한 변화 완화
   - **EMA 30** (alpha=2/31): window 30의 지수 이동 평균 1차 적용
   - **EMA 70** (alpha=2/71): window 70의 지수 이동 평균 2차 적용 (더 강한 스무딩)
4. 최종 score를 [-10, 40] 범위로 clamp

**버퍼 30개 미만의 문제점:**
- 앱 시작 후 첫 ~1.5초간 (20fps × 30프레임) 필터링이 적용되지 않음
- 이 구간에서는 z-score가 그대로 score가 되므로 값이 불안정할 수 있음

### 5.4 PostureStabilizer

ScoreProcessor 출력에 추가 안정화를 적용합니다. 급격한 단계 전환을 방지하는 것이 목적입니다.

**동작:**
1. 500ms 윈도우 내 score들을 버퍼에 유지
2. 새 score가 들어오면:
   - 버퍼가 5개 미만: 즉시 반영 (초기화 구간)
   - 버퍼가 5개 이상: 이전 score들의 시간 가중 평균과 현재 score의 차이가 0.5 이내면 반영, 아니면 마지막 안정 score 유지
3. 시간 가중: 최근일수록 높은 가중치 (`weight = 1 - elapsed/window_ms`)

**안정화 임계값:**
- `window_ms=500`: 0.5초 내 데이터로 판단
- `threshold=0.5`: score 차이가 0.5 이하면 안정적이라 판단
- `min_buffer_size=5`: 최소 5개 데이터 필요

### 5.5 최종 분류

안정화된 score를 기준으로 6단계로 분류합니다.

| 단계 | 이름 | score 범위 | 의미 |
|------|------|-----------|------|
| 1 | angel-rini | ≤ -7.0 | 매우 바른 자세 |
| 2 | pm-rini | -7.0 < x ≤ -3.6 | 꽤 바른 자세 |
| 3 | rini | -3.6 < x ≤ 1.2 | 보통 자세 |
| 4 | bugi | 1.2 < x ≤ 6.0 | 약간 나쁜 자세 |
| 5 | stone-bugi | 6.0 < x ≤ 12.5 | 나쁜 자세 |
| 6 | tire-bugi | > 12.5 | 매우 나쁜 자세 |

### 5.6 상태 전환 이벤트

분류와 별개로 자세 상태 머신이 동작합니다.

```
normal ──(score ≥ 1.2)──→ bad (이벤트: enter_bad)
bad   ──(score ≤ 0.8)──→ normal (이벤트: exit_bad)
```

- `enter_bad`: 자세가 나빠지기 시작하는 순간. 알림 트리거로 사용.
- `exit_bad`: 자세가 회복된 순간. 히스테리시스(1.2 진입 / 0.8 해제)로 플리커링 방지.

---

## 6. 전체 데이터 흐름 예시

정상적으로 측정 중인 경우의 예시:

```
입력: 웹캠 프레임 (640x480 JPEG)

[포즈 감지]
  MediaPipe → 33개 랜드마크 → 13개 키 포인트 추출
  코: (0.512, 0.283, -0.105) visibility=0.99
  L귀: (0.478, 0.298, -0.082) visibility=0.95
  R귀: (0.546, 0.295, -0.079) visibility=0.96
  L어깨: (0.382, 0.521, -0.150) visibility=0.99
  R어깨: (0.641, 0.518, -0.142) visibility=0.99

[PI 계산] (월드 랜드마크 사용)
  어깨_중앙_z = (-0.150 + -0.142) / 2 = -0.146
  귀_중앙_z = (-0.082 + -0.079) / 2 = -0.081
  어깠_너비 = 3D거리(L어깨, R어깨) = 0.423
  PI_raw = (-0.146 - -0.081) / 0.423 = -0.154

[EMA 스무딩]
  PI_ema = 0.25 × (-0.154) + 0.75 × (-0.148) = -0.150

[z-score]
  mu = -0.140, sigma = 0.032
  z_pi = (-0.150 - -0.140) / (0.032 + 0.000001) = -0.313

[ScoreProcessor]
  z_pi = -0.313 → 필터링 → raw_score = -0.287

[PostureStabilizer]
  raw_score = -0.287, 이전 안정 score = -0.310
  차이 = 0.023 ≤ 0.5 → 안정 → score = -0.287

[분류]
  score = -0.287 → ≤ 1.2 → rini (단계 3, 보통 자세)
```

---

## 7. 잠재적 문제점 및 디버깅 포인트

### 7.1 초기 구간 불안정

ScoreProcessor 버퍼가 30개 채워지기 전까지 필터링이 없습니다. 첫 ~1.5초간 score가 급격히 변할 수 있습니다.

### 7.2 캘리브레이션 품질

- sigma가 너무 작으면 (예: 0.01) z-score가 과도하게 커져 작은 움직임에도 큰 분류 변화 발생
- sigma가 너무 크면 (예: 0.1) z-score가 항상 0 근처여서 자세 변화를 감지 못함
- 캘리브레이션 중 흔들리면 sigma가 비정상적으로 커질 수 있음

### 7.3 월드 랜드마크 누락

MediaPipe가 월드 랜드마크를 제공하지 않으면 2D 랜드마크로 fallback합니다. 이 경우 z축 정보가 부정확하여 PI 계산의 신뢰도가 크게 떨어집니다.

### 7.4 EMA 지연

alpha=0.25는 강한 스무딩이므로 실제 자세 변화를 ~4프레임 정도 지연해서 반영합니다. 빠른 자세 변화에 대한 반응 속도가 느릴 수 있습니다.

### 7.5 PostureStabilizer 임계값

`threshold=0.5`는 score 0.5 차이까지는 안정으로 간주합니다. rini(≤1.2)와 bugi(>1.2) 경계에서 score가 0.9~1.5 사이를 오가면 단계가 자주 바뀔 수 있습니다.

---

## 8. 설정값 요약

| 파라미터 | 값 | 위치 | 설명 |
|----------|-----|------|------|
| min_pose_detection_confidence | 0.2 | PoseDetector | 포즈 감지 최소 신뢰도 |
| min_pose_presence_confidence | 0.2 | PoseDetector | 사람 존재 최소 신뢰도 |
| min_tracking_confidence | 0.2 | PoseDetector | 트래킹 최소 신뢰도 |
| EMA alpha | 0.25 | PostureClassifier | PI 스무딩 강도 |
| ScoreProcessor buffer | 100 | ScoreProcessor | z-score 히스토리 크기 |
| ScoreProcessor min_buffer | 30 | ScoreProcessor | 필터링 시작 최소 버퍼 |
| 이동평균 window | 15 | ScoreProcessor | 이동 평균 윈도우 |
| EMA window 1 | 30 | ScoreProcessor | 1차 EMA 윈도우 |
| EMA window 2 | 70 | ScoreProcessor | 2차 EMA 윈도우 |
| score clamp | [-10, 40] | ScoreProcessor | score 범위 제한 |
| stabilizer window | 500ms | PostureStabilizer | 안정화 판단 윈도우 |
| stabilizer threshold | 0.5 | PostureStabilizer | 안정화 판단 임계값 |
| stabilizer min_buffer | 5 | PostureStabilizer | 안정화 최소 버퍼 |
| 절사 비율 | 5% | calculations | 캘리브레이션 통계 절사 |
| 최소 캘리브레이션 프레임 | 5 | calculations | 캘리브레이션 최소 샘플 |
| frontality roll | ≤ 10° | calculations | 정면성 roll 임계값 |
| frontality centerRatio | ≤ 0.15 | calculations | 정면성 중심 이탈 임계값 |
| enter_bad threshold | ≥ 1.2 | PostureClassifier | 나쁜 자세 진입 |
| exit_bad threshold | ≤ 0.8 | PostureClassifier | 나쁜 자세 해제 |
