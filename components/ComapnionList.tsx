import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getSubjectColor } from "@/lib/utils"
import { Companion } from "@/types"
import React from 'react'
import Link from "next/link"
import Image from "next/image"
interface CompanionListProps{
  title:string
  companions?:Companion[]
  classNames?:string
  useHorizontalScroll?: boolean
}

const ComapnionList = ({title,companions,classNames,useHorizontalScroll = false}:CompanionListProps) => {
  // If horizontal scroll is enabled and there are companions, use card layout with vertical scroll
  if (useHorizontalScroll && companions && companions.length > 0) {
    return (
      <article className={cn('companion-list h-full flex flex-col',classNames)}>
        <h2 className="font-bold text-3xl mb-4">{title}</h2>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {companions.map(({id,subject,name,topic,duration},index) => (
              <Link href={`/companions/${id}`} key={`${id}-${index}`}>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="size-[48px] flex items-center justify-center rounded-lg flex-shrink-0" 
                      style={{backgroundColor: getSubjectColor(subject)}}
                    >
                      <Image src={`/icons/${subject}.svg`} alt={subject} width={28} height={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{name}</h3>
                      <p className="text-sm text-gray-600 truncate">{topic}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="subject-badge w-fit">{subject}</div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Image src="/icons/clock.svg" alt="duration" width={14} height={14} />
                      <span className="text-sm font-medium">{duration} mins</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </article>
    )
  }

  // Default table layout for other cases
  return (
    <article className={cn('companion-list',classNames)}>
      <h2 className="font-bold text-3xl">{title}</h2>
      <Table>
  
  <TableHeader>
    <TableRow>
      <TableHead className="text-lg w-2/3">Lessons</TableHead>
      <TableHead className="text-lg">Subject</TableHead>
      <TableHead className="text-lg text-right">Duration</TableHead>
      
    </TableRow>
  </TableHeader>
  <TableBody>
    {companions?.map(({id,subject,name,topic,duration},index)=>(
       <TableRow key={`${id}-${index}`}>
        <TableCell>
          <Link href={`/companions/${id}`}>
          <div className="flex items-center gap-2 ">
          <div className="size-[42px] flex items-center justify-center  rounded-lg max-md:hidden " style={{backgroundColor :getSubjectColor(subject)}}>
            <Image src={`/icons/${subject}.svg`} alt={subject} width={30} height={30}  />
          </div>
          <div className="flex flex-col gap-2 ">
          <p className="font-bold text-2xl">{name}</p>
          <p className="text-lg ">{topic}</p>
          </div>
          </div>
          </Link>
        </TableCell>
        <TableCell>
          <div className="subject-badge w-fit max-md:hidden">{subject}</div>
          <div className="flex items-center justify-center rounded-lg w-fit p-2 md:hidden " style={{backgroundColor:getSubjectColor(subject)}}>

            <Image src={`/icons/${subject}.svg`} alt={subject} width={18} height={18}/>

          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 w-full">
            <p className="text-2xl">{duration}{' '} 
              <span className="max-md:hidden">mins</span>

            </p>
            <Image src="/icons/clock.svg" alt="minutes" width={14} height={14} className="md:hidden"/>
    
          </div>
        </TableCell>
      </TableRow>
    ))}
    
  </TableBody>
</Table>
    </article>
  )
}

export default ComapnionList
