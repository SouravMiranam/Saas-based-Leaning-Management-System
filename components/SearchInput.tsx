"use client"
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import { useState } from 'react'
import {formUrlQuery, removeKeysFromUrlQuery} from "@jsmastery/utils"
const SearchInput = () => {
    const pathname=usePathname()   //as soon any hook intializtions is with use it is client component
    const router=useRouter()
    const searchParams=useSearchParams()
   const query= searchParams.get('topic') || ''
    const [searchQuery, setsearchQuery] = useState('')

    useEffect(()=>{
        const delayDebouncsFn=setTimeout(() => {
            
            if(searchQuery){
                const newUrl=formUrlQuery({
                    params:searchParams.toString(),
                    key:"topic",
                    value:searchQuery,
                })
                router.push(newUrl,{scroll:false})
            }else{
                if(pathname==='/companions'){
                     const newUrl=removeKeysFromUrlQuery({
                    params:searchParams.toString(),
                    keysToRemove:["topic"],
                    
                })
                router.push(newUrl,{scroll:false})
                }
            }
        },500);   //debounce delay so that after each letter is typed there is no call made to our db immediately reduicng load instead it will make call after a delay
    },[searchQuery,router,searchParams,pathname])

  return (
    <div className='relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit'>
      <Image src="/icons/search.svg" alt="search" width={15} height={15}/>
        <input className='outline-none' placeholder='Search Companions...' value={searchQuery} onChange={(e)=>setsearchQuery(e.target.value)} />
    </div>
  )
}

export default SearchInput
