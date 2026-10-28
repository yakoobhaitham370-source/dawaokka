# Readiness decision and controlled pharmacy pilot checklist

28 October 2026 (Asia/Baghdad). This phase preserves the app. No UI/application/migration source was changed, no application build was run, no hosted migration was applied, and nothing was publicly deployed. Added artifacts are reviews, protective Git ignore rules, local preview tooling and gated test preparation.

## Decision

| Stage | Disposition | Conditions |
|---|---|---|
| Existing local demo / interface review | Reviewed; prior automated checks passed | Fictional data only; physical Android remains untested. |
| Real Supabase SaaS acceptance with synthetic data | **Prepared; approval/setup pending** | Private recovery preparation, explicit 005 approval, two dedicated test tenants and five independently authenticated fixtures, then the gated suite. |
| Controlled pharmacy pilot with real patient information | **Not ready** | Clinical/privacy/operations sign-offs and the unresolved items below must be addressed first. Passing demo tests does not authorize patient care. |

## Repository and sensitive-content review

- Original commit `b86ec06c77a6bc53a5bcbdcb57a2e26e353d7d83` is now on GitHub and an ancestor of `development`. Git Credential Manager sign-in was completed by the user, enabling a real Git push. Earlier `aae9486` was a content-equivalent API snapshot; the history has now been reconciled without changing verified files.
- The synchronized source tree at this checkpoint was `754393570317ef51f34cc1ff433eaa92f3256d85`; the original b86ec06 tree and local/remote source matched. `main` remains `8acc6de6765614eed98dc6757dfcca280466e0a3`. Review/test documentation added afterward is committed separately; `src/` and all five migrations remain unchanged.
- A local scan of all reachable Git history found no matching private-key, provider-secret, privileged/user JWT, GitHub-token, AWS-access-ID or database-password URL patterns, and no tracked private environment file. The staged readiness artifacts are scanned again before delivery. This is a pattern/provenance review, not a mathematical proof of absence.
- Visible patient examples in source/screenshots are the labelled fictional `seedData` fixtures. No real clinical export or Auth session was placed in the repository. `.env.example` has a public project URL and blank key. Public URLs/publishable keys are not administrator credentials.
- `.local/`, private backups, environment variants and certificate/key files are ignored. The change-specific command backup stays local and untracked. Git sign-in credentials remain outside the repository.

## Current hosted facts — read-only inspection

The project has 28 public application tables, no table without RLS, a private 5MB PDF/JPEG/PNG bucket, one Auth account, two pharmacies and two memberships. Anonymous patient reads/command execution and authenticated direct patient updates are denied. The command is SECURITY DEFINER with an empty search path; its current body matches 002 after line-ending normalization. All four 004 constraints exist, no 005 helper names conflict, and bounded null/type scans returned zero flagged records. Migration 005 and its call hook are absent.

Auth: email sign-in and email confirmation are enabled; public account signup is enabled; anonymous sign-in and manual linking are disabled. Site URL is still `http://localhost:3000`, with no redirect URLs. No setting was changed. Public account signup does not itself create a pharmacy or membership, but it conflicts with the intended owner-provisioned account policy and needs an approved decision before pilot use.

See [read-only evidence](evidence/pilot-review/hosted-preflight.json), [bounded 005 checks](evidence/pilot-review/before-005-summary.json) and [Auth settings](evidence/pilot-review/auth-settings.json).

## Before approving migration 005

- [x] Review all five files and freeze 005 checksum: `2ee671dda1aeef164cf8f1180057d06ca3e3dadc397e8cfa4eda2e978401e3b9`.
- [x] Confirm current command source against 002 and check RLS/grants/private Storage.
- [x] Confirm 004 constraints, absence of helper conflicts and bounded data checks.
- [x] Save an ignored, change-specific old command definition; rehearse apply/rollback/reapply locally (six assertions passed).
- [ ] Operator confirms target remains synthetic-only and reviews full private recovery/export coverage. A function snapshot is not a full database/Auth/Storage backup.
- [ ] User approves only 005 for this exact project and chooses a short interval without concurrent writes.
- [ ] Apply once, rerun preflight, then execute approved synthetic hosted acceptance. No approval is inferred from this checklist.

