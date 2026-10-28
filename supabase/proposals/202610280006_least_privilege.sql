-- PROPOSAL ONLY. Not in migrations/; no hosted application is authorized.
-- Requires installed 001-005, owner-approved role matrix and verified recovery.
-- No clinical rows, Auth identities, object bytes or old audit entries are changed.
begin;
do $$ declare tab text; begin
 if to_regprocedure('private.validate_command(jsonb)') is null then
   raise exception '005 prerequisite absent; stop for separately approved migration sequence';
 end if;
 foreach tab in array array['patients','patient_conditions','patient_medications','patient_allergies','allergy_alerts','allergy_alert_reviews','dispensing_records','dispensing_adjustments','consultations','consultation_messages','followups','contact_attempts','refill_reminders','laboratory_results','patient_documents','notifications'] loop
   execute format('alter policy tenant_read on public.%I using (private.member_role(pharmacy_id) in (''owner'',''pharmacist''))',tab);
 end loop;
end $$;
alter policy tenant_read on public.audit_logs using (private.member_role(pharmacy_id)='owner');
alter policy conditions_read on public.chronic_conditions using (
 exists(select 1 from public.patient_conditions pc where pc.condition_id=chronic_conditions.id
 and private.member_role(pc.pharmacy_id) in ('owner','pharmacist'))
);
-- Labels already linked to a tenant remain usable without moving/deleting history.
-- Shared catalog entries are curated, non-patient data; staff do not need them.
alter policy catalog_read on public.medications_catalog using (
 (pharmacy_id is null and exists(select 1 from public.pharmacy_memberships m where m.user_id=auth.uid() and private.member_role(m.pharmacy_id) in ('owner','pharmacist')))
 or private.member_role(pharmacy_id) in ('owner','pharmacist')
);

-- Dedicated projection, never full patient/task/audit JSON. Assign tasks by the
-- staff Auth UUID, not display name/email. Ambiguous legacy assignments fail closed.
create function public.staff_followup_queue(p_pharmacy uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if private.member_role(p_pharmacy) is distinct from 'staff' then raise exception 'Assigned staff required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
   'id',f.id,'patientId',p.id,'patientName',p.data->>'name',
   'phone',case when (p.data->>'consent')='true' and p.data->>'preference' in ('call','whatsapp') then p.data->>'phone' else null end,
   'consent',(p.data->>'consent')='true','preference',p.data->>'preference',
   'dueDate',f.data->>'dueDate','status',f.data->>'status'
 ) order by f.data->>'dueDate',f.id)
 from public.followups f join public.patients p on p.pharmacy_id=f.pharmacy_id and p.id=f.patient_id
 where f.pharmacy_id=p_pharmacy and f.data->>'assignedTo'=auth.uid()::text
 and p.data->>'status'='active'), '[]'::jsonb);
end $$;
revoke all on function public.staff_followup_queue(uuid) from public,anon;
grant execute on function public.staff_followup_queue(uuid) to authenticated;

-- Retain the installed validated command, adding a staff authorization check.
-- Guard exact insertion point to fail on drift; 005 itself remains unchanged.
do $$ declare definition text; needle text := 'if action not in (''saveFollowup'',''logContact'') and role_name not in (''owner'',''pharmacist'') then raise exception ''Authorized pharmacist required'';end if;'; begin
 select pg_get_functiondef('public.execute_command(uuid,jsonb)'::regprocedure) into definition;
 if strpos(definition,'private.validate_command(p_command)')=0 or
 (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1 then
   raise exception 'Command source drift; review before applying';
 end if;
 definition:=replace(definition,needle,needle||E'\n'||
 'if role_name=''staff'' then
   if action is distinct from ''logContact'' then raise exception ''Staff may record assigned contact outcomes only'';end if;
   if not exists(select 1 from public.followups f join public.patients p on p.pharmacy_id=f.pharmacy_id and p.id=f.patient_id
     where f.pharmacy_id=p_pharmacy and f.id=(p_command->''attempt''->>''followupId'')::uuid
     and f.data->>''assignedTo''=auth.uid()::text and p.data->>''status''=''active'') then
     raise exception ''Assigned active follow-up required'';
   end if;
 end if;');
 execute definition;
end $$;
-- Keep all existing private Storage policies: staff/unassigned/other tenants
-- cannot access bytes. Removing metadata reads above also removes staff paths.
commit;
