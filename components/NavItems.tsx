"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import path from 'path'
import { cn } from '@/lib/utils'
import React from 'react'

const navItems=[
    {label:'Home',href:'/'},
    {label:'Companions',href:'/companions'},
    {label:'My Joruney',href:'/my-journey'},
    

]
const NavItems = () => {
    const pathname=usePathname()
  return (
    <div>
      <nav className="flex items-centre  gap-4 ">

        {navItems.map(({label,href})=>( 
            <Link href={href} key={label} className={cn(pathname===href && 'text-primary font-semibold ' )}>{label}</Link>
        ))}
      </nav>
    </div>
  )
}

export default NavItems
