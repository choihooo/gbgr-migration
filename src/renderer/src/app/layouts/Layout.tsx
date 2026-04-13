import { Outlet } from 'react-router-dom'
import Header from './header/Header'
// import { DevNavbar } from '../dev';

const Layout = () => {
  return (
    <div className="hbp:pt-[75px] min-h-screen pt-15">
      {/* <DevNavbar /> */}
      <Header />
      <Outlet />
    </div>
  )
}

export default Layout
