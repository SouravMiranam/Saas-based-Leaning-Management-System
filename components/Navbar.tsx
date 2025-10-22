"use client"
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from './NavItems'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { User, BookOpen } from 'lucide-react'

const Navbar = () => {
  return (
    <nav className='bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo Section */}
          <Link href="/" className='flex items-center gap-3 hover:opacity-80 transition-opacity'>
            <div className='flex items-center gap-2.5'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md'>
                <BookOpen className='w-6 h-6 text-white' />
              </div>
              <div className='flex flex-col'>
                <span className='font-bold text-xl text-gray-900'>Mentora</span>
                <span className='text-xs text-gray-500 -mt-1'>Learn Smarter</span>
              </div>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-8">
            <NavItems />
          </div>

          {/* Authentication Section */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton>
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2">
                  <User className='w-4 h-4' />
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className='flex items-center gap-3'>
                <div className='hidden sm:block text-sm text-gray-600'>
                  Welcome back!
                </div>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-100 bg-gray-50 px-4 py-3">
        <NavItems />
      </div>
    </nav>
  )
}

export default Navbar
