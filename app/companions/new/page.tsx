import React from 'react'
import CompanionForm from '@/components/CompanionForm'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { newcompanionpermissions } from '@/lib/actions/companion.action'
import Image from 'next/image'
import Link from 'next/link'
const NewCompanion = async() => {
  const {userId}=await auth()
  if(!userId) {   //if not signed in redirect
    redirect('/sign-in')
  }
  const cancreatecompanion=await newcompanionpermissions()

  
  return (
    <main className='min-lg:w-1/3 min-md:w-2/3 items-centre justify-center '>
    {cancreatecompanion?(<article className='w-full gap-4 flex flex-col'>
      <h1>Comapnion Builder</h1>
      <CompanionForm/>
    </article>):(
      <article className='companion-limit'>
        <Image src='/images/limit.svg' alt="Companion Limit Reached" width={360} height={230}/>
        <div className='cta-badge'>
          Upgrade Your Plan
        </div>
        <h1>Your've Reached your Limit</h1>
        <h1>Your've Reached your companion Limit.Upgrade to create more companions and premium features</h1>
        <Link href="/subscription" className='btn-primary w-full justify-center'>Upgrade My Plan</Link>
      </article>
    )}
   </main>
  )
}

export default NewCompanion
