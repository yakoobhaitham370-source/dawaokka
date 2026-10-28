# Security assessment and proposed access policy

28 October 2026. **Migration 005: HOLD. Hosted security changes: NOT AUTHORIZED.**

## Classification correction

The owner first reported real hosted patient information, then clarified that one real record was entered in the local `/demo` and that the demo was reset. The owner reports one hosted patient explicitly labelled as a synthetic fixture. This does not establish the provenance of every field, document, condition label, audit entry or identity. Treat the existing hosted project as **potentially containing real medical information**, with sensitive real operator authentication data. Do not classify it synthetic-only. Do not inspect the former real demo record, browser storage, backups or browser history.

The existing project `qfnaubzpakbmtgxhqrhc` has a primary branch labelled Production; it is not isolated staging. No patient content was queried in this review. No Auth identities/password hashes/tokens, Storage paths/file bytes, emails, phones or clinical audit payloads were fetched, displayed or exported. Earlier counts/provenance evidence are historical, not a current safety certification.

## Fresh read-only evidence

The dashboard confirmed public signup ON, email confirmation ON, email sign-in enabled, anonymous sign-in/manual linking OFF. Site URL is `http://localhost:3000` and redirects are empty. No Save action was taken. Sessions, recovery delivery, MFA enforcement, organization membership, current staff roster and access-log history have **not** been independently verified in this phase; names/emails/user records were deliberately avoided. Configuration review is not an incident investigation.

`supabase/tests/security-metadata-readonly.sql` ran as SELECT only and returned catalog/configuration metadata, not records. PostgreSQL is 17.11. All public tables inspected have RLS. `anon` and `authenticated` have neither superuser nor BYPASSRLS. Anonymous patient SELECT and command execution are denied; authenticated direct patient UPDATE is denied. The command permits authenticated execution and uses SECURITY DEFINER with an empty search path. Its normalized source hash still matches 002. Observed policies match the installed migration sources reviewed locally.

The private document bucket is not public, permits PDF/JPEG/PNG and limits uploads to 5MB. Its object policies permit owners/pharmacists in the matching tenant; reads also require matching document metadata. No other object policies were returned. A private bucket alone does not prevent disclosure through privileged keys, forwarded signed URLs, downloaded copies or filenames in metadata/audit.

## Priorities and distinctions

| Priority / finding | Classification and actual reach | Proposed mitigation / approval |
|---|---|---|
| P0: no verified complete recovery set | Recovery risk, not evidence of disclosure. The old function snapshot is not a full backup. | Approve encrypted backup scope/destination/tooling, then isolated verification before a hosted migration. |
| P0: clinical labels globally readable | Confirmed authorization gap for **patient-derived free-text labels**: `conditions_read USING(true)` exposes labels to every authenticated identity, including confirmed public signups without memberships. We did not inspect contents and cannot claim identifiable labels were actually exposed. | Proposed 006 restricts reads to clinicians in a tenant already linked to that label. Closing signup alone leaves existing unassigned accounts able to read until RLS changes. Approve RLS change separately. |
| P0: broad staff clinical/audit reads | Confirmed mismatch with intended follow-up-only staff policy. Active staff in an active pharmacy can read patients, allergies, meds, labs, consultations, document metadata and audit rows. UI hiding is insufficient. | Owner approves role matrix below, then 006 and restricted staff client together. |
| P1: full payload audit | Command source records the complete workflow command. Audit therefore duplicates clinical information, even if the visible patient list is fictional or reset. Staff can currently read it. No audit contents were read. | 006 restricts full audit to owners; future prospective audit minimization requires clinical/retention decision. Do not delete or rewrite old audit. |
| P1: public signup | Configurational/product-owner decision; signup alone grants no tenant membership or clinical-row access. It expands abuse surface and combines with global labels. Email confirmation is not pharmacy authorization. | Approve disabling public signup, retaining existing logins and confirmation. Provision named operators privately only after separate approval. Do not delete existing users. |
| P1: session/recovery settings | Shared-terminal/session lifetime, MFA, correct trusted recovery URLs, email delivery and offboarding are unresolved. Existing app has no complete reviewed self-service password recovery flow. | Review settings privately; approve exact URLs/session/MFA/recovery configuration and any credential handoff. No wildcard redirects or automatic emails. |
| P1: tenant isolation | Reviewed SQL ties clinical rows and byte access to active tenant membership and subscription; platform-only has no implicit clinical membership. No cross-tenant patient-read route found in inspected policies. This is **not** proof all APIs/live sessions are safe. | Local negative regression and later independent real-Auth tests in an isolated synthetic project. Review privileged API keys/dashboard operators separately. |
| P1: current 002/004 validation gaps | Known null/type holes persist while 005 is held. Permission changes do not make clinical decision logic reliable. | Keep clinical safety/qualified pharmacist review as a separate gate. Approve exact 005 only after recovery/security review. |

