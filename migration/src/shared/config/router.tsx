import { lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import RootLayout from '@/app/layouts/RootLayout'
// TODO: 인증 우회 복원 — 아래 import 주석 해제
// import { ProtectedRoute, PublicOnlyRoute } from '@/shared/config/auth-routes'
// TODO: 보정 게이트 복원 (007 구현 완료 후)
// import { CalibrationRouteGuard } from '@/shared/lib/calibration-route-guard'
// TODO: 인증 우회 복원 — 아래 라인 주석 해제 후 Outlet 제거
// import { ProtectedRoute, PublicOnlyRoute } from '@/shared/config/auth-routes'

const LoginPage = lazy(() => import('@/pages/login-page'))
const SignupPage = lazy(() => import('@/pages/signup-page'))
const EmailVerificationPage = lazy(
  () => import('@/pages/email-verification-page'),
)
const EmailVerificationCallbackPage = lazy(
  () => import('@/pages/email-verification-callback-page'),
)
const ResendVerificationPage = lazy(
  () => import('@/pages/resend-verification-page'),
)
const MainPage = lazy(() => import('@/pages/main-page'))
const OnboardingPage = lazy(() => import('@/pages/onboarding-page'))
const OnboardingInitPage = lazy(() => import('@/pages/onboarding-init-page'))
const CalibrationPage = lazy(() => import('@/pages/calibration-page'))
const OnboardingCompletionPage = lazy(
  () => import('@/pages/onboarding-completion-page'),
)
const WidgetPage = lazy(() => import('@/pages/widget-page'))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/main" replace />,
      },
      {
        // TODO: 인증 우회 복원 — PublicOnlyRoute로 감싸기
        path: '/auth/login',
        element: <LoginPage />,
      },
      {
        path: '/auth/signup',
        element: <SignupPage />,
      },
      {
        path: '/auth/verify',
        element: <EmailVerificationPage />,
      },
      {
        path: '/auth/verify-callback',
        element: <EmailVerificationCallbackPage />,
      },
      {
        path: '/auth/resend',
        element: <ResendVerificationPage />,
      },
      // TODO: 인증 우회 복원 — ProtectedRoute로 감싸기
      {
        path: '/main',
        element: <MainPage />,
      },
      {
        path: '/onboarding',
        element: <Outlet />,
        children: [
          {
            index: true,
            element: <OnboardingPage />,
          },
          {
            path: 'init',
            element: <OnboardingInitPage />,
          },
          {
            path: 'calibration',
            element: <CalibrationPage />,
          },
          {
            path: 'completion',
            element: <OnboardingCompletionPage />,
          },
        ],
      },
      {
        path: '/widget',
        element: <WidgetPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
