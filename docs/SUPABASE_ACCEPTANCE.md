# Controlled hosted acceptance — prepared, not executed

Target: `qfnaubzpakbmtgxhqrhc` / `https://qfnaubzpakbmtgxhqrhc.supabase.co`, the existing user-designated development project. The dashboard's primary branch label does not authorize changes. No hosted test accounts, tenants or clinical rows were created/changed during this readiness phase; only SELECT queries and settings inspection were used.

## Migration review

| File | Purpose | Current evidence |
|---|---|---|
| 001 foundation | 28 application tables, tenant/resource foreign keys, indexes, RLS and client grants | Hosted preflight found 28 tables, none without RLS; anon patient SELECT and authenticated direct UPDATE are denied. Shared labels and broad staff reads need governance (R1/R2). |
| 002 commands | Auth-bound role lookup, transactional workflows, idempotency, audit and critical-match rules | Captured hosted command source matches this file after LF/CRLF normalization. Prior local/hosted smoke evidence exists; it is not five-account Auth testing. |
| 003 administration/storage | Platform/owner functions, staff limits and private document policies | Current command/admin functions exist; bucket is private, 5MB, PDF/JPEG/PNG only. Current project has one Auth account and two memberships, so new identity fixtures are required. |
| 004 payload constraints | Required clinical keys and initial field checks | All four named constraints are present. SQL NULL semantics still leave demonstrated holes. |
| 005 strict command validation | Four private helpers and one command-definition replacement; no table/data rewrite | Not applied. No helper-name conflicts found. Local apply/rollback/reapply rehearsal passed six assertions. New-command null/type/date regression coverage passed in the previous 68-assertion suite. |

Migration 005 SHA-256: `2ee671dda1aeef164cf8f1180057d06ca3e3dadc397e8cfa4eda2e978401e3b9`.

The existing hosted command's raw MD5 is `8cec268d26cdcc21a83b07dee409f01b`. Its 124 CRLF line endings account for the different raw local hash; after normalization its MD5 is `221b4c7d61d0c4536e3dc39271a525b6`, exactly matching 002. Migration 005 changes that command body only by adding the strict-validation call, alongside its new helper definitions and grants. Hashes identify drift, not clinical correctness.

Bounded hosted scans found zero null/type issues in the checked allergy/medication/dispensing fields. They do not validate every historical date/field or prove records are synthetic. The operator must confirm that this project remains synthetic-only.

## Exactly what remains before 005

- [ ] User explicitly approves **only migration 005** for this named project and confirms it is still a synthetic development database.
- [ ] Choose a short interval without concurrent workflow writes and recheck target, source checksum, helper conflicts and the existing function definition. Stop if the baseline changed.
- [ ] Review recovery artifacts. A change-specific copy of the actual old command definition is saved in ignored `.local/migration005-backup/`. It is not a complete database/Auth/Storage backup. Obtain a private logical export appropriate to the current contents before hosted changes; do not put a dump or database password in Git/chat.
- [ ] Review the six-check local rollback rehearsal and the intended recovery procedure. An incomplete hosted backup/restore rehearsal remains a real-patient pilot gate, even though 005 itself is a transactional function-only change.
- [ ] After approval, apply **only** `202610280005_strict_command_validation.sql` once. Never rerun 001–004. It uses BEGIN/COMMIT, so an execution error rolls back that migration. If already present or drifted, stop instead of dropping/replacing helpers blindly.
- [ ] Rerun read-only preflight: the validator must exist, the command must call it, execute grants must be unchanged, and all RLS/private-bucket checks must remain intact. Record the result privately without patient rows.
- [ ] Execute the approved synthetic hosted tests below and retain sanitized pass/fail evidence. Do not label them passed until they actually run.

Current work does not authorize applying 005, changing Auth settings or provisioning fixtures. The migration cannot substitute for clinical validation or repair old malformed records automatically.

