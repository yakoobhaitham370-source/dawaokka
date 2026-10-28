-- READ ONLY: configuration/catalog metadata only. Never return clinical rows,
-- names, contacts, user IDs, Auth contents, object names or file bytes.
-- Run with the existing administrator in the dashboard, not an application RPC.
select jsonb_build_object(
 'postgres_version',current_setting('server_version'),
 'tables_without_rls',(select coalesce(jsonb_agg(c.relname order by c.relname),'[]') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
 'policies',(select coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'policy',policyname,'roles',roles,'command',cmd,'using',qual,'check',with_check) order by schemaname,tablename,policyname),'[]') from pg_policies where schemaname='public' or (schemaname='storage' and tablename='objects')),
 'client_roles',(select jsonb_agg(jsonb_build_object('role',rolname,'superuser',rolsuper,'bypass_rls',rolbypassrls)) from pg_roles where rolname in ('anon','authenticated')),
 'patient_grants',jsonb_build_object('anon_select',has_table_privilege('anon','public.patients','SELECT'),'authenticated_update',has_table_privilege('authenticated','public.patients','UPDATE')),
 'command_grants',jsonb_build_object('anon_execute',has_function_privilege('anon','public.execute_command(uuid,jsonb)','EXECUTE'),'authenticated_execute',has_function_privilege('authenticated','public.execute_command(uuid,jsonb)','EXECUTE')),
 'functions',(select jsonb_agg(jsonb_build_object('name',n.nspname||'.'||p.proname,'security_definer',p.prosecdef,'config',p.proconfig,'source_md5',md5(replace(p.prosrc,chr(13),''))) order by n.nspname,p.proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='private' and p.proname in ('member_role','is_platform_owner')) or (n.nspname='public' and p.proname in ('execute_command','manage_membership','admin_pharmacy','list_admin_pharmacies'))),
 'document_bucket',(select jsonb_build_object('public',public,'size_limit',file_size_limit,'allowed_mimes',allowed_mime_types) from storage.buckets where id='patient-documents'),
 'migration_005_present',to_regprocedure('private.validate_command(jsonb)') is not null,
 'command_calls_005',(select strpos(prosrc,'private.validate_command(p_command)')>0 from pg_proc where oid=to_regprocedure('public.execute_command(uuid,jsonb)')),
 'migration_ledger_present',to_regclass('supabase_migrations.schema_migrations') is not null
) as security_metadata;
