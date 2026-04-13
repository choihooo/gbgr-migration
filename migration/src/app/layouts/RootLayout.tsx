import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Outlet />
    </Suspense>
  )
}

export default RootLayout
