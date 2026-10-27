-- Fresh-project migration. Review before applying to an existing Supabase project.
begin;
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
create table public.profiles(id uuid primary key references auth.users(id),display_name text not null);
create table public.platform_owners(user_id uuid primary key references auth.users(id));
create table public.pharmacies(id uuid primary key default gen_random_uuid(), data jsonb not null check(jsonb_typeof(data)='object'),created_at timestamptz not null default now());
create table public.roles(name text primary key check(name in ('owner','pharmacist','staff')));
insert into public.roles values('owner'),('pharmacist'),('staff');
create table public.pharmacy_memberships(pharmacy_id uuid references public.pharmacies(id),user_id uuid references auth.users(id),role text not null references public.roles(name),active boolean not null default true,primary key(pharmacy_id,user_id));
create index membership_user_idx on public.pharmacy_memberships(user_id,pharmacy_id) where active;
create table public.subscription_plans(id text primary key,name text not null,staff_limit integer not null check(staff_limit>0),entitlements jsonb not null default '{}');
insert into public.subscription_plans values('development-free','Development Free',5,'{"core":true,"ai":false,"automated_messaging":false}');
create table public.pharmacy_subscriptions(pharmacy_id uuid primary key references public.pharmacies(id),plan_id text not null references public.subscription_plans(id),status text not null check(status in ('trial','active','suspended','expired')),trial_ends date,renewal_date date);
create table public.subscription_history(id uuid primary key default gen_random_uuid(),pharmacy_id uuid not null references public.pharmacies(id),actor uuid not null references auth.users(id),detail jsonb not null,created_at timestamptz not null default now());
create or replace function private.member_role(p uuid) returns text language sql stable security definer set search_path='' as $$
select m.role from public.pharmacy_memberships m join public.pharmacy_subscriptions s on s.pharmacy_id=m.pharmacy_id
where m.pharmacy_id=p and m.user_id=auth.uid() and m.active and s.status in ('trial','active')
and(s.trial_ends is null or s.status<>'trial' or s.trial_ends>=current_date)
and(s.renewal_date is null or s.renewal_date>=current_date)
$$;
create or replace function private.is_platform_owner() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.platform_owners where user_id=auth.uid()) $$;
-- Record envelopes preserve typed UI payloads; relational identifiers, foreign keys,
-- generated indexed columns and constraints enforce tenant ownership independently.
create table public.patients(
 pharmacy_id uuid not null references public.pharmacies(id),id uuid not null,data jsonb not null,
 name text generated always as(data->>'name') stored not null,
 phone text generated always as(data->>'phone') stored not null,
 status text generated always as(data->>'status') stored not null,
 allergy_status text generated always as(data->>'allergyStatus') stored not null,
 primary key(pharmacy_id,id),check((data->>'id')::uuid=id),check(length(name) between 3 and 120),
 check(phone ~ '^\+9647[0-9]{9}$'),check(status in ('active','inactive','archived')),
 check(allergy_status in ('unknown','none_known','suspected','confirmed','intolerance'))
);
create index patient_phone_idx on public.patients(pharmacy_id,phone);
create index patient_name_idx on public.patients(pharmacy_id,name);
create table public.medications_catalog(id uuid primary key,data jsonb not null,
 ingredient text generated always as(data->>'ingredient') stored not null,
 check((data->>'id')::uuid=id));
create table public.chronic_conditions(id uuid primary key default gen_random_uuid(),name text not null unique);
create table public.patient_conditions(pharmacy_id uuid not null,patient_id uuid not null,condition_id uuid not null references public.chronic_conditions(id),primary key(pharmacy_id,patient_id,condition_id),foreign key(pharmacy_id,patient_id) references public.patients(pharmacy_id,id));
do $$ declare tab text; begin
foreach tab in array array['patient_medications','patient_allergies','allergy_alerts','dispensing_records','consultations','followups','laboratory_results','patient_documents','refill_reminders','notifications'] loop
 execute format('create table public.%I(pharmacy_id uuid not null references public.pharmacies(id),id uuid not null,data jsonb not null,patient_id uuid generated always as ((data->>''patientId'')::uuid) stored not null,primary key(pharmacy_id,id),foreign key(pharmacy_id,patient_id) references public.patients(pharmacy_id,id),check((data->>''id'')::uuid=id))',tab);
 execute format('create index %I on public.%I(pharmacy_id,patient_id)',tab||'_patient_idx',tab);