There is no evidence here that a breach occurred, nor sufficient evidence to certify its absence. An owner-led private review of authorized operators, access history and any patient-derived global content is appropriate; raw logs/content must not enter chat/Git. Suspected compromise needs a separately authorized response with evidence preservation, not blind key rotation or record deletion.

## Local fixes prepared, not applied to Supabase

`supabase/proposals/202610280006_least_privilege.sql` is intentionally **outside the automatic migration directory**. It requires 005 and fails on command-source insertion-point drift. It changes policies/functions, not historical clinical/Auth/Storage rows. It does not change 001–005 or fabricate migration history. Promote it into the migration sequence only after review and approval.

Proposed role matrix:

| Resource | Owner | Pharmacist | Staff | Unassigned / platform-only |
|---|---|---|---|---|
| Tenant clinical records | Read/workflows | Read/workflows, existing override limits | Denied | Denied |
| Full audit payloads | Own tenant | Denied | Denied | Denied |
| Documents: metadata and bytes | Own tenant | Own tenant | Denied | Denied |
| Patient-derived condition labels | Own tenant-linked labels | Own tenant-linked labels | Denied | Denied |
| Assigned contact queue | Uses normal clinician workspace | Uses normal clinician workspace | Minimum assigned task projection | Denied |
| Create/reassign follow-up | Allowed | Allowed | Denied | Denied |
| Record contact outcome | Existing authorized workflow | Existing authorized workflow | Own assigned active-patient task, consent enforced | Denied |
| Onboarding / membership | Platform creates pharmacy; tenant owner assigns existing accounts | No onboarding | No onboarding | Platform administrative scope only |

Staff projection returns task/date/status, patient name, contact consent/preference and phone only when consent allows. It excludes diagnosis, notes, meds, labs, document paths and audit payloads. The patient association is still sensitive, so **this minimum disclosure is an explicit owner decision**. Tasks must be assigned using the staff Auth UUID; legacy display-name assignments fail closed and remain intact. The existing assignee text field accepts that UUID; a richer staff picker is future work. No automatic reassignment or patient edit occurs.

Platform ownership remains powerful: the administrative RPC can explicitly assign a pharmacy owner, including a platform operator if permitted by governance. “No implicit clinical read” is not protection against an administrator granting membership, a database operator or a service credential bypassing RLS. Review operators and administrative grants privately; a stricter break-glass/two-person onboarding model is a separate product/security decision. Shared catalog/reference tables are intended for curated non-patient information, not a certification of their current contents.

The local app routes live staff directly to the server-projected queue and never loads the normal clinical repository for that role. Against the unchanged hosted database, its missing RPC gives a closed error state; it does not fall back to broad reads. Demo role simulation and clinician features remain intact. Query caches are cancelled/cleared on sign-out or identity changes. This is client privacy hygiene, not a substitute for server authorization or token/session policy.

Existing document object policies are retained; narrowing metadata access closes the staff path. Content validation, malware screening, signed-link revocation/expiry, orphan reconciliation and data retention remain separate work. Owner onboarding already uses server-authorized platform/owner RPCs; local tests confirm staff cannot self-promote. Public signup must be changed in hosted Auth settings only after approval; no local toggle can enforce that remotely.

## Separate real data from testing without losing records

1. Preserve the existing project and all legitimate records. Stop automated acceptance writes to it. No tenant reset, seed replay, bulk deletion, archival or reclassification is authorized.
2. Keep local demo/tests entirely fictional; do not copy real records and then try to anonymize them. Demo reset is not proof of erasure from other tabs, session restore, prior screenshots/downloads or OS/browser backups. Any private cleanup assessment requires a separate scope; do not inspect/erase those locations automatically.
3. Approve a **separate empty synthetic test project** or a local full Supabase stack later. Check Free project allowance first; if unavailable, use the local option rather than upgrading. No project/account is created now.
4. Build that target from reviewed schema migrations and fresh fictional fixtures only. Never restore a sensitive backup into ordinary test infrastructure. Use independent keys, environment configuration and test browser profiles; never share real operator credentials.
5. The real-Auth acceptance runner now explicitly rejects the existing project, even if test tenants have synthetic names. A new approved URL, synthetic-only classification, 005/006 confirmation and the existing five-actor/two-tenant guards are required. This change is intentional; previous target-specific run instructions are superseded.
6. Use a separately approved restricted **recovery enclave** for sensitive restore rehearsal. It is not the ordinary synthetic development/test target. Keep originals in place until a later formally approved migration with reconciliation; no legitimate record is moved as part of separation.

