# Development implementation report

Updated 28 October 2026 (Asia/Baghdad). This report describes development evidence, not commercial or clinical certification.

## Recovery and delivery

Recovered the interrupted local source under the earlier screenshot-review chat, retained its working forms/domain/repository code, and committed the recovered baseline before extending it. The cloud predecessor reported an unavailable workspace and no verified build; the selected `dawaokka` repository was empty. The user approved README initialization on the default branch, with application source restricted to `development`.

The supplied nine Dawaok images informed an original Riaya design. Arabic RTL, Cairo typography, purple/teal statistics, rounded panels and horizontal phone navigation are retained. The finish reviewer marked the listed contrast/responsive corrections resolved; this is a scoped visual-review result.

## Verification actually performed

| Check | Result and scope |
|---|---|
| TypeScript | Passed strict project compilation |
| Vite production output | Passed; static assets, locally hosted fonts and lazy workflow bundles |
| Vitest/React Testing Library | 37 tests passed, including clinical arithmetic, workflow persistence, role gates, duplicates, review retention, AI review guard, top medication editor/focus, collapsed timeline and live repository failure boundaries |
| Local PostgreSQL | Five migrations executed successfully in PGlite; 68 assertions passed for SQL/RLS/function behavior, malformed/null payload rejection, calendar dates, subscription gates, staff limits and private object access with mocked Auth/Storage infrastructure |
| Hosted Supabase migrations | Four migrations applied successfully to the user-approved empty Free development project |
| Hosted security smoke | Transactional synthetic fixture passed patient RPC, unknown-history retention, cross-tenant RPC/RLS denial, staff clinical denial, direct-write denial and audit-delete denial; fixture rolled back |
| Anonymous hosted REST request | `401 / 42501 permission denied for table patients`; no anonymous clinical read grant was added |
| Hosted Storage configuration | `patient-documents` returned `public=false`, file limit `5242880` bytes |
| Real Auth | User created credentials themselves, supplied their UUID, and signed in; platform-owner view verified, followed by owner membership and workspace loading |
| Connected synthetic workflows | Catalog, patient and medication creation, dispensing persistence/dashboard update, critical allergy blocking, Allergy Inbox review, private upload and 68-byte download verified through the authenticated app in the preceding session |
| Browser demo | Patient creation, medication saving, dispensing/dashboard update, language switching and required medication/timeline behavior verified with synthetic records |
| Responsive DOM checks | RTL and no page overflow at 320, 360, 375, 390, 414, 430, 768 and 1440px; results in `responsive-checks.json` |
| Visual review | Valid desktop/phone upper/lower captures plus unknown-allergy profile and Allergy Inbox; listed contrast fixes resolved |
| Playwright CLI suite | 16/16 CRM tests passed in 1.9 minutes across 320px, 390px, tablet and desktop viewports, using one worker and installed Edge; independent smoke test also passed (1/1). Approved execution outside Codex's restricted context was required for pipe/IPC child processes |
| Design detector | Runtime download unavailable; no successful detector run is claimed |

The authenticated workflow tests use a separate pharmacy explicitly named `صيدلية التجربة — بيانات اصطناعية`. Its synthetic records are not actual patients, drugs or allergy histories. The user's separate `مسار الدواء` pharmacy was preserved. No WhatsApp message, email or AI request was sent.

## Resume work on 28 October

Inspected the existing `development` branch and retained all uncommitted implementation and documentation in checkpoint `b659434`. Re-ran the baseline: 29 application tests, 25 PostgreSQL assertions and the production build passed. A new regression demonstrated that a null allergy severity was accepted by the previous command function. Migration 005 closes that validation path through typed command validation, while preserving the original transactional authorization and rejection audit. Additional tests cover null clinical fields, fractional values, invalid dates, network failures, incomplete paginated reads, subscription suspension/expiry, role escalation, staff limits and private object read/delete policies.

Migration 005 was tested only in local PGlite. It has not been applied to the supplied Supabase project. The hosted verification rows above describe the preceding session's four-migration database; they do not establish hosted verification of 005.

## Windows Playwright resolution

Traced the initial failure to Node forking Playwright's `workerProcessEntry.js` with stdout/stderr pipes and IPC. The same standalone Node process diagnostic failed inside Codex's restricted context and passed outside it; inherited/ignored output already worked inside. Direct Edge/Chromium launch and a minimal one-worker test passed outside the restriction, with Chromium sandboxing enabled. The bundled Chromium cache was absent, so the test configuration now uses installed Edge on Windows. No browser reinstall or system-security change was needed.

The first unblocked suite exposed stale exact select-label locators and navigation/filter timing assertions. Corrected the tests and expanded patient/medication edits, archive/restore, retained refill history and pharmacist critical-match blocking. The final full suite passed all 16 checks. Application and SQL code were unchanged during this troubleshooting phase. See PLAYWRIGHT_WINDOWS.md and the saved final browser log.

## Functional coverage

Patient registration/edit/archive, duplicate review, medication catalog and prescription maintenance, structured allergy history, inbox review, dispensing and refill history, internal consultations, follow-up scheduling/outcomes, laboratory histories/editing/trends, document upload/download/rename/category/delete, record-based analytics, staff membership administration, platform pharmacy/subscription administration, and disabled optional extraction interface are implemented.

Clinical writes are validated on the server and bound to the actual authenticated membership. Routine clients cannot edit audit rows. Critical matches block routine dispensing; owner exceptional review is recorded with a reason. Unknown history is not converted to no known allergies. A resolved inbox record does not remove the allergy.

## Remaining acceptance and operational limits

- Review and approve applying incremental migration 005 to the synthetic development project, then repeat hosted validation. Do not use the older hosted command implementation for actual patient care.
- Continue negative-network, file-access, hosted multi-account and physical-device acceptance against the intended hosted URL. The demo suite now passes in Edge viewport emulation; this does not establish every browser/device or hosted-service behavior.
- Netlify remains uncreated and unpublished. Its configuration is supplied; publishing still requires the user's approval. No custom domain or paid plan was enabled.
- Clinical content is limited to exact ingredient identity. There is no comprehensive drug-interaction, cross-reactivity, contraindication or dose-checking service. Custom ingredient identifiers require governance and professional verification.
- AI has a provider/draft-review interface and a clear disabled state. A live extraction provider is not implemented or configured; manual entry is complete.
- Staff onboarding uses existing Auth user UUIDs. There is no automatic invitation email or default password. Production email delivery/recovery must be configured and tested separately.
- File MIME/size and private access controls do not provide antivirus, content sanitization or a tested clinical deletion/retention policy. Supabase administrators can still alter database history.
- The current development repository loads the pharmacy workspace through paged resource queries, then refreshes it after writes. Large tenants need narrower server queries/aggregates and incremental refresh before scale testing.
- The database uses relational tenant/resource constraints plus JSONB record envelopes and generated indexed fields. It is not a fully column-per-field schema.
- Independent clinical workflow validation, privacy/security review, real device acceptance, restore testing and production availability decisions remain required before actual patient care.

## Cost and deployment state

No services were purchased, plans upgraded, usage-based billing enabled, paid API configured or site deployed. The GitHub repository and supplied Supabase project remain on their existing Free setup. See `ZERO_COST.md` for later cost triggers and quota controls; `CLINICAL_SECURITY.md` for safety/privacy boundaries; `SETUP.md` for provisioning and deployment steps.
