export const dynamic = 'force-dynamic';

import ComapnionList from '@/components/ComapnionList'
import CompanionCard from '@/components/CompanionCard'
import CTA from '@/components/CTA'
import { Button } from '@/components/ui/button'
import { recentSessions } from '@/constants'
import { getAllCompanions, getRecentSessions } from '@/lib/actions/companion.action'
import { getSubjectColor } from '@/lib/utils'
import React from 'react'

const Page = async() => {
  const companions=await getAllCompanions({limit:3})
  const recentsessionscompanions=await getRecentSessions(10)
  return (
    <main>

    <h1 className='text-2xl underline'>Popular Companions </h1>
    <section className='home-section'>
      {companions.map((companion)=>(

      <CompanionCard
      key={companion.id}
      {...companion}
      color={getSubjectColor(companion.subject)}
      />
      ))}
      
      
    </section>
    <section className='home-section'>
    <ComapnionList title="Recently completed sessions" companions={recentsessionscompanions} classNames="w-2/3 max-lg:w-full"/>
    <CTA/>

    </section>
    </main>
  )
}

export default Page