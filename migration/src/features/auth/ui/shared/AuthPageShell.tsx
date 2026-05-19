import type { ReactNode } from 'react'

interface AuthPageShellProps {
  children: ReactNode
  className?: string
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function AuthPageShell({ children, className }: AuthPageShellProps) {
  return (
    <main className="hbp:min-h-[calc(100vh-75px)] flex min-h-[calc(100vh-60px)] flex-col items-center justify-center bg-grey-0 text-grey-1000">
      <div className="hbp:mx-auto hbp:max-w-screen-lg hbp:px-10 relative w-full overflow-visible">
        <section
          className={joinClasses(
            'flex w-full flex-col items-center justify-center px-7',
            className,
          )}
        >
          {children}
        </section>
      </div>
    </main>
  )
}
