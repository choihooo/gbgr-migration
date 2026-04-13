import { canAccessCalibrationFlow } from '@shared/lib/calibration-gate'
import { lazy } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'
import Layout from '../../app/layouts/Layout'

// 라우트 레벨 코드 스플리팅: 각 페이지를 lazy import
const CalibrationPage = lazy(() => import('../../pages/calibration-page'))
const EmailVerificationCallbackPage = lazy(
  () => import('../../pages/email-verification-callback-page'),
)
const EmailVerificationPage = lazy(
  () => import('../../pages/email-verification-page'),
)
const LoginPage = lazy(() => import('../../pages/login-page'))
const MainPage = lazy(() => import('../../pages/main-page'))
const OnboardingCompletionPage = lazy(
  () => import('../../pages/onboarding-completion-page'),
)
const OnboardingInitPage = lazy(
  () => import('../../pages/onboarding-init-page'),
)
const OnboardingPage = lazy(() => import('../../pages/onboarding-page'))
const ResendVerificationPage = lazy(
  () => import('../../pages/resend-verification-page'),
)
const SignUpPage = lazy(() => import('../../pages/signup-page'))
const WidgetPage = lazy(() => import('../../pages/widget-page'))

const hasAuthTokens = () => {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  return Boolean(accessToken && refreshToken)
}

// 인증이 필요한 페이지용 loader
const requireAuthLoader = async () => {
  if (!hasAuthTokens()) {
    throw redirect('/auth/login')
  }

  const userId = localStorage.getItem('userId')
  if (canAccessCalibrationFlow(userId)) {
    throw redirect('/onboarding/init')
  }

  return null
}

// 로그인 페이지용 loader
const loginPageLoader = async () => {
  if (hasAuthTokens()) {
    const userId = localStorage.getItem('userId')
    throw redirect(
      canAccessCalibrationFlow(userId) ? '/onboarding/init' : '/main',
    )
  }
  return null
}

const calibrationFlowLoader = async () => {
  if (!hasAuthTokens()) {
    throw redirect('/auth/login')
  }

  const userId = localStorage.getItem('userId')
  if (!canAccessCalibrationFlow(userId)) {
    throw redirect('/main')
  }

  return null
}

export const router = createBrowserRouter([
  {
    path: '/main',
    loader: requireAuthLoader,
    element: <MainPage />,
  },
  {
    element: <Layout />,
    path: '/auth',
    children: [
      {
        path: 'login',
        loader: loginPageLoader,
        element: <LoginPage />,
      },
      { path: 'signup', element: <SignUpPage /> },
      { path: 'verify', element: <EmailVerificationPage /> },
      { path: 'verify-callback', element: <EmailVerificationCallbackPage /> },
      { path: 'resend', element: <ResendVerificationPage /> },
    ],
  },
  {
    element: <Layout />,
    path: '/',
    children: [
      {
        path: '',
        loader: loginPageLoader,
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <Layout />,
    path: '/onboarding',
    loader: calibrationFlowLoader,
    children: [
      { path: '', element: <OnboardingPage /> },
      { path: 'calibration', element: <CalibrationPage /> },
      { path: 'completion', element: <OnboardingCompletionPage /> },
      { path: 'init', element: <OnboardingInitPage /> },
    ],
  },
  {
    path: '/widget',
    children: [{ path: '', element: <WidgetPage /> }],
  },
])