[SUPABASE_ACCEPTANCE.md](SUPABASE_ACCEPTANCE.md) contains the exact runbook, role fixtures, safe terminal commands and test matrix. Do not rerun 001–004 or reset the database.

## Controlled synthetic SaaS pilot

- [ ] Create two new `SYNTHETIC ACCEPTANCE A/B` pharmacies and five distinct test accounts after fixture/role-grant approval. Preserve both existing pharmacies.
- [ ] Run actual Auth, CRUD, RPC, RLS, cross-pharmacy and private-file checks using the prepared SDK runner. Record sanitized results; it has not yet run.
- [ ] Use separate browser profiles for A/B, a restricted staff member and a platform-only account. Test modified URLs, sign-out/back navigation and member deactivation.
- [ ] Test a dropped/interrupted network request and duplicate retry; retain server audit evidence without exporting patient payloads.
- [ ] Execute physical Android testing over trusted local HTTPS, including keyboard, portrait/landscape, text scaling and all modules. [Android Wi-Fi guide](ANDROID_WIFI_PREVIEW.md).
- [ ] Record device/browser versions, operator, date, source commit, project, failures and disposition. Keep all fixtures unmistakably synthetic and disable real outbound communications.

## Before any real-patient pharmacy pilot

| Gate | Required owner / evidence | Status |
|---|---|---|
| Clinical leadership | Qualified pharmacist approves scope, catalog governance, allergy/override workflow and dispensing/refill cases; validates actual practice independently | Open |
| Staff access / global labels | Pharmacy/privacy lead approves the actual field-level role matrix or narrows RLS; govern or tenant-scope condition labels (R1/R2) | Open |
| Corrections / thresholds | Complete and validate quantity-correction/refill reconciliation and make saved reminder thresholds effective or explicitly constrain the pilot (R3/R4) | Open |
| Lab interpretation risk | Separate/normalize units in trend series and validate displayed values/ranges with a clinician (R5) | Open |
| Documents / retention | Approve content controls, deletion/reconciliation, retention, audit access and secure downloads (R6/R7) | Open |
| Auth / shared terminals | Approve signup policy and exact URLs; validate recovery, expiry, logout/cache clearance, offboarding and MFA policy (R8) | Open |
| Privacy / hosting | Assess the intended jurisdiction, patient consent, access/disclosure handling and hosting/privacy arrangements; do not assume a Free project is suitable | Open |
| Recovery / availability | Private database/Auth recovery plan, separate Storage-byte backup, restore rehearsal, outage/incident owner and acceptable recovery targets (R9) | Open |
| Device / scale | Physical Android and intended browsers, practical concurrency and larger-tenant load acceptance | Open |
| Pilot boundaries | Named operators, one approved real-pilot tenant, agreed start/stop criteria, synthetic rehearsal completed, no automated messaging/AI | Open |
| Final go/no-go | Pharmacy clinical lead, privacy/operations owner and system owner sign off against this source version and evidence | Open |

The gap inventory is in [FUNCTIONAL_LIMITATIONS.md](FUNCTIONAL_LIMITATIONS.md). These findings were documented, not silently fixed or hidden behind passing automated tests. Optional AI remains disabled and manual WhatsApp is the only messaging integration. No payment service or upgrade is authorized.

Supabase's Free plan can pause inactive projects; backup/export/availability decisions must be made deliberately. No plan upgrade was enabled. [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [backup guidance](https://supabase.com/docs/guides/platform/backups).

## Safest next step

The app is already connected to the supplied development project; do not create another backend, rotate keys or copy demo data into it. Review the private recovery coverage, explicitly approve **only migration 005**, and apply it during a quiet synthetic-development interval. Confirm the validator and unchanged grants with read-only preflight, then provision the separately approved synthetic identity/tenant fixtures and run the real API tests. Keep actual patient data out until the real-pilot gates above are closed.
