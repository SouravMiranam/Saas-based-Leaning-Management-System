import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from './NavItems'

const Navbar = () => {
  return (
    <div>
      <nav className='navbar'>

      <Link href="/">
      <div className='flex items-centre gap-2.5 cursor-pointer'>
        <Image src="/images/logo.svg" alt='logo'  width={46} height={44}/>
      </div>
      </Link>
      <div className="flex items-centre gap-8">
        <NavItems/>
        <p>Sign in</p>

      </div>
      </nav>
    </div>
  )
}

export default Navbar
