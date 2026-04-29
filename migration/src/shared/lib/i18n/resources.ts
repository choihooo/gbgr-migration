export const defaultLanguage = 'ko' as const

export const supportedLanguages = ['ko', 'en'] as const

export type AppLanguage = (typeof supportedLanguages)[number]

export const resources = {
  ko: {
    translation: {
      app: {
        name: '거부기린',
      },
      auth: {
        slogan: '세상 모든 거북목들이 기린이 될 때까지',
        login: {
          emailPlaceholder: '이메일',
          passwordPlaceholder: '비밀번호',
          missingCredentials: '이메일 또는 비밀번호를 입력해주세요.',
          invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
          sessionExpired: '세션이 만료되었습니다. 다시 로그인해주세요.',
          restoreFailed: '사용자 정보를 복구하지 못했습니다.',
          genericFailure: '로그인 중 오류가 발생했습니다.',
          unverifiedRedirect:
            '이메일 인증이 필요합니다. 인증 화면으로 이동합니다.',
          saveId: '아이디 저장',
          submit: '로그인',
          signup: '회원가입',
          forgotPassword: '비밀번호 찾기',
        },
        signup: {
          title: '회원가입',
          email: '이메일',
          emailPlaceholder: '이메일을 입력해주세요.',
          duplicateCheck: '중복확인',
          duplicateRequired: '이메일 중복확인을 완료해주세요',
          duplicateCheckFailed:
            '이메일 중복확인에 실패했습니다. 다시 시도해주세요.',
          duplicateAvailable: '사용 가능한 이메일입니다.',
          duplicateExists: '이미 가입된 이메일입니다.',
          password: '비밀번호',
          passwordGuide:
            '영문, 숫자, 특수문자를 조합하여 8-16글자로 입력해주세요.',
          confirmPasswordPlaceholder: '비밀번호를 재입력해주세요.',
          confirmPasswordMatch: '비밀번호가 일치합니다.',
          confirmPasswordMismatch: '비밀번호가 일치하지 않습니다.',
          name: '이름',
          namePlaceholder: '이름을 입력해주세요.',
          nameGuide: '최대 10글자 이내로 작성해주세요.',
          nameAvailable: '사용 가능한 이름입니다.',
          submit: '완료',
          resendPrompt: '이메일을 못받으셨나요?',
          resendAction: '이메일 다시 보내기',
          verificationTitle: '이메일 인증',
          verificationHighlightFallback: '입력한 이메일',
          verificationLine1Prefix: '본인 인증 메일을 귀하의',
          verificationLine1Suffix: '로 보냈습니다.',
          verificationLine2Prefix: '받은 메일함에서 인증 메일을 열고',
          verificationLine2Highlight: '본인인증',
          verificationLine2Suffix: '을 클릭하면 회원가입이 완료됩니다.',
          verificationResent: '{{email}}로 인증 메일을 다시 보냈습니다.',
          resendSentTitle: '인증 링크를 메일로 전송했습니다',
          resendSentLine1: '이메일로 전송 받은 인증 링크를 확인해주세요.',
          resendSentLine2: '링크는 발송 시점으로부터 24시간 동안 유효합니다.',
          resendSentToast: '인증 링크를 다시 전송했습니다.',
          resendFailed: '인증 링크 재전송에 실패했습니다. 다시 시도해주세요.',
          submitFailed: '회원가입에 실패했습니다. 다시 시도해주세요.',
          missingEmail: '이메일 정보 없음',
          callbackTitle: '환영합니다',
          callbackErrorTitle: '인증에 실패했습니다',
          callbackFailed: '유효하지 않거나 만료된 인증 링크입니다.',
          callbackMissingToken: '인증 토큰이 없어 인증을 진행할 수 없습니다.',
          callbackRetryLine1: '거부기린 앱으로 돌아가서',
          callbackRetryLine2: '인증 메일을 다시 요청해주세요.',
          callbackLine1: '이메일 인증이 완료되었습니다.',
          callbackLine2: '거부기린 앱으로 돌아가서',
          callbackLine3: '로그인하여 서비스를 이용해주세요.',
        },
        validation: {
          emailRequired: '이메일을 입력해주세요.',
          emailInvalid: '유효한 이메일을 입력해주세요.',
          passwordMin: '비밀번호는 8자 이상이어야 합니다.',
          passwordMax: '비밀번호는 16자 이하여야 합니다.',
          passwordPattern: '영문, 숫자, 특수문자를 조합해주세요.',
          nameRequired: '이름을 입력해주세요.',
          nameMax: '최대 글자수를 초과했습니다.',
          nameNoWhitespace: '띄어쓰기 없이 붙여 작성해주세요.',
        },
      },
      onboarding: {
        pageTitle: '온보딩 페이지',
        initPageTitle: '온보딩 시작 페이지',
        completionPageTitle: '온보딩 완료 페이지',
        calibrationPageTitle: '보정 페이지',
        init: {
          privacyNote:
            '영상은 사용자의 PC에서만 처리되며, 어디에도 저장되거나 전송되지 않으니 안심하세요.',
          greeting:
            '안녕하세요! {{userName}}님의 자세 건강을 책임질 AI 파트너, 거부기린이에요.',
          steps: [
            {
              keypoint: 'Keypoint 1',
              title: '바른 자세 분석',
              description:
                '이제부터 {{userName}}님이 일하는 동안 웹캠을 통해 실시간으로 자세를 분석해 드릴게요.',
            },
            {
              keypoint: 'Keypoint 2',
              title: '실시간 위젯 피드백',
              description:
                '화면 상단 작은 위젯의 기린과 거북이가 실시간 자세 피드백을 제공해요.',
            },
            {
              keypoint: 'Keypoint 3',
              title: '데이터로 보는 대시보드',
              description:
                '주간, 월간 단위의 개인화 통계와 패턴 분석을 통해 나도 몰랐던 나의 자세 습관을 발견할 수 있어요.\nAI가 제안하는 맞춤형 팁을 통해 자발적이고 지속적인 변화를 느껴보세요.',
            },
            {
              keypoint: 'Keypoint 4',
              title: '스마트 알림',
              description:
                '자세가 심하게 나빠지거나 스트레칭이 필요한 순간을 AI가 정확하게 포착하여 똑똑하게 알려드려요.',
            },
            {
              keypoint: 'Keypoint 5',
              title: '즐거운 게임을 통한 자세 교정',
              description:
                '건강 관리는 지루하다는 편견을 깨기 위해 게이미페케이션 요소를 넣었어요.\n바른 자세를 유지할수록 나의 캐릭터가 레벨업하고 더 빨리 달려 보상을 받을 수 있어요.',
            },
          ],
          next: '다음',
          start: '시작하기',
        },
        camera: {
          title: '카메라 사용 권한',
          description:
            '거부기린은 PC 웹캠을 통해 사용자의 자세를 실시간으로 분석해요.',
          privacyNote:
            '모든 분석은 사용자 PC 내에서만 이루어지며 영상은 서버로 전송되지 않아요.',
          button: '카메라 권한 허용',
        },
        calibration: {
          welcomeTitle: '바른자세 기준점 등록',
          welcomeDescription:
            '{{userName}}님의 바른 자세를 등록할 준비가 되셨다면',
          welcomeDescriptionLine2: '측정하기 버튼을 눌러주세요.',
          measureButton: '측정하기',
          step1Message: '의자에 편안히 앉아 허리를 펴고 턱을 당겨주세요',
          step2Message:
            '화면의 가이드에 맞춰 바르다고 생각하는 자세를 5초간 유지해주세요',
          engineUnavailable: '자세 측정 엔진이 아직 연결되지 않았습니다.',
          engineUnavailableDescription:
            '측정 기능은 추후 업데이트에서 제공됩니다.',
        },
        completion: {
          title: '자세 등록 완료',
          description: '이제부터 거부기린과 함께 거북목을 개선해볼까요?',
          button: '시작하기',
          creatingSession: '세션 생성 중...',
        },
      },
      dashboard: {
        pageTitle: '메인 페이지',
        lastUpdatedAt: '마지막 갱신일: {{value}}',
        header: {
          dashboard: '대시보드',
          settings: '설정',
          report: '오류 제보',
          review: '후기 등록',
        },
        notification: {
          allow: '알림 허용',
          save: '저장하기',
          stretchingTitle: '맞춤 스트레칭 주기',
          stretchingDescription:
            '나만의 스트레칭 타이밍이에요. 뽀모도로 타이머처럼 휴식 구간으로 설정해도 좋아요',
          turtleTitle: '거북목 경고',
          turtleDescription: '거북목 자세가 지속되면 자세 교정 알림이 울려요',
          decreaseTime: '시간 감소',
          increaseTime: '시간 증가',
          minutes: '{{value}}분',
        },
        webcam: {
          creatingSession: '세션 생성 중...',
          stoppingSession: '세션 종료 중...',
          start: '시작하기',
          stop: '종료하기',
          widget: '위젯',
        },
        panels: {
          averageGraph: {
            title: '바른 자세 점수',
            weekly: '주간',
            monthly: '월간',
            score: '점수',
          },
          highlights: {
            title: '하이라이트',
            weekly: '주간',
            monthly: '월간',
            unit: '단위: 분/일',
            previousWeek: '저번 주',
            currentWeek: '이번 주',
            previousMonth: '저번 달',
            currentMonth: '이번 달',
          },
          averagePosture: {
            title: '평균 자세 점수',
            score: '{{value}}점',
            neckTilt: '목 평균 기울기 {{value}}',
            expectedWeight: '예상 하중 {{value}}',
          },
          attendance: {
            title: '출석 현황',
            month: '{{value}}월',
            previousMonth: '이전 달',
            nextMonth: '다음 달',
            weekly: '월간',
            yearly: '연간',
            less: 'Less',
            more: 'More',
            fallbackTitle: '잘하고 있어요!',
            fallbackMessage:
              '당신은 매일 골든리트리버 한 마리를 목에 업고 작업한 것과 같아요 🥺',
            level1: '뚠뚠한 골든리트리버 한 마리를 매일 목에 업고 있어요 🐶',
            level2: '기내용 캐리어를 목 위에 올려두고 앉아 있는 셈이에요 🧳',
            level3: '무거운 볼링공을 목에 걸고 일하는 중이에요 🎳',
            level4: '작은 수박 한 통 정도를 목에 얹은 상태예요 🍉',
            level5: '머리 본연의 무게만 딱! 지금 아주 좋아요 🌸',
            sunday: '일',
            monday: '월',
            tuesday: '화',
            wednesday: '수',
            thursday: '목',
            friday: '금',
            saturday: '토',
          },
          report: {
            loading: '리포트를 불러오는 중...',
            error: '리포트를 불러올 수 없습니다',
            empty: '세션 데이터가 없습니다',
            todayReport: '오늘의 리포트',
            totalDistance: '오늘 총 {{value}}m 이동했어요',
            usageTime: '사용시간',
            postureTime: '바른 자세 시간',
            postureScore: '바른 자세 점수',
            score: '{{value}}점',
            hourMinute: '{{hours}}시간 {{minutes}}분',
            runningBest: '최고 속도로 가는 중!',
            runningFast: '빠르게 가는 중!',
            runningGood: '씽씽 가는 중!',
            runningSlow: '천천히 가는 중',
            runningSlower: '느릿느릿 가는중..',
            runningSlowest: '엉금엉금 가는중..',
            runningFallback: '가는 중',
            levelImageAlt: '레벨 이미지',
          },
        },
      },
      settings: {
        title: '설정',
        close: '닫기',
        startup: {
          label: 'OS 시작 시 자동 실행',
          loading: '현재 상태를 확인하고 있어요.',
          unsupported: '현재 운영체제에서는 지원하지 않아요.',
          saving: '설정을 적용하고 있어요.',
          enabledDescription: '컴퓨터 로그인 후 거부기린을 자동으로 실행해요.',
          errorFallback: '자동 실행 설정을 변경하지 못했습니다.',
        },
        update: {
          label: '앱 업데이트',
          description: '새 버전이 있는지 확인하고 바로 설치할 수 있어요.',
          checking: '새 버전을 확인하고 있어요.',
          installing: '업데이트를 설치하고 있어요.',
          unconfigured: '업데이트 서버가 아직 설정되지 않았어요.',
          noUpdate: '최신 버전을 사용 중이에요.',
          availableDescription: '{{version}} 버전 업데이트를 설치할 수 있어요.',
          installedDescription:
            '업데이트가 설치되었어요. 앱을 다시 시작해주세요.',
          installingExit:
            '업데이트 설치를 위해 앱이 종료되거나 재시작될 수 있어요.',
          checkAction: '업데이트 확인',
          installAction: '업데이트 설치',
          errorFallback: '업데이트를 진행하지 못했습니다.',
        },
        actions: {
          logout: '로그아웃',
          withdraw: '회원탈퇴',
          calibrationReset: '캘리브레이션 재설정',
          withdrawConfirm: '정말 회원탈퇴 하시겠어요?',
        },
        language: {
          sectionTitle: '언어',
          label: '앱 언어',
          description: '설정 모달에서 앱 표시 언어를 바로 변경할 수 있습니다.',
          optionKo: '한국어',
          optionEn: '영어',
        },
      },
    },
  },
  en: {
    translation: {
      app: {
        name: 'Posture turtle',
      },
      auth: {
        slogan: 'Until every forward head posture stands tall like a giraffe',
        login: {
          emailPlaceholder: 'Email',
          passwordPlaceholder: 'Password',
          missingCredentials: 'Please enter your email and password.',
          invalidCredentials: 'Your email or password is incorrect.',
          sessionExpired: 'Your session expired. Please log in again.',
          restoreFailed: 'We could not restore your user information.',
          genericFailure: 'An error occurred while logging in.',
          unverifiedRedirect:
            'Email verification is required. Redirecting to verification.',
          saveId: 'Remember email',
          submit: 'Log in',
          signup: 'Sign up',
          forgotPassword: 'Forgot password',
        },
        signup: {
          title: 'Sign up',
          email: 'Email',
          emailPlaceholder: 'Enter your email.',
          duplicateCheck: 'Check',
          duplicateRequired: 'Please complete the email duplication check.',
          duplicateCheckFailed:
            'We could not complete the email duplication check. Please try again.',
          duplicateAvailable: 'This email is available.',
          duplicateExists: 'This email is already registered.',
          password: 'Password',
          passwordGuide:
            'Use 8-16 characters with letters, numbers, and special characters.',
          confirmPasswordPlaceholder: 'Re-enter your password.',
          confirmPasswordMatch: 'Passwords match.',
          confirmPasswordMismatch: 'Passwords do not match.',
          name: 'Name',
          namePlaceholder: 'Enter your name.',
          nameGuide: 'Please use up to 10 characters.',
          nameAvailable: 'This name is available.',
          submit: 'Done',
          resendPrompt: "Didn't receive the email?",
          resendAction: 'Send again',
          verificationTitle: 'Email verification',
          verificationHighlightFallback: 'your email',
          verificationLine1Prefix: 'We sent a verification email to',
          verificationLine1Suffix: '.',
          verificationLine2Prefix: 'Open the email in your inbox and click',
          verificationLine2Highlight: 'Verify',
          verificationLine2Suffix: ' to complete sign up.',
          verificationResent:
            'We sent the verification email again to {{email}}.',
          resendSentTitle: 'We sent the verification link by email',
          resendSentLine1:
            'Please check the verification link sent to your email.',
          resendSentLine2:
            'The link is valid for 24 hours from the time it was sent.',
          resendSentToast: 'The verification link was sent again.',
          resendFailed:
            'We could not resend the verification link. Please try again.',
          submitFailed: 'Sign up failed. Please try again.',
          missingEmail: 'No email information',
          callbackTitle: 'Welcome',
          callbackErrorTitle: 'Verification failed',
          callbackFailed: 'This verification link is invalid or expired.',
          callbackMissingToken:
            'The verification token is missing, so verification cannot continue.',
          callbackRetryLine1: 'Return to the Posture turtle app',
          callbackRetryLine2: 'and request the verification email again.',
          callbackLine1: 'Your email has been verified.',
          callbackLine2: 'Return to the Posture turtle app',
          callbackLine3: 'and log in to continue.',
        },
        validation: {
          emailRequired: 'Please enter your email.',
          emailInvalid: 'Please enter a valid email address.',
          passwordMin: 'Password must be at least 8 characters.',
          passwordMax: 'Password must be 16 characters or fewer.',
          passwordPattern:
            'Use a combination of letters, numbers, and special characters.',
          nameRequired: 'Please enter your name.',
          nameMax: 'You exceeded the maximum number of characters.',
          nameNoWhitespace: 'Please enter your name without spaces.',
        },
      },
      onboarding: {
        pageTitle: 'Onboarding Page',
        initPageTitle: 'Onboarding Init Page',
        completionPageTitle: 'Onboarding Completion Page',
        calibrationPageTitle: 'Calibration Page',
        init: {
          privacyNote:
            'Video is processed only on your PC and is never stored or transmitted anywhere else, so please rest assured.',
          greeting:
            "Hello! I'm Posture turtle, your AI partner responsible for {{userName}}'s posture health.",
          steps: [
            {
              keypoint: 'Keypoint 1',
              title: 'Posture Analysis',
              description:
                "From now on, we'll analyze your posture in real-time through your webcam while you work.",
            },
            {
              keypoint: 'Keypoint 2',
              title: 'Real-time Widget Feedback',
              description:
                'The giraffe and turtle on the small widget at the top of the screen provide real-time posture feedback.',
            },
            {
              keypoint: 'Keypoint 3',
              title: 'Data-driven Dashboard',
              description:
                'Discover your unknown posture habits through personalized weekly and monthly statistics and pattern analysis.\nExperience voluntary and lasting change with AI-suggested personalized tips.',
            },
            {
              keypoint: 'Keypoint 4',
              title: 'Smart Notifications',
              description:
                'AI accurately detects when your posture gets significantly worse or when you need stretching, and notifies you smartly.',
            },
            {
              keypoint: 'Keypoint 5',
              title: 'Posture Correction Through Fun Games',
              description:
                'We added gamification elements to break the prejudice that health management is boring.\nThe better your posture, the more your character levels up and runs faster to earn rewards.',
            },
          ],
          next: 'Next',
          start: 'Get Started',
        },
        camera: {
          title: 'Camera Permission',
          description:
            'Posture turtle analyzes your posture in real-time through your PC webcam.',
          privacyNote:
            'All analysis is done only on your PC, and video is never transmitted to the server.',
          button: 'Allow Camera Access',
        },
        calibration: {
          welcomeTitle: 'Register Posture Baseline',
          welcomeDescription:
            "{{userName}}, when you're ready to register your correct posture,",
          welcomeDescriptionLine2: 'press the Measure button.',
          measureButton: 'Measure',
          step1Message:
            'Sit comfortably in your chair, straighten your back, and tuck your chin in',
          step2Message:
            'Maintain what you consider correct posture for 5 seconds following the on-screen guide',
          engineUnavailable:
            'The posture measurement engine is not yet connected.',
          engineUnavailableDescription:
            'The measurement feature will be provided in a future update.',
        },
        completion: {
          title: 'Posture Registration Complete',
          description:
            'Shall we start improving your forward head posture with Posture turtle?',
          button: 'Get Started',
          creatingSession: 'Creating session...',
        },
      },
      dashboard: {
        pageTitle: 'Main Page',
        lastUpdatedAt: 'Last updated: {{value}}',
        header: {
          dashboard: 'Dashboard',
          settings: 'Settings',
          report: 'Report issue',
          review: 'Leave review',
        },
        notification: {
          allow: 'Allow notifications',
          save: 'Save',
          stretchingTitle: 'Custom stretching interval',
          stretchingDescription:
            'Choose your own stretching timing. It also works well as a Pomodoro-style break reminder.',
          turtleTitle: 'Forward head posture warning',
          turtleDescription:
            'A posture correction notification will sound if poor posture continues.',
          decreaseTime: 'Decrease time',
          increaseTime: 'Increase time',
          minutes: '{{value}} min',
        },
        webcam: {
          creatingSession: 'Creating session...',
          stoppingSession: 'Stopping session...',
          start: 'Start',
          stop: 'Stop',
          widget: 'Widget',
        },
        panels: {
          averageGraph: {
            title: 'Correct posture score',
            weekly: 'Weekly',
            monthly: 'Monthly',
            score: 'Score',
          },
          highlights: {
            title: 'Highlights',
            weekly: 'Weekly',
            monthly: 'Monthly',
            unit: 'Unit: min/day',
            previousWeek: 'Last week',
            currentWeek: 'This week',
            previousMonth: 'Last month',
            currentMonth: 'This month',
          },
          averagePosture: {
            title: 'Average posture score',
            score: '{{value}} pts',
            neckTilt: 'Average neck tilt {{value}}',
            expectedWeight: 'Estimated load {{value}}',
          },
          attendance: {
            title: 'Attendance',
            month: '{{value}}',
            previousMonth: 'Previous month',
            nextMonth: 'Next month',
            weekly: 'Monthly',
            yearly: 'Yearly',
            less: 'Less',
            more: 'More',
            fallbackTitle: 'You are doing great!',
            fallbackMessage:
              'It is like carrying a golden retriever on your neck every day while you work 🥺',
            level1:
              'It is like carrying a chubby golden retriever on your neck every day 🐶',
            level2:
              'It is like sitting with a carry-on suitcase resting on your neck 🧳',
            level3:
              'It is like working with a heavy bowling ball hanging from your neck 🎳',
            level4: 'It is like balancing a small watermelon on your neck 🍉',
            level5:
              'Only the natural weight of your head. You are doing great 🌸',
            sunday: 'Sun',
            monday: 'Mon',
            tuesday: 'Tue',
            wednesday: 'Wed',
            thursday: 'Thu',
            friday: 'Fri',
            saturday: 'Sat',
          },
          report: {
            loading: 'Loading report...',
            error: 'Unable to load the report',
            empty: 'No session data available',
            todayReport: "Today's report",
            totalDistance: 'Moved {{value}}m in total today',
            usageTime: 'Usage time',
            postureTime: 'Correct posture time',
            postureScore: 'Correct posture score',
            score: '{{value}} pts',
            hourMinute: '{{hours}}h {{minutes}}m',
            runningBest: 'Moving at top speed!',
            runningFast: 'Moving fast!',
            runningGood: 'Moving smoothly!',
            runningSlow: 'Moving slowly',
            runningSlower: 'Moving very slowly..',
            runningSlowest: 'Crawling along..',
            runningFallback: 'Moving',
            levelImageAlt: 'Level image',
          },
        },
      },
      settings: {
        title: 'Settings',
        close: 'Close',
        startup: {
          label: 'Run on OS startup',
          loading: 'Checking the current status.',
          unsupported: 'This is not supported on the current operating system.',
          saving: 'Applying the setting.',
          enabledDescription:
            'Automatically launches Posture turtle after you sign in to your computer.',
          errorFallback: 'We could not update the startup setting.',
        },
        update: {
          label: 'App updates',
          description:
            'Check whether a new version is available and install it right away.',
          checking: 'Checking for a new version.',
          installing: 'Installing the update.',
          unconfigured: 'The update server has not been configured yet.',
          noUpdate: 'You are already using the latest version.',
          availableDescription: 'Version {{version}} is available to install.',
          installedDescription:
            'The update has been installed. Please restart the app.',
          installingExit:
            'The app may close or restart while the update is being installed.',
          checkAction: 'Check updates',
          installAction: 'Install update',
          errorFallback: 'We could not complete the update.',
        },
        actions: {
          logout: 'Log out',
          withdraw: 'Delete account',
          calibrationReset: 'Reset calibration',
          withdrawConfirm: 'Are you sure you want to delete your account?',
        },
        language: {
          sectionTitle: 'Language',
          label: 'App language',
          description:
            'Change the app display language directly from the settings modal.',
          optionKo: 'Korean',
          optionEn: 'English',
        },
      },
    },
  },
} as const
