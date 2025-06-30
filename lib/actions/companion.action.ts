
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

export const getAllCompanions=async({limit=10,page=1,subject,topic}:GetAllCompanions)=>{
    const supabase=createSupabaseclient()
    let query=supabase.from('companions').select()
    if(subject && topic){
       query = query
            .ilike('subject', `%${subject}%`)  //columns is subject pattrn is after it
            .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)  //filters is topic.ilike...
    }else if(subject){
         query = query.ilike('subject', `%${subject}%`)
    }else if (topic) {
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`)
    }

    query=query.range((page-1)*limit,page*limit-1)
    const {data:companions,error}=await query
    if(error)  throw new Error(error.message)
        return companions
}

export const getCompanion = async (id: string) => {
    const supabase = createSupabaseclient();

    const { data, error } = await supabase
        .from('companions')
        .select()
        .eq('id', id);

     if (error || !data || data.length === 0) return null;
    return data[0];
}
export const addToSessionHistory=async(companionId:string)=>{
    const {userId}=await auth()
    const supabase=createSupabaseclient()
    const{data,error}=await supabase.from('session_history').insert({
        companion_id:companionId,
        user_id:userId,
    })

    if(error) throw new Error(error.message)

    return data;
}

export const getRecentSessions=async(limit=10)=>{
    const supabase=createSupabaseclient()
    const {data,error}=await supabase.from('session_history')
                        .select(`companions:companion_id(*)`)
                        .order('created_at',{ascending:false})
                        .limit(limit)
    
    if(error) throw new Error(error.message)
    
    return data.map(({companions})=> companions )
}
export const getUserSessions=async(userId:string,limit=10)=>{
    const supabase=createSupabaseclient()
    const {data,error}=await supabase.from('session_history')
                        .select(`companions:companion_id(*)`)
                        .eq('user_id',userId)
                        .order('created_at',{ascending:false})
                        .limit(limit)
    
    if(error) throw new Error(error.message)
    
    return data.map(({companions})=> companions )
}
export const getUserCompanions=async(userId:string)=>{
    const supabase=createSupabaseclient()
    const {data,error}=await supabase.from('companions')
                        .select()
                        .eq('author',userId)
                        
    
    if(error) throw new Error(error.message)
    
    return data
}

export const newcompanionpermissions=async()=>{
    const {userId,has}=await auth()
    const supabase=createSupabaseclient()
    let limit=0
    if(has({plan:'pro'})){
        return true
    }else if(has({feature:"3_companion_limit"})){   //3_companion_limit is slug
    limit=3
    }else if(has({feature:"10_companion_limit"})){   
    limit=10
    }
    
    const {data,error}=await supabase.from('companions').select('id',{count:'exact'}).eq('author',userId)

    if(error) throw new Error(error.message)

    const CompanionCount=data.length
    if(CompanionCount>=limit){
        return false
    }else{
        return true
    }

}