import { lazy } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'
import RootLayout from '@/app/layouts/RootLayout'

// Lazy loaded pages
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

// Auth guards
export const requireAuthLoader = () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return redirect('/auth/login')
  return null
}

export const redirectIfAuthLoader = () => {
  const token = localStorage.getItem('accessToken')
  if (token) return redirect('/main')
  return null
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: '/',
        loader: () => redirect('/auth/login'),
      },
      {
        path: '/auth/login',
        element: <LoginPage />,
        loader: redirectIfAuthLoader,
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

      // Protected routes
      {
        path: '/main',
        element: <MainPage />,
        loader: requireAuthLoader,
      },

      // Onboarding routes (protected)
      {
        path: '/onboarding',
        loader: requireAuthLoader,
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

      // Widget route (public, independent window)
      {
        path: '/widget',
        element: <WidgetPage />,
      },

      // 404 fallback
      {
        path: '*',
        loader: () => redirect('/'),
      },
    ],
  },
])
