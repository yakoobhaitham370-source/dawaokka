# رعاية — Riaya Pharmacy Chronic Care CRM

Arabic-first chronic care workspace for Iraqi community pharmacies, built from the recovered local implementation. React, TypeScript, Vite, Supabase, Cairo, Radix, TanStack Query, React Hook Form, Zod, Lucide and Recharts. No paid API is required.

## Run locally

Node.js 24 or newer is recommended. Dependencies are pinned and the lockfile is committed.

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/demo` for an isolated synthetic demo. Open `/` for sign-in. Demo records persist in this tab's session storage; uploaded demo file bytes remain in memory only. Never enter real patient information into the demo. Settings includes a reset action and role simulation.

```powershell
npm test
npm run test:database
npm run build
```

Tests include workflow/component checks and actual SQL migration/RLS/transaction tests using PGlite, an embedded PostgreSQL engine. They do not substitute for testing Supabase Auth, Storage or delivery infrastructure against the connected project.

For browser checks on Windows, the Playwright configuration uses the installed Edge browser with Chromium sandboxing enabled. See [the Windows browser-testing guide](docs/PLAYWRIGHT_WINDOWS.md) for the confirmed Codex pipe/IPC restriction, a process diagnostic, a minimal one-worker test, and exact commands to run safely in your own terminal. No security exclusions or permission changes are required.

## Connected development

Copy `.env.example` to `.env.local`, enter the project's **publishable** key, and restart Vite. Do not enter a service-role key, secret API key, database password or AI key in any `VITE_` variable. The configured project URL is `https://qfnaubzpakbmtgxhqrhc.supabase.co`.

For a fresh project, apply all five migrations in filename order only after reviewing and approving the target schema. The first four already exist on the supplied development database. The incremental `202610280005_strict_command_validation.sql` has passed local PostgreSQL tests but has **not been applied remotely**; do not rerun the first four on that project. Follow [SETUP.md](docs/SETUP.md) for provisioning and verification. There is no public pharmacy signup. A platform owner creates pharmacy accounts; a pharmacy owner manages existing staff user memberships.

## Implemented workflows

- RTL Arabic and English interface; all main modules accessible at phone/tablet/desktop widths.
- Patient creation, duplicate acknowledgement, editing, archive/restore, search, filters, pagination and clinical profile.
- Medication catalog, pharmacist-verified ingredient entry, prescription editing, stop/pause, new forms at the top with focus.
- Structured allergy profiles, unknown-history distinction, central inbox, assignment, source notes and retained review history.
- Dispensing review, quantity/days supply, calendar-safe refill dates, unknown PRN supply, critical-match blocks and audited exceptional owner review.
- Collapsed refill timeline; recorded dispensing history and descriptive early/late comparisons.
- Internal consultation records, templates, notes, close/reopen, manually initiated consent-gated WhatsApp.
- Follow-up scheduling, outcomes, rescheduling and contact history.
- Lab histories and descriptive trend charts; private document upload/view/download/rename/delete.
- Record-based analytics, IQD transaction values and documented denominators.
- Supabase Auth boundary, tenant-scoped database policies, transactional command RPC, append-only client audit access, staff limits and platform administration.
- Optional extraction provider boundary, disabled without a configured backend provider; no fabricated OCR output.

## Release status

This is a development build, not a clinically validated commercial deployment. Read [the implementation report](docs/IMPLEMENTATION_REPORT.md), [clinical/security limitations](docs/CLINICAL_SECURITY.md) and [the zero-cost register](docs/ZERO_COST.md). No Netlify site has been created or published. Do not use live patient data until the release conditions in those documents are met.

The [controlled SaaS/pilot readiness checklist](docs/SAAS_READINESS.md) now records the current hosted preflight, exact migration-005 approval gates and unresolved workflow/privacy items. [Real Supabase acceptance tests](docs/SUPABASE_ACCEPTANCE.md) are prepared and gated, not executed. [Android Wi-Fi instructions](docs/ANDROID_WIFI_PREVIEW.md) use the existing build with trusted HTTPS; ordinary LAN HTTP is not a full functional workaround for the current UUID API. The [visual review](docs/VISUAL_REVIEW.md) preserves the existing design without UI changes.

Latest local verification: 37 application tests, 68 PostgreSQL assertions and strict TypeScript/production build passed. The Codex pipe/IPC restriction was isolated; approved execution outside that context passed all 16 CRM browser checks and the independent one-worker smoke test using installed Edge. See [PROGRESS.md](docs/PROGRESS.md) for remaining hosted and release acceptance tasks.

All changes belong on `development`. The default branch is only the approved repository initialization. No automatic deployment workflow is configured.
