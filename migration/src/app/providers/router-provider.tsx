import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/shared/config/router'
import { initDeepLinkListener } from '@/shared/lib/deep-link'

function AppProvider() {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    void initDeepLinkListener(router).then(unlisten => {
      cleanup = unlisten
    })

    return () => {
      cleanup?.()
    }
  }, [])

  return <RouterProvider router={router} />
}

export default AppProvider
