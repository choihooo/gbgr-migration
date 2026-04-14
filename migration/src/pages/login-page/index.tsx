import { HeroSection } from '@/features/auth/ui/login/components/HeroSection'
import { LoginForm } from '@/features/auth/ui/login/components/LoginForm'
import { AuthPageShell } from '@/features/auth/ui/shared/AuthPageShell'

function LoginPage() {
  return (
    <AuthPageShell>
      <HeroSection />
      <LoginForm />
    </AuthPageShell>
  )
}

export default LoginPage
