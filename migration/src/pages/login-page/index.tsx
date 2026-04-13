import { LoginForm } from '@/features/auth/ui/login/components/LoginForm'
import { HeroSection } from '@/features/auth/ui/login/components/HeroSection'
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
