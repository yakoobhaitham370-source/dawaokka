# Resume checkpoint — 28 October 2026

## Current authoritative checkpoint — security continuation

Resumed existing clean `development` at `2f1bf6b`; no project restart. The owner clarified the real entry was in local demo and was reset; hosted contents remain unverified/sensitive. Earlier synthetic-only assumptions/next-step instructions below are superseded. Preserve legitimate records. No patient/Auth contents were read in the current review.

Fresh metadata-only hosted SELECT/Auth settings review confirm broad staff clinical/audit reads, globally readable authenticated condition labels and public signup ON. Private Storage and tenant RLS remain installed; no cross-tenant patient-read path found in reviewed controls, not a real-Auth certification. Postgres is 17.11. 005 is absent and unchanged at its documented SHA-256. Do not rerun installed 001–004 or repair the absent manual ledger automatically.

Prepared `supabase/proposals/202610280006_least_privilege.sql` outside automatic migrations: clinicians-only clinical/metadata reads, owner-only audit, tenant-linked condition labels, assigned-task staff projection/command authorization. Live staff client fails closed without that RPC. Session/identity cache cleanup includes delayed-initial-session-after-logout regression. Existing onboarding/private file policies remain server-enforced. Hosted signup/session/MFA/recovery changes are proposals only; self-service recovery remains unfinished. No historical patient/audit data is rewritten by this proposal.

Acceptance runner refuses the existing project; require a separately approved synthetic-only target, 005/006 and five actors/two tenants. None is provisioned. `SECURITY_REVIEW_2026_10_28.md` covers findings, policy decisions, risks and safe separation. `PRIVATE_BACKUP_PLAN_WINDOWS.md` covers tools, encryption, keys, beginner steps, restore verification and exact approval text. No backup/export/install/restore infrastructure exists yet.

Verification: 41 application tests, 167 local database assertions (68 prior + 99 security), 9 no-network runner guards, TypeScript and production build pass. Final browser results: 16 demo + 8 mocked-staff checks pass across four viewports. Initial staff checks failed because the reused demo server had no Supabase configuration; fixed using a separate fake-config loopback server. No actual hosted acceptance/full recovery test has run.

Next: encrypted destination/tool approval, then sensitive export scope. Urgent signup containment/role policy need separate approval. Keep 005/006, hosted accounts/settings/records, recovery infrastructure and deployment held. Do not run earlier target-specific acceptance commands.

Continue this existing project on `development`. Preserve local changes and `.env.local`. Do not restart, merge to the default branch, deploy, purchase services or change a hosted database without approval.

## Completed development

All requested core screens exist: Arabic RTL/English shell, dashboard, patients, medications, Allergy Inbox, dispensing/refills, consultations, follow-ups, laboratory monitoring, private documents, analytics, settings/team and platform administration. Supabase Auth, tenant RLS and command RPC are connected. Isolated synthetic `/demo` is functional. AI has a disabled provider/review interface, with no live provider or paid dependency. See IMPLEMENTATION_REPORT.md for evidence and limitations.

The interrupted session's uncommitted progress was preserved in `b659434`. No source files were deleted or project recreated.

## Latest local checks

- `npm test -- --reporter=dot`: 37 passed.
- `npm run test:database`: five migrations executed; 68 assertions passed.
- `npm run build`: TypeScript and production assets passed.
- Full Playwright suite: 16/16 passed with one worker, across four viewports, in approved execution outside Codex's restricted pipe/IPC context. Independent smoke test: 1/1 passed. Installed Edge used with Chromium sandboxing enabled. See PLAYWRIGHT_WINDOWS.md for the controlled diagnosis, safe terminal commands and evidence.

The hosted project still has the four previously approved migrations. No hosted database or deployment was changed during this resumed phase.

## Next unfinished tasks

1. Review migration `202610280005_strict_command_validation.sql`. It fixes demonstrated null/type validation gaps. Apply only after explicit target approval, then rerun synthetic hosted acceptance. Do not reapply migrations 001–004.
2. Browser automation now runs successfully outside the restricted Codex context. Continue remaining hosted multi-account, negative-network and physical-device acceptance; the passing suite covers synthetic demo workflows in Edge viewport emulation.
3. Complete production clinical/privacy review, restore testing, account recovery, document-content controls and scale validation before real patient use. These are release gates, not claims of missing free-tier billing authorization.
4. Netlify configuration exists, but no site is created or published. Publishing and any plan/payment changes require approval.

## Readiness preparation completed

The user completed Git Credential Manager sign-in. The original `b86ec06` and preserved local history are now pushed on GitHub `development`, not merely represented by a content-equivalent API snapshot. Local and remote verified source trees matched; main remains the approved README initialization. Future ordinary Git pushes can use the configured credential helper without exposing credentials.

No application build, UI code change or hosted mutation was performed during the readiness phase. Read-only hosted inspection confirmed 28 RLS tables, private Storage, command grants, all four 004 constraints, no 005 helper conflicts and no flagged fields in bounded null/type scans. Migration 005 is still absent. Hosted command source matches 002 after line-ending normalization. Signup is enabled and URL configuration remains localhost:3000 with no redirects; settings were not changed.

Added SAAS_READINESS.md, SUPABASE_ACCEPTANCE.md, FUNCTIONAL_LIMITATIONS.md, VISUAL_REVIEW.md and ANDROID_WIFI_PREVIEW.md. The gated real-Auth test runner is prepared but has not run. Seven no-network guard checks, six disposable local migration apply/rollback/reapply checks and TypeScript validation passed. A change-specific command definition is saved in ignored `.local/`; this is not a complete database/Auth/Storage backup.

Next: review private recovery coverage and obtain explicit approval for 005 only, then provision approved synthetic accounts/tenants and execute hosted acceptance. Do not use real patient data yet: staff read scope, shared labels, custom thresholds, correction reconciliation, mixed-unit lab charts, document/retention controls and Auth/recovery/operational gates remain open.

GitHub updates target only `development`; no automated deployment is configured. See SAAS_READINESS.md before continuing rather than rebuilding completed features.

## Migration safety review — held, not approved

Fresh read-only checks confirmed the exact same project, but Supabase explicitly labels its only `main` branch Production. There is one patient matching our known synthetic fixture/markers, and no other patient rows. The second, unlabelled pharmacy is empty; the owner must attest its purpose and confirm all content is synthetic before any migration. Full Database/Auth/Storage recovery is not prepared; the existing command snapshot is only change-specific. Public signup remains enabled, default Auth URLs remain, staff read scope is broad, and shared condition labels are readable to authenticated users. No hosted values/settings were changed.

See MIGRATION_005_SAFETY_APPROVAL.md for exact approvals. Next approval should cover owner target/data attestation and private encrypted recovery preparation. Do not apply 005, repair the missing manual migration ledger, provision five accounts/two tenants, change Auth/RLS or deploy until their separate approvals arrive. 005 checksum remains unchanged.
