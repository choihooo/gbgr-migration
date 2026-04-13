## Analytics Runtime Notes

- Renderer에서는 `logEvent(name, params)`만 호출합니다.
- 실제 전송은 `preload -> ipc -> main` 경유로 GA4 Measurement Protocol(`mp/collect`)에서 처리합니다.
- `GA4_API_SECRET`은 루트 `.env` + Main 프로세스에서만 읽습니다.
- 자동 `page_view`는 사용하지 않습니다.

name affectsfunnel affectretention category description ga등록여부 metricpurpose notes parameters qachecked requiredparams screen sessionidrequried status trigger useridrequired userscope

download_click Yes No 퍼널 설치 페이지에서 사용자가 다운로드 버튼을 클릭한 행동을 추적하는 이벤트 No 유입 채널 및 OS별 다운로드 전환율을 분석하여 마케팅 효율과 초기 서비스 관심도를 측정 platform: string (mac | windows),
source: string (landing | blog | ad) No platform,source download No Ready 설치 페이지 내 다운로드 버튼 클릭 시 No anonymous
sign_up_complete Yes Yes 퍼널 사용자가 회원가입 프로세스를 끝까지 완료하여 서비스 이용이 가능한 상태가 되었음을 나타내는 이벤트 No 가입 전환율 측정 및 이후 리텐션·코호트 분석의 기준점(anchor) 설정 user_id: string No user_id email_verify No Ready 회원가입 메일 확인 클릭 시 Yes logged_in
onboarding_enter Yes No 퍼널 회원가입 이후 사용자가 초기 설정을 진행하기 위해 온보딩 플로우에 진입했음을 나타내는 이벤트 No 온보딩 진입률을 기준으로 초기 설정 단계에서의 이탈 여부 및 병목 구간을 분석 step: string (posture_calibration) No step onboarding No Ready 회원가입 완료 후 온보딩 화면 최초 진입 시 Yes logged_in
measure_page_enter Yes No 퍼널 사용자가 실제 자세 측정을 시작하기 위해 메인 측정 페이지에 진입했음을 나타내는 이벤트 No 가입 및 온보딩 이후 핵심 기능(측정)까지 도달한 유저 비율 session_id: string, No session_id main Yes Ready 메인 화면으로 최초 진입 시 Yes logged_in
first_measure_start Yes No 퍼널 회원가입 완료 시점부터 사용자가 처음으로 자세 측정을 시작하기까지 소요된 시간을 기록하는 이벤트 No 가입 이후 사용자가 핵심 가치(AHA Moment)에 도달하는 데 걸리는 시간 분포를 분석하여 온보딩 효율성과 초기 경험 품질을 평가 seconds_from_signup: number No seconds_from_signup main No Ready 사용자의 첫 측정 Start 버튼 클릭 시 Yes logged_in
measure_start No No 활성 사용자가 자세 측정을 실제로 시작했음을 나타내는 이벤트 No 유저별 측정 시작 빈도 및 활성 사용 여부(DAU 대비 실제 사용률) 분석 하나의 측정 흐름을 식별하기 위해 measure_end 이벤트와 동일한 session_id를 사용 session_id: string No session_id main Yes Ready 측정 Start 버튼 클릭 시 Yes logged_in
measure_end No No 활성 사용자가 진행 중이던 자세 측정을 종료했음을 나타내는 이벤트 No 유저별 단일 측정 시간과 전체 서비스 이용 시간 합산을 통한 활동량 분석 duration_sec는 측정 시작 시각과 종료 시각을 클라이언트에서 계산하여 전송하며, 비정상 종료(앱 종료 등)는 별도 케이스로 처리 가능 session_id: string,
duration_sec: number No duration_sec,session_id main Yes Ready 측정 Stop 버튼 클릭 또는 측정 자동 종료 시 Yes logged_in
bad_posture_enter No No 핵심 자세가 임계치를 벗어나 거북이 상태로 진입했음을 나타내는 이벤트 No 유저별 자세 심각도 분포 분석 및 세션/유저 단위 문제 발생 총량 파악 session_id: string, posture_level: number No session_id main Yes Ready 정상 또는 기린 상태에서 거북이 레벨(1|2|3)로 최초 전이되는 시점 Yes logged_in
posture_recovered No No 핵심 거북이 상태에서 정상(기린) 자세로 복원되었음을 나타내는 이벤트 No 교정 성공률 산출 및 전체 유저 평균 복원 소요 시간으로 교정 실효성 증명 recovery_time_sec: number, posture_level: number, session_id: string No session_id main Yes Ready 거북이 상태 이후 기린 레벨(4|5|6)로 전이되는 시점 Yes logged_in
widget_toggle No No 위젯 사용자가 자세 교정 위젯을 활성화하거나 비활성화했음을 나타내는 이벤트
Trigger: 위젯 On/Off 토글 스위치 변경 시 No 사용자가 자세 교정 위젯을 활성화하거나 비활성화했음을 나타내는 이벤트 enabled: boolean (true | false) No enabled widget No Ready 위젯 On/Off 토글 스위치 변경 시 Yes logged_in
widget_visibility_end No No 위젯 활성화된 위젯이 화면에서 노출되었다가 사라질 때까지의 지속 시간을 기록하는 이벤트 No 위젯 실제 노출 시간을 기반으로 자발적 교정 행동의 강도와 위젯 방식의 실효성을 평가 duration_sec: number,
session_id: string (optional) No duration_sec widget No Ready 위젯이 비활성화되거나 화면에서 제거되는 시점 Yes logged_in
notification_toggle No No 알림 사용자가 자세 교정 알림 기능을 활성화하거나 비활성화했음을 나타내는 이벤트 No 알림 기반 교정 방식과 위젯 기반 교정 방식에 대한 유저 선호도를 분류하고, 교정 행동 유도 방식의 효과를 비교 분석 enabled: boolean (true | false) No enabled settings No Ready 알림 설정 화면 또는 토글 스위치에서 알림 On/Off 변경 시 Yes logged_in
app_open No Yes 잔존 회원가입 후 7일 시점에 사용자가 앱을 다시 실행했는지를 기준으로 측정하는 리텐션 지표 No 가입 후 7일 이내 서비스에 재방문한 유저 비율을 측정하여 전체 서비스의 기본 존속성(rolling retention)을 파악 GA4 기본 app_open 이벤트를 사용하며, 별도 커스텀 이벤트는 생성하지 않고 탐색(Explore)에서 Day 7 기준으로 분석 No app No Ready 앱 실행 시 Yes logged_in
meaningful_use No Yes 잔존 회원가입 후 7일 시점에 사용자가 실제로 핵심 기능(자세 측정)을 수행했는지를 기준으로 측정하는 진성 리텐션 지표 No 단순 재접속이 아닌 실제 가치 행동을 기준으로 한 진성 유저 잔존율을 측정하여 PMF 여부를 판단 measure_start 이벤트를 리텐션 기준으로 직접 사용해도 되며, 분석 명확성을 위해 별도의 의미적 이벤트(meaningful_use)로 추상화 가능 type: string (measure_start) No type main No Ready 측정 Start 버튼 클릭 시 (7일 이후) Yes logged_in
