import HeroSection from './components/HeroSection'
import LoginForm from './components/Loginforrm'

const LoginPage = () => {
  return (
    <main className="hbp:min-h-[calc(100vh-75px)] flex min-h-[calc(100vh-60px)] flex-col items-center justify-center">
      <div className="hbp:mx-auto hbp:max-w-screen-lg hbp:px-10 relative w-full overflow-visible">
        <section className="= flex w-full flex-col items-center justify-center px-7">
          <HeroSection />
          <LoginForm />
        </section>
      </div>
    </main>
  )
}

export default LoginPage
