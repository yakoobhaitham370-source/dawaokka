import { z } from 'zod';
import type { Allergy, AppData, Context, Medication, Patient, Role } from './types';
export const uid=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export function localToday(date=new Date()):string { const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date); return `${p.find(x=>x.type==='year')!.value}-${p.find(x=>x.type==='month')!.value}-${p.find(x=>x.type==='day')!.value}`; }
export function addDays(date:string,n:number):string { const [y,m,d]=date.split('-').map(Number); const dt=new Date(Date.UTC(y,m-1,d+n));return dt.toISOString().slice(0,10); }
export function daysBetween(a:string,b:string):number { return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000); }
export function age(dob:string):number|null { if(!dob)return null; const t=localToday(); return Number(t.slice(0,4))-Number(dob.slice(0,4))-(t.slice(5)<dob.slice(5)?1:0); }
export function normalizePhone(phone:string):string { let p=phone.replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace(/[\s()\-]/g,''); if(p.startsWith('00964'))p='+'+p.slice(2);if(/^07\d{9}$/.test(p))p='+964'+p.slice(1);return p; }
export const patientSchema=z.object({name:z.string().trim().min(3,'أدخل الاسم الكامل / Enter full name'),phone:z.string().transform(normalizePhone).refine(x=>/^\+9647\d{9}$/.test(x),'أدخل رقماً عراقياً صالحاً / Valid Iraqi mobile required'),dob:z.string().refine(x=>!x||x<=localToday(),'تاريخ الميلاد في المستقبل / DOB is in the future')});
export const regularSupply=(quantity:number,dose:number,frequency:number,schedule:Medication['schedule']):number|null=>schedule==='regular'&&quantity>0&&dose>0&&frequency>=1&&frequency<=12?Math.floor(quantity/(dose*frequency))||null:null;
export function refillStatus(date:string|null,today=localToday(),threshold=7):'sufficient'|'approaching'|'today'|'overdue'|'unknown' {if(!date)return 'unknown';const n=daysBetween(today,date);return n<0?'overdue':n===0?'today':n<=threshold?'approaching':'sufficient';}
export const normalizeIngredient=(x:string)=>x.trim().toLowerCase();
// Exact normalized ingredient only. No fuzzy names or unverified class cross-reactivity.
export function detectAllergies(allergies:Allergy[],ingredient:string):Allergy[] {const key=normalizeIngredient(ingredient);return key?allergies.filter(x=>normalizeIngredient(x.ingredient)===key):[];}
export const canClinical=(role:Role)=>role==='owner'||role==='pharmacist';
export function assertClinical(ctx:Context) {if(!canClinical(ctx.role))throw new Error('هذه العملية تتطلب صيدلياً مخولاً / Authorized pharmacist required');}
export function duplicatePatients(data:AppData,p:Patient):Patient[] {return data.patients.filter(x=>x.id!==p.id&&(normalizePhone(x.phone)===normalizePhone(p.phone)||x.name.trim().replace(/\s+/g,' ')===p.name.trim().replace(/\s+/g,' ')));}
export function nextRefill(data:AppData,patientId:string) {return data.medications.filter(x=>x.patientId===patientId&&x.status==='active'&&x.refillDate).map(x=>x.refillDate!).sort()[0]??null;}
export function emptyData():AppData {return {patients:[],catalog:[],medications:[],allergies:[],alerts:[],reviews:[],dispensings:[],adjustments:[],conversations:[],messages:[],followups:[],attempts:[],labs:[],documents:[],audit:[],settings:{name:'صيدلية النخيل',thresholds:[7,3,1],retentionDays:3650}};}
