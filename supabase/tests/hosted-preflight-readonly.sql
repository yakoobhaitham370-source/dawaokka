-- Read-only development preflight. No users, rows, policies or functions change.
select jsonb_build_object(
  'database', current_database(),
  'public_tables', (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
  'tables_without_rls', (select coalesce(jsonb_agg(c.relname),'[]') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
  'strict_validator_present', to_regprocedure('private.validate_command(jsonb)') is not null,
  'command_calls_strict_validator', (select strpos(p.prosrc,'private.validate_command(p_command)')>0 from pg_proc p where p.oid=to_regprocedure('public.execute_command(uuid,jsonb)')),
  'command_security_definer', (select p.prosecdef from pg_proc p where p.oid=to_regprocedure('public.execute_command(uuid,jsonb)')),
  'command_search_path', (select p.proconfig from pg_proc p where p.oid=to_regprocedure('public.execute_command(uuid,jsonb)')),
  'anon_patient_read', has_table_privilege('anon','public.patients','SELECT'),
  'authenticated_direct_patient_write', has_table_privilege('authenticated','public.patients','UPDATE'),
  'authenticated_command_execute', has_function_privilege('authenticated','public.execute_command(uuid,jsonb)','EXECUTE'),
  'anon_command_execute', has_function_privilege('anon','public.execute_command(uuid,jsonb)','EXECUTE'),
  'document_bucket', (select jsonb_build_object('public',public,'bytes_limit',file_size_limit,'mime_types',allowed_mime_types) from storage.buckets where id='patient-documents'),
  'pharmacies', (select count(*) from public.pharmacies),
  'memberships', (select count(*) from public.pharmacy_memberships),
  'auth_accounts', (select count(*) from auth.users)
) as readiness_preflight;

-- Record definitions/hashes in an approved private recovery location before 005.
select n.nspname as schema_name,p.proname,md5(p.prosrc) as source_md5,
       p.prosecdef as security_definer,p.proconfig as function_settings
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname in ('execute_command','manage_membership','admin_pharmacy','list_admin_pharmacies'))
   or (n.nspname='private' and p.proname in ('member_role','is_platform_owner','validate_command'))
order by n.nspname,p.proname;

select jsonb_build_object(
  'migration_004_constraints', (select coalesce(jsonb_agg(conname order by conname),'[]') from pg_constraint where connamespace='public'::regnamespace and conname in ('medication_required_fields','dispensing_required_fields','allergy_required_fields','document_required_fields')),
  'new_helper_name_conflicts', (select coalesce(jsonb_agg(proname),'[]') from pg_proc where pronamespace='private'::regnamespace and proname in ('require_payload_fields','require_calendar_date','require_whole_number','validate_command')),
  'allergies_needing_review', (select count(*) from public.patient_allergies where jsonb_typeof(data->'severity') is distinct from 'string' or data->>'severity' not in ('critical','moderate','informational') or jsonb_typeof(data->'verification') is distinct from 'string'),
  'medications_needing_review', (select count(*) from public.patient_medications where jsonb_typeof(data->'dose') is distinct from 'number' or jsonb_typeof(data->'frequency') is distinct from 'number' or jsonb_typeof(data->'schedule') is distinct from 'string'),
  'dispensings_needing_review', (select count(*) from public.dispensing_records where jsonb_typeof(data->'dose') is distinct from 'number' or jsonb_typeof(data->'frequency') is distinct from 'number' or jsonb_typeof(data->'schedule') is distinct from 'string')
) as before_005_summary;
-- These bounded checks detect core null/type gaps, not every historical field
-- or date condition in the complete 005 validator. Review that full contract too.
