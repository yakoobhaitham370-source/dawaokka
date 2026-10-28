import { useEffect,useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Context,Followup } from '../domain/types';
import { loadStaffTasks } from '../data/staff';
import { createLiveRepository,supabase } from '../data/repository';
import { now,uid } from '../domain/clinical';
import { Button,EmptyState,Field,LoadingSkeleton,Panel,Select,Textarea } from '../components/ui';

export default function StaffWorkspace({ctx,onPharmacy,memberships}:{ctx:Context;onPharmacy:(id:string)=>void;memberships:{pharmacy_id:string}[]}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[selected,setSelected]=useState(''),[outcome,setOutcome]=useState<Followup['status']>('contacted'),[notes,setNotes]=useState(''),[date,setDate]=useState('');
 const query=useQuery({queryKey:['staff-followups',ctx.pharmacyId,ctx.name],queryFn:()=>loadStaffTasks(ctx.pharmacyId)});
 useEffect(()=>{document.documentElement.dir='rtl';document.documentElement.lang='ar';},[]);
 useEffect(()=>{setSelected('');setNotes('');setMessage('');},[ctx.pharmacyId]);
 const task=query.data?.find(t=>t.id===selected);
 return <main className="auth-page"><Panel><h1>رعاية · المتابعات المسندة / Assigned follow-ups</h1>
 <p>وصول محدود للتواصل. السجلات السريرية والتدقيق والمستندات تتطلب الدور المخوّل. / Clinical records, audit and documents require an authorized role.</p>
 <Button onClick={()=>supabase!.auth.signOut()}>تسجيل الخروج / Sign out</Button>
 {memberships.length>1&&<Select label="الصيدلية / Pharmacy" value={ctx.pharmacyId} onChange={e=>onPharmacy(e.target.value)}>{memberships.map(m=><option key={m.pharmacy_id} value={m.pharmacy_id}>{m.pharmacy_id}</option>)}</Select>}
 {query.isPending?<LoadingSkeleton/>:query.isError?<div role="alert"><p>المتابعات غير متاحة؛ يحتاج المالك إلى مراجعة سياسة الأمان. / Assigned follow-ups unavailable; owner security review required.</p><Button onClick={()=>query.refetch()}>إعادة المحاولة / Retry</Button></div>:<>
 {!query.data?.length&&<EmptyState title="لا توجد متابعات مسندة / No assigned follow-ups"/>}
 {query.data?.map(t=><div className="record-row" key={t.id}><div className="flex-grow"><h2>{t.patientName}</h2><p>{t.dueDate} · {t.status}</p>{t.phone?<bdi>{t.phone}</bdi>:<p>لا يوجد إذن اتصال متاح / No contact permission available</p>}</div><Button onClick={()=>{setSelected(t.id);setNotes('');setMessage('');}}>توثيق النتيجة / Record outcome</Button></div>)}
 </>}
 {task&&<form className="form-stack" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);try{await createLiveRepository(ctx.pharmacyId).execute({type:'logContact',attempt:{id:uid(),followupId:task.id,outcome,notes,createdAt:now(),by:ctx.name},nextDate:outcome==='rescheduled'?date:undefined},ctx);setSelected('');setNotes('');await query.refetch();setMessage('تم الحفظ / Saved');}catch{setMessage('تعذر الحفظ؛ تحقق من الإذن والاتصال / Save refused; check permission and connection');}finally{setBusy(false);}}}>
 <Select label="النتيجة / Outcome" value={outcome} onChange={e=>setOutcome(e.target.value as Followup['status'])}>{['contacted','no_answer','refilled','declined','rescheduled'].map(s=><option key={s}>{s}</option>)}</Select>
 {outcome==='rescheduled'&&<Field label="الموعد الجديد / New date" type="date" required value={date} onChange={e=>setDate(e.target.value)}/>}
 <Textarea label="ملاحظة التواصل / Contact note" value={notes} onChange={e=>setNotes(e.target.value)}/><Button disabled={busy}>حفظ / Save</Button><Button type="button" variant="ghost" onClick={()=>setSelected('')}>إلغاء / Cancel</Button>
 </form>}{message&&<p role="status">{message}</p>}
 </Panel></main>;
}
