-- Run only in the approved synthetic development project. Every test row rolls back.
begin;
insert into auth.users(id) values
('f0000000-0000-4000-8000-000000000001'),
('f0000000-0000-4000-8000-000000000002'),
('f0000000-0000-4000-8000-000000000003');
insert into public.pharmacies(id,data) values
('f1000000-0000-4000-8000-000000000001','{"name":"Synthetic Test A","thresholds":[7,3,1],"retentionDays":3650}'),
('f1000000-0000-4000-8000-000000000002','{"name":"Synthetic Test B","thresholds":[7,3,1],"retentionDays":3650}');
insert into public.pharmacy_subscriptions(pharmacy_id,plan_id,status) values
('f1000000-0000-4000-8000-000000000001','development-free','active'),
('f1000000-0000-4000-8000-000000000002','development-free','active');
insert into public.pharmacy_memberships(pharmacy_id,user_id,role) values
('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','owner'),
('f1000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000002','owner'),
('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000003','staff');
set local role authenticated;
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000001',true);
do $$ declare result jsonb;begin
result:=public.execute_command('f1000000-0000-4000-8000-000000000001',
'{"type":"savePatient","patient":{"id":"f2000000-0000-4000-8000-000000000001","name":"Synthetic Patient A","phone":"+9647703331111","dob":"1970-01-01","conditions":[],"status":"active","allergyStatus":"none_known","consent":false}}');
if result->>'ok'<>'true' then raise exception 'Patient save failed: %',result;end if;
if (select count(*) from public.patients)<>1 then raise exception 'Patient persistence failed';end if;
if (select allergy_status from public.patients limit 1)<>'unknown' then raise exception 'Unknown allergy state not preserved';end if;
result:=public.execute_command('f1000000-0000-4000-8000-000000000002','{"type":"saveSettings","settings":{"name":"Cross-tenant attempt","thresholds":[7],"retentionDays":3650}}');
if result->>'ok'<>'false' then raise exception 'Cross-tenant RPC allowed';end if;
begin update public.patients set data=data||'{"name":"Unauthorized direct edit"}';raise exception 'Direct write permitted';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000002',true);
do $$ begin if exists(select 1 from public.patients) then raise exception 'Cross-tenant RLS leaked a row';end if;end $$;
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000003',true);
do $$ declare result jsonb;begin
result:=public.execute_command('f1000000-0000-4000-8000-000000000001','{"type":"savePatient","patient":{"id":"f2000000-0000-4000-8000-000000000002","name":"Staff attempt","phone":"+9647703332222","dob":"","conditions":[],"status":"active","allergyStatus":"unknown"}}');
if result->>'ok'<>'false' then raise exception 'Staff clinical write allowed';end if;
begin delete from public.audit_logs;raise exception 'Audit deletion permitted';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: patient RPC, unknown history, cross-tenant RPC and RLS, direct-write denial, staff clinical denial, immutable audit access' as hosted_security_checks;
select count(*) as public_table_count,bool_and(relrowsecurity) as all_public_tables_have_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r';
select id,public,file_size_limit from storage.buckets where id='patient-documents';
rollback;
