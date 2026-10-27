begin;
create function public.execute_command(p_pharmacy uuid,p_command jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
<<vars>>
declare role_name text; actor text; action text:=p_command->>'type'; row_data jsonb; old_data jsonb; med jsonb; patient jsonb;
 tab text; row_id uuid; patient_id uuid; related uuid; critical boolean; matches jsonb; stamp text:=to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'); refill text; audit_id uuid:=gen_random_uuid(); msg text;
begin
role_name:=private.member_role(p_pharmacy);
if role_name is null then return jsonb_build_object('ok',false,'error','Not authorized for this active pharmacy');end if;
-- Serialize tenant writes; validates duplicate acknowledgement and dispensing atomically.
perform pg_advisory_xact_lock(hashtextextended(p_pharmacy::text,0));
select coalesce(display_name,auth.uid()::text) into actor from public.profiles where id=auth.uid();actor:=coalesce(actor,auth.uid()::text);
begin
if action not in ('saveFollowup','logContact') and role_name not in ('owner','pharmacist') then raise exception 'Authorized pharmacist required';end if;
case action
when 'savePatient' then tab:='patients';row_data:=p_command->'patient';patient_id:=(row_data->>'id')::uuid;
 if row_data->>'dob'>to_char(now() at time zone 'Asia/Baghdad','YYYY-MM-DD') then raise exception 'Invalid date of birth';end if;
 row_data:=jsonb_set(row_data,'{phone}',to_jsonb(regexp_replace(translate(row_data->>'phone','٠١٢٣٤٥٦٧٨٩','0123456789'),'[\s()-]','','g')));
 if row_data->>'phone' ~ '^07[0-9]{9}$' then row_data:=jsonb_set(row_data,'{phone}',to_jsonb('+964'||substr(row_data->>'phone',2)));end if;
 if row_data->>'phone' like '00964%' then row_data:=jsonb_set(row_data,'{phone}',to_jsonb('+'||substr(row_data->>'phone',3)));end if;
 select data into old_data from public.patients where pharmacy_id=p_pharmacy and id=patient_id;
 if old_data is not null and row_data->>'allergyStatus'<>old_data->>'allergyStatus' then raise exception 'Use allergy review workflow';end if;
 row_data:=row_data||jsonb_build_object('allergyStatus',coalesce(old_data->>'allergyStatus','unknown'),'updatedAt',stamp);
 if exists(select 1 from public.patients where pharmacy_id=p_pharmacy and id<>patient_id and(phone=row_data->>'phone' or name=trim(row_data->>'name'))) and not coalesce((p_command->>'duplicateAcknowledged')::boolean,false) then raise exception 'Review possible duplicate patient';end if;
when 'saveMedication' then tab:='patient_medications';row_data:=p_command->'medication';
 if row_data->>'schedule' not in ('regular','prn','variable','taper','custom') then raise exception 'Invalid schedule';end if;
 if (row_data->>'daysSupply') is not null and ((row_data->>'daysSupply')::integer<1 or row_data->>'schedule'<>'regular' and length(trim(row_data->>'notes'))<5) then raise exception 'Invalid days supply or undocumented supply basis';end if;
 refill:=case when row_data->>'daysSupply' is not null then ((row_data->>'startDate')::date+(row_data->>'daysSupply')::integer)::text else null end;
 row_data:=row_data||jsonb_build_object('refillDate',refill);
when 'saveAllergy' then tab:='patient_allergies';row_data:=p_command->'allergy';patient_id:=(row_data->>'patientId')::uuid;
 if length(trim(row_data->>'substance'))<2 or length(trim(row_data->>'reaction'))<2 or coalesce(trim(row_data->>'source'),'')='' then raise exception 'Allergen, reaction and information source required';end if;
 if row_data->>'status' not in ('suspected','confirmed','intolerance') or row_data->>'verification' not in ('verified','unverified') or row_data->>'status'='confirmed' and row_data->>'verification'<>'verified' then raise exception 'Verify source before confirmation';end if;
 row_data:=row_data||jsonb_build_object('recordedAt',stamp,'recordedBy',actor);
 update public.patients set data=data||jsonb_build_object('allergyStatus',row_data->>'status','updatedAt',stamp) where pharmacy_id=p_pharmacy and id=patient_id;
 related:=gen_random_uuid();insert into public.allergy_alerts(pharmacy_id,id,data) values(p_pharmacy,related,jsonb_build_object('id',related,'patientId',patient_id,'allergyId',row_data->>'id','medicationId',null,'category','Allergy review','severity',row_data->>'severity','status','new','assignedTo',actor,'createdAt',stamp));
 -- FK is deferred below so the alert can accompany a new allergy in this transaction.
when 'setAllergyStatus' then tab:='patients';patient_id:=(p_command->>'patientId')::uuid;
 if p_command->>'status' not in ('unknown','none_known') or length(trim(p_command->>'reason'))<5 then raise exception 'Review source required';end if;
 if p_command->>'status'='none_known' and exists(select 1 from public.patient_allergies where pharmacy_id=p_pharmacy and patient_id=vars.patient_id) then raise exception 'Existing allergy records require clinical correction';end if;
 select data||jsonb_build_object('allergyStatus',p_command->>'status','updatedAt',stamp) into row_data from public.patients where pharmacy_id=p_pharmacy and id=patient_id;
when 'reviewAlert' then tab:='allergy_alert_reviews';row_data:=p_command->'review';related:=(row_data->>'alertId')::uuid;
 if row_data->>'action' not in ('new','pending','reviewed','resolved') or length(trim(row_data->>'notes'))<3 or coalesce(trim(row_data->>'assignedTo'),'')='' then raise exception 'Review decision, notes and assignee required';end if;
 select data,(data->>'patientId')::uuid into old_data,patient_id from public.allergy_alerts where pharmacy_id=p_pharmacy and id=related;
 if old_data is null then raise exception 'Alert not found';end if;
 update public.allergy_alerts set data=data||jsonb_build_object('status',row_data->>'action','assignedTo',row_data->>'assignedTo') where pharmacy_id=p_pharmacy and id=related;
 row_data:=row_data||jsonb_build_object('by',actor,'createdAt',stamp);
when 'dispense' then tab:='dispensing_records';row_data:=p_command->'dispensing';row_id:=(row_data->>'id')::uuid;
 if exists(select 1 from public.dispensing_records where pharmacy_id=p_pharmacy and id=row_id) then return jsonb_build_object('ok',true,'duplicate',true);end if;
 patient_id:=(row_data->>'patientId')::uuid;
 select data into med from public.patient_medications where pharmacy_id=p_pharmacy and id=(row_data->>'medicationId')::uuid and patient_medications.patient_id=vars.patient_id for update;
 select data into patient from public.patients where pharmacy_id=p_pharmacy and id=patient_id;
 if med is null or med->>'status'<>'active' or patient->>'status'<>'active' then raise exception 'Active patient and prescribed medication required';end if;
 if row_data->>'dose'<>med->>'dose' or row_data->>'frequency'<>med->>'frequency' or row_data->>'schedule'<>med->>'schedule' then raise exception 'Update prescription before changing regimen';end if;
 if (row_data->>'date')::date>(now() at time zone 'Asia/Baghdad')::date or row_data->>'date' is null then raise exception 'Invalid dispensing date';end if;
 select coalesce(jsonb_agg(a.id),'[]'::jsonb),coalesce(bool_or(a.severity='critical'),false) into matches,critical from public.patient_allergies a join public.medications_catalog c on c.id=(med->>'catalogId')::uuid where a.pharmacy_id=p_pharmacy and a.patient_id=vars.patient_id and a.ingredient=c.ingredient and a.ingredient<>'';
 if (jsonb_array_length(matches)>0 or patient->>'allergyStatus'='unknown') and not coalesce((row_data->>'acknowledged')::boolean,false) then raise exception 'Safety acknowledgement required';end if;
 if critical and(role_name<>'owner' or coalesce(length(trim(row_data->>'overrideReason')),0)<15) then raise exception 'Critical allergy blocks routine dispensing; authorized owner and documented reason required';end if;
 if row_data->>'daysSupply' is not null and ((row_data->>'daysSupply')::integer<1 or med->>'schedule'<>'regular' and coalesce(length(trim(row_data->>'overrideReason')),0)<15) then raise exception 'Document verified supply basis';end if;
 refill:=case when row_data->>'daysSupply' is not null then ((row_data->>'date')::date+(row_data->>'daysSupply')::integer)::text else null end;
 row_data:=row_data||jsonb_build_object('refillDate',refill,'alerts',matches,'staff',actor,'createdAt',stamp);
 update public.patient_medications set data=data||jsonb_build_object('refillDate',refill,'daysSupply',row_data->'daysSupply','quantity',row_data->'quantity','startDate',row_data->>'date') where pharmacy_id=p_pharmacy and id=(med->>'id')::uuid;
when 'adjustDispensing' then tab:='dispensing_adjustments';row_data:=p_command->'adjustment';
 if length(trim(row_data->>'reason'))<5 or(row_data->>'quantity')::numeric<0 then raise exception 'Correction reason required';end if;
 select patient_medications.patient_id into patient_id from public.dispensing_records join public.patient_medications on dispensing_records.medication_id=patient_medications.id and dispensing_records.pharmacy_id=patient_medications.pharmacy_id where dispensing_records.pharmacy_id=p_pharmacy and dispensing_records.id=(row_data->>'dispensingId')::uuid;
 row_data:=row_data||jsonb_build_object('by',actor,'createdAt',stamp);
when 'saveConversation' then tab:='consultations';row_data:=p_command->'conversation';
 if row_data->>'status' not in ('open','closed') or coalesce(trim(row_data->>'category'),'')='' then raise exception 'Consultation subject and valid status required';end if;
when 'sendMessage' then tab:='consultation_messages';row_data:=p_command->'message';
 select data,(data->>'patientId')::uuid into old_data,patient_id from public.consultations where pharmacy_id=p_pharmacy and id=(row_data->>'conversationId')::uuid;
 if old_data is null or old_data->>'status'<>'open' or coalesce(length(trim(row_data->>'body')),0) not between 1 and 4000 then raise exception 'Open consultation and valid message required';end if;
 row_data:=row_data||jsonb_build_object('sender','pharmacist','createdAt',stamp);
when 'saveFollowup' then tab:='followups';row_data:=p_command->'followup';
 if coalesce(row_data->>'dueDate','')='' or coalesce(trim(row_data->>'assignedTo'),'')='' or row_data->>'status' not in ('scheduled','no_answer','contacted','refilled','rescheduled','declined') then raise exception 'Valid follow-up required';end if;
when 'logContact' then tab:='contact_attempts';row_data:=p_command->'attempt';
 select data,(data->>'patientId')::uuid into old_data,patient_id from public.followups where pharmacy_id=p_pharmacy and id=(row_data->>'followupId')::uuid;
 select data into patient from public.patients where pharmacy_id=p_pharmacy and id=patient_id;
 if old_data is null or row_data->>'outcome' not in ('contacted','no_answer','refilled','rescheduled','declined') then raise exception 'Valid contact outcome required';end if;
 if not coalesce((patient->>'consent')::boolean,false) and row_data->>'outcome' in ('contacted','no_answer','refilled','declined') then raise exception 'Contact consent required';end if;
 if row_data->>'outcome'='rescheduled' and coalesce(p_command->>'nextDate','')='' then raise exception 'New date required';end if;
 update public.followups set data=data||jsonb_build_object('status',row_data->>'outcome','dueDate',coalesce(p_command->>'nextDate',data->>'dueDate')) where pharmacy_id=p_pharmacy and id=(row_data->>'followupId')::uuid;
 row_data:=row_data||jsonb_build_object('by',actor,'createdAt',stamp);
when 'saveLab' then tab:='laboratory_results';row_data:=p_command->'lab';
 if coalesce(trim(row_data->>'test'),'')='' or coalesce(trim(row_data->>'value'),'')='' or coalesce(row_data->>'date','')='' then raise exception 'Test, result and date required';end if;
when 'saveDocument' then tab:='patient_documents';row_data:=p_command->'document';
 if (row_data->>'size')::integer not between 0 and 5242880 or row_data->>'mime' not in ('application/pdf','image/jpeg','image/png') or split_part(row_data->>'path','/',1)<>p_pharmacy::text or split_part(row_data->>'path','/',2)<>row_data->>'patientId' then raise exception 'Invalid private document';end if;
when 'deleteDocument' then
 select data,patient_documents.patient_id into row_data,patient_id from public.patient_documents where pharmacy_id=p_pharmacy and id=(p_command->>'documentId')::uuid;
 if row_data is null then raise exception 'Document not found';end if;
 delete from public.patient_documents where pharmacy_id=p_pharmacy and id=(p_command->>'documentId')::uuid;
 tab:=null;
when 'saveSettings' then
 if role_name<>'owner' then raise exception 'Owner required';end if;
 row_data:=p_command->'settings';if coalesce(trim(row_data->>'name'),'')='' or jsonb_array_length(row_data->'thresholds')<1 or exists(select 1 from jsonb_array_elements_text(row_data->'thresholds') x where x::integer not between 1 and 90) then raise exception 'Invalid settings';end if;
 update public.pharmacies set data=row_data where id=p_pharmacy;tab:=null;
else raise exception 'Unsupported command';end case;
if tab is not null then
 if row_data is null then raise exception 'Record not found';end if;
 row_id:=(row_data->>'id')::uuid;patient_id:=coalesce(patient_id,(row_data->>'patientId')::uuid);
 -- Never move a pre-existing record between patients, even within one tenant.
 execute format('select data from public.%I where pharmacy_id=$1 and id=$2',tab) into old_data using p_pharmacy,row_id;
 if old_data is not null and old_data->>'patientId' is distinct from row_data->>'patientId' then raise exception 'Record ownership is immutable';end if;
 if tab in ('dispensing_records','allergy_alert_reviews','dispensing_adjustments','consultation_messages','contact_attempts') then
 execute format('insert into public.%I(pharmacy_id,id,data) values($1,$2,$3)',tab) using p_pharmacy,row_id,row_data;
 else execute format('insert into public.%I(pharmacy_id,id,data) values($1,$2,$3) on conflict(pharmacy_id,id) do update set data=excluded.data',tab) using p_pharmacy,row_id,row_data;end if;
end if;
if action='savePatient' then
 delete from public.patient_conditions where pharmacy_id=p_pharmacy and patient_conditions.patient_id=vars.patient_id;
 insert into public.chronic_conditions(name) select distinct trim(value) from jsonb_array_elements_text(row_data->'conditions') where trim(value)<>'' on conflict(name) do nothing;
 insert into public.patient_conditions select p_pharmacy,patient_id,c.id from public.chronic_conditions c where c.name in(select value from jsonb_array_elements_text(row_data->'conditions'));
end if;
insert into public.audit_logs(pharmacy_id,id,data) values(p_pharmacy,audit_id,jsonb_build_object('id',audit_id,'patientId',patient_id,'action',action,'detail',p_command::text,'by',actor,'createdAt',stamp));
return jsonb_build_object('ok',true);
exception when others then
get stacked diagnostics msg=message_text;
-- Subtransaction rolls back attempted clinical writes, then retains a rejection audit.
insert into public.audit_logs(pharmacy_id,id,data) values(p_pharmacy,audit_id,jsonb_build_object('id',audit_id,'patientId',null,'action','rejected:'||coalesce(action,'unknown'),'detail',msg,'by',actor,'createdAt',stamp));
return jsonb_build_object('ok',false,'error',msg);
end;
end $$;
-- Defer the alert→allergy FK until transaction completion for atomic creation.
alter table public.allergy_alerts drop constraint allergy_alerts_pharmacy_id_allergy_id_fkey;
alter table public.allergy_alerts add foreign key(pharmacy_id,allergy_id) references public.patient_allergies(pharmacy_id,id) deferrable initially deferred;
revoke all on function public.execute_command(uuid,jsonb) from public,anon;
grant execute on function public.execute_command(uuid,jsonb) to authenticated;
commit;
