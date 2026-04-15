import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '@/app/layouts/RootLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/shared/config/auth-routes'

// TODO: 보정 게이트 복원 (007 구현 완료 후)
// import { CalibrationRouteGuard } from '@/shared/lib/calibration-route-guard'

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
        path: '/auth/login',
        element: <PublicOnlyRoute />,
        children: [{ index: true, element: <LoginPage /> }],
      },
      {
        path: '/auth/signup',
        element: <PublicOnlyRoute />,
        children: [{ index: true, element: <SignupPage /> }],
      },
      {
        path: '/auth/verify',
        element: <PublicOnlyRoute />,
        children: [{ index: true, element: <EmailVerificationPage /> }],
      },
      {
        path: '/auth/verify-callback',
        element: <EmailVerificationCallbackPage />,
      },
      {
        path: '/auth/resend',
        element: <PublicOnlyRoute />,
        children: [{ index: true, element: <ResendVerificationPage /> }],
      },
      {
        path: '/main',
        element: <ProtectedRoute />,
        children: [{ index: true, element: <MainPage /> }],
      },
      {
        path: '/onboarding',
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <OnboardingPage /> },
          { path: 'init', element: <OnboardingInitPage /> },
          { path: 'calibration', element: <CalibrationPage /> },
          { path: 'completion', element: <OnboardingCompletionPage /> },
        ],
      },
      {
        path: '/widget',
        element: <ProtectedRoute />,
        children: [{ index: true, element: <WidgetPage /> }],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