## Approval order

Already authorized: metadata-only review, local code/SQL proposals/tests, sanitized documentation and development commits/pushes. No hosted modifications follow from that authorization.

1. **Immediate containment settings:** approve exactly public signup OFF while retaining existing accounts, plus a private staff/operator roster review. Any deactivation, session revocation, key rotation, MFA requirement or recovery URL change requires its own exact list and approval. The owner may choose containment before backup; preserving evidence must accompany incident-specific action.
2. **Private recovery:** approve the precise scope, encrypted local destination, key custody and free tools in [PRIVATE_BACKUP_PLAN_WINDOWS.md](PRIVATE_BACKUP_PLAN_WINDOWS.md). No raw medical/Auth data in reports. Approval to export does not approve restore infrastructure.
3. **Recovery verification:** approve local runtime installation/configuration and the encrypted isolated restore destination, no external mail/webhooks. Validate limitations and recovery targets.
4. **Hosted security policy:** approve the role matrix and reviewed 006; also decide prospective audit minimization, taxonomy governance, Auth/session/recovery settings. These are not silently bundled with 005. Sequence must be rehearsed with the real installed baseline.
5. **005:** after recovery/security requirements are reviewed and evidence accepted, reconfirm the exact production-labelled target and approve the frozen checksum in [MIGRATION_005_SAFETY_APPROVAL.md](MIGRATION_005_SAFETY_APPROVAL.md), quiet-write interval and failure/rollback authority. Because 006 depends on 005, approve a reviewed sequence explicitly if both are chosen. Nothing is applied now.
6. **Synthetic acceptance:** approve separate target creation/tooling and five independent fictional accounts/two pharmacies. Only then execute hosted writes there. No test fixtures are provisioned in the existing project.

Free-tier status does not establish clinical, privacy or operational suitability. Passing local SQL/UI tests is not a real-Auth cross-tenant assessment, full recovery proof or approval for patient care.

Official reference: [Auth signup controls](https://supabase.com/docs/guides/auth/general-configuration). Disabling signup prevents new registrations but does not remove existing identities or fix RLS.

## Verification and remaining work

Final local results: **41 application tests, 167 PostgreSQL assertions, nine no-network hosted guard tests, TypeScript and production build passed**. The database total includes all 68 existing assertions and 99 new security checks, including payload preservation, staff/non-member clinical denial, owner/pharmacist scope, per-tenant labels, linked Storage permissions, assigned task authorization, consent and revocation.

**24 browser tests passed** using installed Edge with one worker: 16 existing synthetic demo workflows and eight isolated mocked-staff checks at phone 320/390, tablet and desktop sizes. Arabic RTL/overflow, medication form at top, collapsed refill timeline, editing, Allergy Inbox, dispensing and refill workflows are retained. Staff checks intercept every backend request and use a fake project URL; they do not prove hosted authentication. First staff run failed because the reused demo server had no Supabase configuration; the separate fake-config test server corrected that fixture issue. No unresolved test failure remains in these suites.

Safe commands from the application directory:

```powershell
npm.cmd test -- --reporter=dot
node tests/database.mjs
node tests/hosted/guards.test.mjs
npm.cmd run build
node node_modules/@playwright/test/cli.js test --workers=1 --reporter=line
node node_modules/@playwright/test/cli.js test --config=tests/tooling/staff-ui.config.ts --workers=1 --reporter=line
```

Use the established Windows-compatible execution described in PLAYWRIGHT_WINDOWS.md; no Defender/ACL/Chromium sandbox weakening occurred. No hosted acceptance, account provisioning, sensitive backup or restore verification ran. No tool installation, hosted setting/record change, migration or deployment occurred. Current hosted risks therefore remain until separately authorized and verified changes. New reports/commits contain policy/configuration metadata and fictional test fixtures, with no retrieved patient details, Auth contents or private backup payloads.
