begin;
create function public.manage_membership(p_pharmacy uuid,p_user uuid,p_role text,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
declare limit_staff integer;
begin
if private.member_role(p_pharmacy)<>'owner' or private.member_role(p_pharmacy) is null then raise exception 'Owner required';end if;
perform pg_advisory_xact_lock(hashtextextended(p_pharmacy::text,0));
if p_role not in ('owner','pharmacist','staff') then raise exception 'Invalid role';end if;
if p_user=auth.uid() and(not p_active or p_role<>'owner') then raise exception 'Cannot demote or deactivate your own owner membership';end if;
select s.staff_limit into limit_staff from public.subscription_plans s join public.pharmacy_subscriptions ps on ps.plan_id=s.id where ps.pharmacy_id=p_pharmacy;
if p_active and not exists(select 1 from public.pharmacy_memberships where pharmacy_id=p_pharmacy and user_id=p_user and active) and(select count(*) from public.pharmacy_memberships where pharmacy_id=p_pharmacy and active)>=limit_staff then raise exception 'Staff limit reached. No automatic plan upgrade.';end if;
insert into public.pharmacy_memberships values(p_pharmacy,p_user,p_role,p_active) on conflict(pharmacy_id,user_id) do update set role=excluded.role,active=excluded.active;
insert into public.audit_logs(pharmacy_id,data) values(p_pharmacy,jsonb_build_object('id',gen_random_uuid(),'patientId',null,'action','manage_membership','detail',jsonb_build_object('user',p_user,'role',p_role,'active',p_active)::text,'by',auth.uid(),'createdAt',now()));
end $$;
create function public.admin_pharmacy(p_id uuid,p_name text,p_owner uuid,p_plan text,p_status text,p_trial_ends date,p_renewal date) returns uuid language plpgsql security definer set search_path='' as $$
declare tenant uuid:=coalesce(p_id,gen_random_uuid());
begin
if not private.is_platform_owner() then raise exception 'Platform owner required';end if;
if length(trim(p_name))<3 then raise exception 'Pharmacy name required';end if;
insert into public.pharmacies(id,data) values(tenant,jsonb_build_object('name',p_name,'thresholds',jsonb_build_array(7,3,1),'retentionDays',3650)) on conflict(id) do update set data=pharmacies.data||jsonb_build_object('name',p_name);
insert into public.pharmacy_subscriptions values(tenant,p_plan,p_status,p_trial_ends,p_renewal) on conflict(pharmacy_id) do update set plan_id=excluded.plan_id,status=excluded.status,trial_ends=excluded.trial_ends,renewal_date=excluded.renewal_date;
insert into public.pharmacy_memberships values(tenant,p_owner,'owner',true) on conflict(pharmacy_id,user_id) do update set role='owner',active=true;
insert into public.subscription_history(pharmacy_id,actor,detail) values(tenant,auth.uid(),jsonb_build_object('plan',p_plan,'status',p_status,'trial_ends',p_trial_ends,'renewal',p_renewal));
return tenant;
end $$;
create function public.list_admin_pharmacies() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin if not private.is_platform_owner() then raise exception 'Platform owner required';end if;
return(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.data->>'name','plan',s.plan_id,'status',s.status,'trialEnds',s.trial_ends,'renewal',s.renewal_date)),'[]') from public.pharmacies p join public.pharmacy_subscriptions s on s.pharmacy_id=p.id);
end $$;
revoke all on function public.manage_membership(uuid,uuid,text,boolean),public.admin_pharmacy(uuid,text,uuid,text,text,date,date),public.list_admin_pharmacies() from public,anon;
grant execute on function public.manage_membership(uuid,uuid,text,boolean),public.admin_pharmacy(uuid,text,uuid,text,text,date,date),public.list_admin_pharmacies() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('patient-documents','patient-documents',false,5242880,array['application/pdf','image/jpeg','image/png']);
create policy private_document_read on storage.objects for select to authenticated using(bucket_id='patient-documents' and private.member_role((storage.foldername(objects.name))[1]::uuid) in ('owner','pharmacist') and exists(select 1 from public.patient_documents d where d.pharmacy_id=(storage.foldername(objects.name))[1]::uuid and d.data->>'path'=objects.name));
create policy private_document_upload on storage.objects for insert to authenticated with check(bucket_id='patient-documents' and private.member_role((storage.foldername(objects.name))[1]::uuid) in ('owner','pharmacist') and exists(select 1 from public.patients p where p.pharmacy_id=(storage.foldername(objects.name))[1]::uuid and p.id=(storage.foldername(objects.name))[2]::uuid));
create policy private_document_delete on storage.objects for delete to authenticated using(bucket_id='patient-documents' and private.member_role((storage.foldername(objects.name))[1]::uuid) in ('owner','pharmacist'));
-- No update policy: uploads use random immutable object keys, never overwrite files.
commit;
