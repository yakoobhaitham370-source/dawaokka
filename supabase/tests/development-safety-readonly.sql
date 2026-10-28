-- SELECT only. No patient names, contact details, passwords or object paths returned.
-- Provenance markers are indicators, never proof that content is fictional.
select jsonb_build_object(
 'pharmacies', (select coalesce(jsonb_agg(jsonb_build_object(
   'id',p.id,'name',p.data->>'name',
   'explicit_synthetic_label',coalesce(p.data->>'name','') ~* '(synthetic|اصطناع)',
   'patients',(select count(*) from public.patients q where q.pharmacy_id=p.id),
   'marked_synthetic_patients',(select count(*) from public.patients q where q.pharmacy_id=p.id and (coalesce(q.data->>'name','')||' '||coalesce(q.data->>'notes','')) ~* '(synthetic|اصطناع)'),
   'known_software_test_patient',(select count(*) from public.patients q where q.pharmacy_id=p.id and q.id='d7c6ea6a-e3ef-4ffd-a2af-8fd2373f0d12')
 )),'[]') from public.pharmacies p),
 'resource_counts', jsonb_build_object(
   'patients',(select count(*) from public.patients),
   'patient_medications',(select count(*) from public.patient_medications),
   'patient_allergies',(select count(*) from public.patient_allergies),
   'dispensings',(select count(*) from public.dispensing_records),
   'documents',(select count(*) from public.patient_documents),
   'auth_accounts',(select count(*) from auth.users)),
 'storage', (select coalesce(jsonb_agg(jsonb_build_object('bucket',b.id,'public',b.public,
   'object_count',(select count(*) from storage.objects o where o.bucket_id=b.id),
   'metadata_bytes',(select coalesce(sum(case when o.metadata->>'size' ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end),0) from storage.objects o where o.bucket_id=b.id)
 )),'[]') from storage.buckets b),
 'migration_history_table',to_regclass('supabase_migrations.schema_migrations') is not null,
 'strict_validator_present',to_regprocedure('private.validate_command(jsonb)') is not null,
 'command_calls_strict_validator',(select strpos(prosrc,'private.validate_command(p_command)')>0 from pg_proc where oid=to_regprocedure('public.execute_command(uuid,jsonb)')),
 'command_source_md5',(select md5(replace(prosrc,chr(13),'')) from pg_proc where oid=to_regprocedure('public.execute_command(uuid,jsonb)')),
 'migration_004_constraints',(select coalesce(jsonb_agg(conname order by conname),'[]') from pg_constraint where connamespace='public'::regnamespace and conname in ('medication_required_fields','dispensing_required_fields','allergy_required_fields','document_required_fields')),
 'public_tables_without_rls',(select coalesce(jsonb_agg(c.relname),'[]') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
 'staff_clinical_read_policy',(select qual from pg_policies where schemaname='public' and tablename='patient_allergies' and policyname='tenant_read'),
 'shared_condition_read_policy',(select qual from pg_policies where schemaname='public' and tablename='chronic_conditions' and policyname='conditions_read')
) as development_safety;
