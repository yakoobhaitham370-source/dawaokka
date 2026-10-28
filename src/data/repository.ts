import { createClient } from '@supabase/supabase-js';
import { emptyData } from '../domain/clinical';
import type { AppData, Command, Context } from '../domain/types';
import { applyCommand } from './commands';
import { seedData } from './seed';
export const DEMO_KEY='riaya.synthetic-demo.v1';
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const tables:Record<Exclude<keyof AppData,'settings'>,string>={patients:'patients',catalog:'medications_catalog',medications:'patient_medications',allergies:'patient_allergies',alerts:'allergy_alerts',reviews:'allergy_alert_reviews',dispensings:'dispensing_records',adjustments:'dispensing_adjustments',conversations:'consultations',messages:'consultation_messages',followups:'followups',attempts:'contact_attempts',labs:'laboratory_results',documents:'patient_documents',audit:'audit_logs'};
export interface Repository {load():Promise<AppData>;execute(cmd:Command,ctx:Context):Promise<void>;reset?():Promise<void>;}
export function createDemoRepository(storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>=sessionStorage):Repository {
 const read=():AppData=>{const raw=storage.getItem(DEMO_KEY);if(!raw){const seed=seedData();storage.setItem(DEMO_KEY,JSON.stringify(seed));return seed;}try {const d=JSON.parse(raw) as AppData;if(!Array.isArray(d.patients)||!d.settings)throw new Error();return d;}catch{throw new Error('تعذر قراءة العرض المحفوظ. أعد ضبط العرض من الإعدادات / Reset corrupted demo data');}};
 return {async load(){return read();},async execute(cmd,ctx){const result=applyCommand(read(),cmd,ctx);storage.setItem(DEMO_KEY,JSON.stringify(result));},async reset(){storage.removeItem(DEMO_KEY);read();}};
}
export function createLiveRepository(pharmacyId:string,client=supabase):Repository {
 if(!client)throw new Error('Supabase غير مهيأ / Supabase not configured');
 return {async load(){const d=emptyData();await Promise.all(Object.entries(tables).map(async([k,table])=>{const rows:unknown[]=[];for(let offset=0;;offset+=200){let q=client.from(table).select('data').eq('pharmacy_id',pharmacyId);if(k==='catalog')q=client.from(table).select('data');const {data,error}=await q.order('id').range(offset,offset+199);if(error)throw new Error('تعذر تحميل السجلات. تحقق من الاتصال والصلاحيات / Unable to load records');rows.push(...data.map(r=>r.data));if(data.length<200)break;}(d[k as keyof typeof tables] as unknown[])=rows;}));d.audit.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));const {data,error}=await client.from('pharmacies').select('data').eq('id',pharmacyId).single();if(error)throw new Error('تعذر تحميل الصيدلية / Pharmacy unavailable');d.settings=data.data as AppData['settings'];return d;},async execute(cmd){const {data,error}=await client.rpc('execute_command',{p_pharmacy:pharmacyId,p_command:cmd});if(error)throw new Error(error.message);if(!data?.ok)throw new Error(data?.error??'Command rejected');}};
}
