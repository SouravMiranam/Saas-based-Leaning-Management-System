
'use server'
import { auth } from "@clerk/nextjs/server"
import { createSupabaseclient } from "../supabase"

export const createCompanion=async(formData:CreateCompanion)=>{
    const {userId:author } =await auth()   //get access id of user authenticated
    const supabase=createSupabaseclient()
    const {data,error}=await supabase.
    from('companions').
    insert({...formData,author}).
    select()
    if(error || !data){
        throw new Error(error?.message || 'Failed to create a companion')
        
    }
    return data[0];
     
}