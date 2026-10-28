// Disposable embedded PostgreSQL only. No hosted URL or credentials are read.
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite();
let checks = 0;
const check = (ok, label) => { assert.ok(ok, label); checks++; };
try {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;`);
  const files = (await readdir('supabase/migrations')).sort();
  for (const file of files.slice(0, 4)) await db.exec((await readFile('supabase/migrations/' + file, 'utf8')).replace('create extension if not exists pgcrypto;', ''));
  const snapshot = (await db.query("select pg_get_functiondef('public.execute_command(uuid,jsonb)'::regprocedure) as ddl,prosrc from pg_proc where oid='public.execute_command(uuid,jsonb)'::regprocedure")).rows[0];
  const migration = await readFile('supabase/migrations/202610280005_strict_command_validation.sql', 'utf8');
  await db.exec(migration);
  check((await db.query("select to_regprocedure('private.validate_command(jsonb)') is not null as present")).rows[0].present, '005 creates strict validator');
  check((await db.query("select strpos(prosrc,'private.validate_command(p_command)')>0 as hooked from pg_proc where oid='public.execute_command(uuid,jsonb)'::regprocedure")).rows[0].hooked, 'Command uses validator');
  const grants = (await db.query("select has_function_privilege('anon','public.execute_command(uuid,jsonb)','EXECUTE') as anon,has_function_privilege('authenticated','public.execute_command(uuid,jsonb)','EXECUTE') as member")).rows[0];
  check(!grants.anon && grants.member, '005 preserves command execute boundary');
  // Exercise definition rollback and remove only the four new private helpers.
  await db.exec(snapshot.ddl);
  await db.exec(`drop function private.validate_command(jsonb);
    drop function private.require_whole_number(jsonb,text,numeric,numeric);
    drop function private.require_calendar_date(text);
    drop function private.require_payload_fields(jsonb,text,text[]);`);
  check((await db.query("select prosrc from pg_proc where oid='public.execute_command(uuid,jsonb)'::regprocedure")).rows[0].prosrc === snapshot.prosrc, 'Exact previous command definition restored');
  check((await db.query("select to_regprocedure('private.validate_command(jsonb)') is null as absent")).rows[0].absent, 'New helpers removed without CASCADE');
  await db.exec(migration);
  check((await db.query("select to_regprocedure('private.validate_command(jsonb)') is not null as present")).rows[0].present, '005 reapplies after complete rollback');
  console.log(JSON.stringify({ environment: 'local PGlite only', checks, applyRollbackReapply: 'passed', hostedChanges: false }));
} finally { await db.close(); }
