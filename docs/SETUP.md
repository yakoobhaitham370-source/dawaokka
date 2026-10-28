# Supabase and Netlify setup

## Supabase development target

Project: `qfnaubzpakbmtgxhqrhc` (`dawaoka`), supplied by the user. Organization displayed Free during read-only inspection. The user approved using the empty primary branch for synthetic development and applying the four migrations. Do not assume the word Production in the Supabase dashboard establishes clinical readiness.

1. Inspect the existing schema before running any migration. The four migration files target an empty public schema. Never run them blindly against another pharmacy system.
2. For a fresh database, apply `202610270001_foundation.sql`, `202610270002_commands.sql`, `202610270003_administration_storage.sql`, `202610270004_payload_validation.sql`, then `202610280005_strict_command_validation.sql` from `supabase/migrations`. On the supplied database, the first four are already applied. The fifth is pending separate approval and must be applied incrementally; never rerun the foundation migration there.
3. Confirm all public application tables have RLS enabled; authenticated users have SELECT only, and no anon clinical access. Test a second tenant and every role. Confirm `patient-documents` is private.
4. Set the two public frontend environment variables from `.env.example`. Use the existing publishable key; no key creation or rotation is necessary. Keep `.env.local` out of Git. No service-role key is needed by the browser.
5. Create the first legitimate platform user's Auth account through Supabase. The human user must choose and enter their own credentials. Do not add a development password to source code or send it in chat.
6. As database administrator, insert that user's real UUID into `platform_owners` and optionally `profiles` after verifying identity:

```sql
-- Replace with the verified Auth user UUID. Do not use an email in this column.
insert into public.platform_owners(user_id) values ('REPLACE_WITH_AUTH_USER_UUID');
insert into public.profiles(id,display_name)
values ('REPLACE_WITH_AUTH_USER_UUID','Platform owner');
```

7. Sign in at `/`. The platform screen creates the initial pharmacy subscription and its owner membership using an existing owner Auth user UUID. All core entitlements use the development-free plan. No purchase occurs.
8. Owners can manage staff from Settings using existing Auth user UUIDs. Obtain explicit authorization before granting a real person clinical access. This build deliberately sends no invitation email or default password.
9. Add verified medication preparations through the medication catalog, then synthetic patients. A connected project starts empty; browser-demo data is never silently copied into it.

The database uses separate resource tables and relational UUID/tenant foreign keys. Typed UI payloads are stored as JSONB record envelopes with indexed generated columns and validation constraints; this is a hybrid model, not a claim of a fully column-per-field normalized schema. Patient conditions and subscriptions have relational linking tables. The client never controls the effective server role or actor.

## Supabase security verification

Run `npm run test:database` locally first. For hosted acceptance, use two test users in two pharmacies plus an authorized pharmacist and a restricted staff account. Verify:

- Other-tenant SELECT returns no rows; other-tenant commands reject.
- Direct table INSERT/UPDATE/DELETE is denied, including audit modification.
- Membership changes require owner authority; self-demotion is blocked; plan staff limit is enforced.
- A critical ingredient match cannot be completed by routine pharmacist flow. Owner exceptional review requires a reason and creates an audit entry. Failed override attempts retain a rejection audit.
- Replaying a dispensing UUID creates one transaction and one refill update.
- Document upload/read/delete requires the pharmacy path and an appropriate clinical role. Signed links expire after 60 seconds. No public URL exists.
- Suspending a pharmacy or expiring its trial blocks clinical access server-side.

PGlite tests exercise PostgreSQL RLS and SQL functions, but mock the `auth.uid()` and Storage infrastructure. Hosted Auth token, API cache, Storage upload and signed-URL behavior must be verified separately.

### Pending strict-validation migration

Migration 005 rejects explicit JSON nulls, wrong field types, fractional frequencies/supply durations and impossible calendar dates before executing clinical commands. PostgreSQL CHECK expressions can accept SQL NULL; migration 004 alone did not close every such case. Migration 005 adds private validators and replaces the command function in place, retaining authorization, atomic writes and rejection auditing. It does not drop tables or modify existing records. Existing malformed records are not retroactively repaired; review any existing data before real use.

The local suite executes all five migrations and 68 assertions. Before applying 005 remotely, obtain approval for the named target, inspect the function diff and take an appropriate recovery snapshot. Apply only that file, then repeat synthetic command and role tests. No hosted change was made during the 28 October resume work. Keep the hosted project synthetic-only until this update and acceptance checks are complete.

## Netlify Free (requires publishing approval)

No deployment has been performed. After approval, import the `development` branch from the user's repository, keep the Free plan, set `npm run build` and publish `dist`. `netlify.toml` provides the SPA fallback and security headers. Add only the two public Supabase variables to the build environment. Use the included Netlify subdomain and synthetic data. Do not enable paid add-ons, recharge, metered AI, forms or background jobs.

Configure Supabase's allowed site and redirect URLs to the chosen approved Netlify URL. Disable public signup for this owner-provisioned product. Configure Auth email delivery and rate limits before inviting real staff. Test reloads on `/demo/patients/...`, `/app/...` and `/` after deployment.

## Recovery and release

Retain SQL migrations and backups outside the deployed web root. Test restoring to a separate development database. No public export endpoint or service-role credential is shipped. Review retention requirements, disaster recovery, audit access and real-patient privacy before commercial use. Do not claim Free is adequate for a clinical production service solely because the demo works.