end loop;
end $$;
alter table public.patient_medications add column catalog_id uuid generated always as((data->>'catalogId')::uuid) stored references public.medications_catalog(id);
alter table public.patient_medications add constraint valid_medication check((data->>'dose')::numeric>0 and (data->>'frequency')::integer between 1 and 12 and (data->>'quantity')::numeric>=0 and (data->>'price')::numeric>=0);
alter table public.patient_medications add column refill_date text generated always as(data->>'refillDate') stored;
create index medication_refill_idx on public.patient_medications(pharmacy_id,refill_date);
alter table public.patient_allergies add column ingredient text generated always as(lower(trim(data->>'ingredient'))) stored;
alter table public.patient_allergies add column severity text generated always as(data->>'severity') stored check(severity in ('critical','moderate','informational'));
create index allergy_match_idx on public.patient_allergies(pharmacy_id,patient_id,ingredient);
alter table public.allergy_alerts add column allergy_id uuid generated always as((data->>'allergyId')::uuid) stored;
alter table public.allergy_alerts add foreign key(pharmacy_id,allergy_id) references public.patient_allergies(pharmacy_id,id);
alter table public.dispensing_records add column medication_id uuid generated always as((data->>'medicationId')::uuid) stored;
alter table public.dispensing_records add foreign key(pharmacy_id,medication_id) references public.patient_medications(pharmacy_id,id);
alter table public.dispensing_records add constraint valid_dispense check((data->>'quantity')::numeric>0 and (data->>'dose')::numeric>0 and (data->>'frequency')::integer between 1 and 12 and (data->>'price')::numeric>=0);
create table public.allergy_alert_reviews(pharmacy_id uuid not null,id uuid not null,data jsonb not null,alert_id uuid generated always as((data->>'alertId')::uuid) stored not null,primary key(pharmacy_id,id),foreign key(pharmacy_id,alert_id) references public.allergy_alerts(pharmacy_id,id));
create table public.consultation_messages(pharmacy_id uuid not null,id uuid not null,data jsonb not null,conversation_id uuid generated always as((data->>'conversationId')::uuid) stored not null,primary key(pharmacy_id,id),foreign key(pharmacy_id,conversation_id) references public.consultations(pharmacy_id,id));
create table public.contact_attempts(pharmacy_id uuid not null,id uuid not null,data jsonb not null,followup_id uuid generated always as((data->>'followupId')::uuid) stored not null,primary key(pharmacy_id,id),foreign key(pharmacy_id,followup_id) references public.followups(pharmacy_id,id));
create table public.dispensing_adjustments(pharmacy_id uuid not null,id uuid not null,data jsonb not null,dispensing_id uuid generated always as((data->>'dispensingId')::uuid) stored not null,primary key(pharmacy_id,id),foreign key(pharmacy_id,dispensing_id) references public.dispensing_records(pharmacy_id,id));
create table public.audit_logs(pharmacy_id uuid not null references public.pharmacies(id),id uuid not null default gen_random_uuid(),data jsonb not null,created_at timestamptz not null default now(),primary key(pharmacy_id,id));
create index audit_recent_idx on public.audit_logs(pharmacy_id,created_at desc);
create table public.clinical_rule_references(id text primary key,scope text not null,source_url text,limitations text not null);
insert into public.clinical_rule_references values('ingredient-identity-v1','Exact normalized active-ingredient identity only',null,'No clinical inference of cross-reactivity, interactions, formulation excipients, contraindications or treatment safety. Manual ingredient mapping must be reviewed.');
-- Enable RLS on every table, including platform and shared catalog tables.
do $$ declare tab record;begin for tab in select tablename from pg_tables where schemaname='public' loop
 execute format('alter table public.%I enable row level security',tab.tablename);
end loop;end $$;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid());
create policy platform_self on public.platform_owners for select to authenticated using(user_id=auth.uid());
create policy memberships_read on public.pharmacy_memberships for select to authenticated using(user_id=auth.uid() or private.member_role(pharmacy_id)='owner');
create policy pharmacy_read on public.pharmacies for select to authenticated using(private.member_role(id) is not null);
create policy subscription_read on public.pharmacy_subscriptions for select to authenticated using(private.member_role(pharmacy_id)='owner');
create policy plans_read on public.subscription_plans for select to authenticated using(true);
create policy subscription_history_read on public.subscription_history for select to authenticated using(private.member_role(pharmacy_id)='owner');
create policy catalog_read on public.medications_catalog for select to authenticated using(exists(select 1 from public.pharmacy_memberships where user_id=auth.uid() and active));
create policy conditions_read on public.chronic_conditions for select to authenticated using(true);
create policy rules_read on public.clinical_rule_references for select to authenticated using(true);
do $$ declare tab text;begin foreach tab in array array['patients','patient_conditions','patient_medications','patient_allergies','allergy_alerts','allergy_alert_reviews','dispensing_records','dispensing_adjustments','consultations','consultation_messages','followups','contact_attempts','refill_reminders','laboratory_results','patient_documents','notifications','audit_logs'] loop
execute format('create policy tenant_read on public.%I for select to authenticated using(private.member_role(pharmacy_id) is not null)',tab);
end loop;end $$;
-- Clients get SELECT only. All writes are validated, tenant-bound RPCs.
revoke all on all tables in schema public from anon,authenticated;
grant select on all tables in schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.member_role(uuid),private.is_platform_owner() to authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
commit;