The dashboard may display only the last result of a multi-statement query. Run the SELECT blocks in `supabase/tests/hosted-preflight-readonly.sql` separately when necessary so the RLS/grant result is inspected as well as the final bounded-data summary.

## Backup and rollback boundaries

The private change-specific snapshot contains the current command definition. CREATE OR REPLACE with the same signature preserves its existing privileges; the six-check local test exercised restoring the definition, removing only the four new helpers without CASCADE, and reapplying 005. Any hosted rollback still needs explicit approval, baseline verification and an incident record. It restores the older validation gap, so keep the project synthetic-only while investigating. Do not reset tables or remove audit/clinical histories as a workaround.

Supabase recommends manual database exports for Free projects. A database export does not include Storage file bytes. Store exports outside the repository and test an appropriate restore separately. No backup download entitlement, point-in-time recovery or paid upgrade is assumed. [Supabase backups](https://supabase.com/docs/guides/platform/backups).

## Real Auth fixture matrix — provisioning needs approval

Use five **distinct** human-created test users with passwords chosen privately by the human. Use controlled test addresses; do not send invitations automatically. Provision two new dedicated pharmacies named exactly with the prefix below; do not repurpose either existing pharmacy.

| Actor | Tenant membership | Role / purpose |
|---|---|---|
| A_OWNER | Only `SYNTHETIC ACCEPTANCE A` | owner; CRUD/dispensing/file tests |
| A_PHARMACIST | Only A | pharmacist; routine clinical workflow and critical-override denial |
| A_STAFF | Only A | staff; clinical-write/file-byte denial and observed read-scope review |
| B_OWNER | Only `SYNTHETIC ACCEPTANCE B` | owner; independent cross-tenant adversary |
| PLATFORM_ONLY | None | platform owner only; verify no implicit clinical access |

The current platform owner belongs to both existing pharmacies, so that account cannot stand in for A_OWNER, B_OWNER or PLATFORM_ONLY. A platform owner can create the two test pharmacies through the app, after fixture approval. Each owner can then add the existing test UUIDs to its team. Registering the fifth account as platform owner is an explicit security-sensitive grant and must be approved and identity-checked. Do not share service-role credentials with users or tests.

## Prepared runnable suite

`tests/hosted/acceptance.mjs` uses real Supabase Auth, REST/RPC and Storage. It never uses `service_role`, never modifies schema and does not run on import. It requires approval, the exact target URL, confirmation of 005, a publishable key, two different tenant UUIDs, exact memberships, five distinct users, and test-pharmacy name guards **before clinical writes**.

Safe preparation commands (no hosted calls):

```powershell
node tests/hosted/acceptance.mjs --plan
node tests/hosted/guards.test.mjs
node tests/hosted/migration-005-local.mjs
```

Seven guard tests and six local migration rehearsal assertions passed. The hosted acceptance runner itself has not run. Node's ordinary `--test` file isolation can hit the known Codex pipe restriction; the direct guard-file command above runs the tests in-process.

After the separate approvals and setup, use your own terminal. Supply the URL, public key and fixture UUIDs; type account credentials only into your terminal prompts. These examples contain no usable credentials:

```powershell
$env:CRM_TEST_URL = 'https://qfnaubzpakbmtgxhqrhc.supabase.co'
$env:CRM_TEST_PUBLISHABLE_KEY = Read-Host 'Project publishable key'
$env:CRM_TEST_TENANT_A = Read-Host 'Dedicated synthetic tenant A UUID'
$env:CRM_TEST_TENANT_B = Read-Host 'Dedicated synthetic tenant B UUID'
# Set these gates only after the named actions were approved/completed.
$env:CRM_MIGRATION_005_CONFIRMED = 'yes'
$env:CRM_HOSTED_APPROVAL = 'synthetic-development-acceptance-approved'
$testActors = @('A_OWNER','A_PHARMACIST','A_STAFF','B_OWNER','PLATFORM_ONLY')
try {
  foreach ($testActor in $testActors) {
    [Environment]::SetEnvironmentVariable("CRM_TEST_${testActor}_EMAIL", (Read-Host "$testActor test email"), 'Process')
    $testSecret = Read-Host "$testActor test password" -AsSecureString
    [Environment]::SetEnvironmentVariable("CRM_TEST_${testActor}_PASSWORD", ([Net.NetworkCredential]::new('', $testSecret).Password), 'Process')
    $testSecret.Dispose()
  }
  node tests/hosted/acceptance.mjs --run
} finally {
  foreach ($testActor in $testActors) {
    [Environment]::SetEnvironmentVariable("CRM_TEST_${testActor}_EMAIL", $null, 'Process')
    [Environment]::SetEnvironmentVariable("CRM_TEST_${testActor}_PASSWORD", $null, 'Process')
  }
  Remove-Item Env:CRM_HOSTED_APPROVAL,Env:CRM_MIGRATION_005_CONFIRMED,Env:CRM_TEST_PUBLISHABLE_KEY,Env:CRM_TEST_TENANT_A,Env:CRM_TEST_TENANT_B,Env:CRM_TEST_URL -ErrorAction SilentlyContinue
}
```

The process holds passwords/tokens only in memory and process environment. Do not save the entered values in source, logs, screenshots, chat or a shared terminal history. The script logs actor labels/assertions, not credentials or patient payloads. Run `--run` only intentionally against the approved fixtures.

## Acceptance cases and remaining manual coverage

| ID | Expected result | Prepared execution |
|---|---|---|
| AUTH-1 | Five server-verified identities and exact, independent roles | SDK runner |
| AUTH-2 | Anonymous clinical reads denied; platform-only user sees no patient rows | SDK runner |
| AUTH-3 | Wrong password denied once; expired/revoked session, logout, recovery, offboarding and account lockout/rate limits behave as intended | Manual test accounts; do not brute-force or disable protection |
| CRUD-1 | Patient create/read/edit/archive/restore persists per tenant | SDK runner; archive is clinical soft deletion |
| RLS-1 | A cannot read/mutate B's patient, and vice versa | SDK runner using real JWTs |
| RLS-2 | Direct table update/audit delete denied; staff clinical RPC denied | SDK runner |
| ROLE-1 | Detailed staff-read scope matches an approved data-access policy | Runner reports current allergy-read observation separately; R1 sign-off is still required |
| MED-1 | Synthetic preparation/prescription/dispensing persists once on replay; refill date is correct | SDK runner |
| SAFE-1 | Null severity rejected; critical match blocks routine owner/pharmacist path; reviewed alert retains allergy | SDK runner |
| FILE-1 | Owner can upload/read/delete its own synthetic object; B/staff/anon cannot download bytes | SDK runner |
| FILE-2 | Direct-path URL, signed-link expiry, tampered IDs/paths, MIME/content mismatch and partial-delete recovery | Manual follow-up; use disposable test files only |
| CLIENT-1 | Two separate browser profiles/tokens show only their pharmacy, including manipulated URLs and logout/back-button flows | Manual multi-account UI acceptance |
| CLIENT-2 | Offline/interrupted write never reports false success or duplicates dispensing | Manual controlled-network failure; keep device security enabled |
| OPS-1 | Subscription suspension/trial expiry, member deactivation and staff limits are enforced over actual API sessions | Local SQL evidence exists; use only dedicated fixtures for approved hosted follow-up |

All fixtures include a per-run synthetic marker. The runner archives only its own created patients, preserves audit/clinical history, deletes only its own disposable document, and signs out only test-account sessions. It does not bulk-delete tenants/users/catalogs. An incomplete cleanup is reported as needing review rather than a passing run. Synthetic catalog and history records may remain; cleanup/retention needs a separately approved, scoped process.

Actual patient pilot approval requires the broader [readiness checklist](SAAS_READINESS.md), not merely this test runner returning success. [Supabase grants and RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
