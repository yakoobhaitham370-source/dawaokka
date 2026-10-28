import { supabase } from './repository';
export interface StaffTask { id:string; patientId:string; patientName:string; phone:string|null; consent:boolean; preference:string; dueDate:string; status:string; }
// Server projection is the authorization boundary. Never load full AppData here.
export async function loadStaffTasks(pharmacyId:string,client=supabase):Promise<StaffTask[]> {
 if(!client)throw new Error('Supabase not configured');
 const {data,error}=await client.rpc('staff_followup_queue',{p_pharmacy:pharmacyId});
 if(error||!Array.isArray(data))throw new Error('Assigned follow-ups unavailable. Owner must verify the approved security policy.');
 return data as StaffTask[];
}
