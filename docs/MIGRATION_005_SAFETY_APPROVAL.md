# Migration 005 safety approval report

28 October 2026. **Decision: HOLD.** No migration, account, clinical record, Auth setting or Storage object was changed. Application and migration files are preserved on `development`. Checks used local file inspection and hosted SELECT statements; patient field contents/passwords/file bytes were not exported.

## Verified findings

| Check | Result |
|---|---|
| Exact target | Existing `dawaoka`, ref `qfnaubzpakbmtgxhqrhc`, URL `https://qfnaubzpakbmtgxhqrhc.supabase.co`. |
| Environment | Its only branch is `main`, explicitly labelled **PRODUCTION BRANCH** by Supabase. You designated this project for development, but there is no isolated development branch. Owner confirmation of non-production use remains necessary. No new/paid branch was created. |
| Patient provenance | One patient exists. Its ID and synthetic markers match our known software-test fixture; no other patient rows were found. This is strong provenance evidence, not proof that nobody has since entered real information into a field. |
| Pharmacy provenance | Two pharmacies exist. The explicitly synthetic pharmacy contains that one fixture; the other has zero patients and no synthetic label. Its business purpose cannot be certified from its name. Do not assert that all pharmacy records are synthetic until the owner confirms it. |
| Other resources | One patient medication, allergy, dispensing and document; one private object with 68 bytes of recorded metadata; one Auth account. No file contents or Auth credential material were downloaded. The existing operator's Auth data remains sensitive even if clinical data is fictional. |
| 001–004 | Installed footprint is present: existing schema/RLS/bucket, command source matching 002 after CRLF normalization, and all four 004 constraints. They were applied manually; `supabase_migrations.schema_migrations` is absent. **Do not rerun 001–004, run an unrestricted db push, or repair the migration ledger without separate review/approval.** |
| 005 | Validator and call hook remain absent. Local file is unchanged, SHA-256 below. |
| Auth | Public signup ON; email and email confirmation ON; anonymous sign-in/manual linking OFF. Site URL still `http://localhost:3000`; redirect allow-list empty. Save buttons remained untouched. |
| Staff access | Current allergy policy permits any non-null active member role, including staff under the installed membership helper. The common policy also exposes detailed patient/medication/lab/audit data to members. Private file bytes separately require owner/pharmacist. |
| Global labels | `chronic_conditions` SELECT policy is `true` for authenticated users. With public signup enabled, a confirmed but unassigned account can read these labels. Free-text identifiable detail must not enter the shared taxonomy. Signup alone does not grant pharmacy patient-row access. |

005 SHA-256:

```text
2ee671dda1aeef164cf8f1180057d06ca3e3dadc397e8cfa4eda2e978401e3b9
```

Migration 005 validates commands; it does not restrict staff reads, close signup or change Auth URLs. Those risks remain separate decisions before real-patient use.

## Full private recovery copy: possible, not prepared

Only the previous command-definition snapshot exists in ignored `.local/migration005-backup/`. It is not an encrypted full backup. Export tools (`supabase`, `pg_dump`, `psql`, `pg_restore`) were not found on the current PATH. No tools were installed, credentials collected, dumps generated or restore targets created.

A safe application recovery set needs:

1. Database schema **and data**: public/private functions, constraints, indexes, RLS, grants/default privileges, memberships, subscriptions, clinical histories and audit. Preserve the manual deployment manifest; do not invent hosted migration history.
2. Auth user/identity data with stable UUIDs and password hashes where permitted. Verify actual export coverage; a default schema-only dump is insufficient. Decide session invalidation/re-authentication policy rather than promising portable active sessions.
3. Bucket metadata, custom `storage` policies **and every file's bytes**, plus an object/count/size/hash manifest. SQL backups alone do not contain file bytes.
4. Protected project/Auth configuration and the recovery/reconfiguration plan for signing/API/provider/SMTP secrets. Check encryption-root/Vault dependencies if used. Some managed-service state needs manual reconfiguration; do not promise a bit-identical project clone.
5. An approved encrypted, access-controlled destination outside Git, separately protected recovery keys, a consistent export window, and a verified isolated restore with no outbound mail/webhooks. A Git ignore rule provides neither encryption nor access control.

Use existing authorized access entered privately by the operator. Do not reset passwords, create backup roles, call linking commands that may provision login roles, expose service-role keys in the browser, enable paid backup/branching, or restore over this project under the current instructions. Any required free-tool installation and restore target need separate approval. The earlier six-check local function rollback rehearsal does not prove full Database/Auth/Storage recovery.

Official scope references: [CLI dump defaults](https://supabase.com/docs/reference/cli/supabase-inspect-db-role-configs#supabase-db-dump), [database backups and file exclusion](https://supabase.com/docs/guides/platform/backups), [backup/restore and custom managed-schema policies](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [project recovery/configuration boundaries](https://supabase.com/docs/guides/platform/clone-project).

## Exact approvals needed, in order

1. **Target/data attestation:** confirm this exact production-labelled primary project has no operational production use and that every patient field, pharmacy record and stored document is intentionally synthetic. If uncertain, stop and agree on an isolated development target; do not modify this one.
2. **Backup preparation only:** approve the sensitive export scope, encrypted destination/key custody, existing private access method, any required free tooling and an isolated recovery rehearsal. Verify the resulting recovery set before treating this gate as closed. No hosted writes or new accounts are included in this approval.
3. **Migration only, later:** after the first two gates close, approve this exact 005/checksum during a quiet write interval, with read-only postchecks. Explicitly decide whether the narrowly tested rollback is pre-authorized; otherwise stop and request approval if postchecks fail. Exclude 001–004, ledger repair, account creation, record edits, Auth/RLS changes and deployment from that approval.

Public-signup/URL changes, staff/global-label restrictions, and the later **two independent synthetic pharmacies/five separate test accounts** are separate approvals. None has been performed or inferred. The safest immediate next approval is recovery preparation, together with the owner's target/data confirmation—not permission to apply 005 yet.
