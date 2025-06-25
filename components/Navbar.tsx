"use client"
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from './NavItems'
import { SignInButton,SignedIn,SignedOut,UserButton } from '@clerk/nextjs'
import { User } from 'lucide-react'

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
        <SignedOut>
          
            <SignInButton>
              <button className="btn-signin">
                Sign In
              </button>
            </SignInButton>
         
        </SignedOut>
        <SignedIn>
          <UserButton/>
        </SignedIn>

      </div>
      </nav>
    </div>
  )
}

export default Navbar
