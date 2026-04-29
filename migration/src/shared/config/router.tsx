import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '@/app/layouts/RootLayout'
import CalibrationPage from '@/pages/calibration-page'
import EmailVerificationCallbackPage from '@/pages/email-verification-callback-page'
import EmailVerificationPage from '@/pages/email-verification-page'
import LoginPage from '@/pages/login-page'
import MainPage from '@/pages/main-page'
import OnboardingCompletionPage from '@/pages/onboarding-completion-page'
import OnboardingInitPage from '@/pages/onboarding-init-page'
import OnboardingPage from '@/pages/onboarding-page'
import ResendVerificationPage from '@/pages/resend-verification-page'
import SignupPage from '@/pages/signup-page'
import WidgetPage from '@/pages/widget-page'
import { ProtectedRoute, PublicOnlyRoute } from '@/shared/config/auth-routes'
import { CalibrationRouteGuard } from '@/shared/lib/calibration-route-guard'

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
          {
            element: <CalibrationRouteGuard />,
            children: [
              { index: true, element: <OnboardingPage /> },
              { path: 'init', element: <OnboardingInitPage /> },
              { path: 'calibration', element: <CalibrationPage /> },
              { path: 'completion', element: <OnboardingCompletionPage /> },
            ],
          },
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
