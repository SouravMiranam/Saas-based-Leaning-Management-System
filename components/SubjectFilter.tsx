"use client"
import React from 'react'
import { Select } from './ui/select'
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { subjects } from '@/constants'
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils"
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
const SubjectFilter = () => {
    const pathname = usePathname()   //as soon any hook intializtions is with use it is client component
    const router = useRouter()
    const searchParams = useSearchParams()
    const query = searchParams.get('subject') || ''
    const [subject, setsubject] = useState(query)

    useEffect(() => {
        const delayDebouncsFn = setTimeout(() => {

            let newUrl = ""
            if (subject === "all") {
                newUrl = removeKeysFromUrlQuery({
                    params: searchParams.toString(),
                    keysToRemove: ["subject"],
                })
            } else {
                const newUrl = formUrlQuery({
                    params: searchParams.toString(),
                    key: "subject",
                    value: subject,
                })
                router.push(newUrl, { scroll: false })
            }
        }, 500);   //debounce delay so that after each letter is typed there is no call made to our db immediately reduicng load instead it will make call after a delay
    }, [subject])

    return (
         <Select onValueChange={setsubject} value={subject}>
            <SelectTrigger className="input capitalize">
                <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject} className="capitalize">
                        {subject}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export default SubjectFilter
