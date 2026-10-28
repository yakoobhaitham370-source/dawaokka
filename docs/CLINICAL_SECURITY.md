# Clinical and security boundaries

## Allergy safety

This is a documentation/workflow aid. Supported checking compares a pharmacist-confirmed, normalized ingredient identifier with the patient's recorded ingredient identifier. It never performs fuzzy brand matching or infers class cross-reactivity. The drug class field is descriptive. Unknown/missing ingredient mapping cannot be checked; it is not evidence of absence of risk.

There is no comprehensive curated or licensed interaction/allergy knowledgebase in this build. Excipients, salt forms, combination ingredients, route-specific issues, cross-reactivity, interactions, contraindications, renal/hepatic dosing and pregnancy risks are outside the checker. Enter combination components as explicitly reviewed structured records before relying on identity checks; a compound free-text ingredient string does not match its individual components automatically.

The app preserves unknown history separately from explicitly documented no-known-allergy status and distinguishes suspected allergy, confirmed allergy and non-allergic intolerance. Alert acknowledgment or resolution never deletes the original allergy or suppresses dispensing checks. Matching adverse reactions remain visible. A critical match blocks the routine dispensing flow; an exceptional owner review requires a documented reason. Pharmacy ownership must only be assigned to a clinically authorized owner when this exception is enabled. The software does not decide whether an override is clinically appropriate.

Structured recording and checking the history with the patient before dispensing are consistent with the documentation principles in [NICE CG183](https://www.nice.org.uk/guidance/cg183/chapter/recommendations). This does not establish validation, accreditation or comprehensive guideline compliance for this application.

## Medication and monitoring

The pharmacist confirms the regimen and supply; suggested arithmetic is not a prescription. Refill date is dispensing/start date plus confirmed days supply, using Baghdad calendar dates. PRN, variable, taper and custom regimens may have no reliable date. A supplied override duration requires its documented basis. Supply gaps and early/late dates are descriptive estimates that ignore supplies from other sources and stock on hand. Dispensing records never prove medication consumption or adherence. Lab trends have no automated diagnosis or treatment interpretation.

AI extraction has no live provider in this release. No document is sent to an AI provider, no OCR is fabricated, and a future extracted draft must be reviewed before clinical saving. A provider requires a separate backend implementation, privacy review and cost approval.

## Data and access

- `/demo` uses only dedicated synthetic tab-session state and in-memory demo uploads. No fallback to demo occurs after a connected-data failure. Real records are never cached in browser local/session storage by the repository. Supabase Auth itself persists its session token; secure the device and sign out on shared terminals.
- RLS is enabled across application tables. Server role lookup binds the authenticated user to an active pharmacy subscription and membership. Client role simulation exists only in demo. A platform owner has no implicit patient-data permission.
- Routine table access is SELECT only; writes pass through command RPC validation. Resource foreign keys and immutable patient ownership prevent cross-tenant record retargeting. Dispensing uses an advisory transaction lock and idempotency ID.
- Audit logs, dispensing records, contact attempts and clinical reviews are append-only through the client. Database administrators remain powerful; this is not a cryptographically immutable ledger. Control elevated database access and backups.
- Files use a private bucket, random object IDs, size/MIME limits and short-lived signed URLs. Actual content/magic-byte inspection, antivirus and PDF sanitization are not implemented. File types alone do not guarantee safe content. Complete those controls before real clinical uploads.
- Document object deletion and metadata deletion cross the Storage/database boundary; a failed second step can require reconciliation. Audit review is required for clinical deletion policies. The UI asks for confirmation and retains the database audit event when metadata deletion succeeds.
- No real user credentials, service-role key, AI key, patient data or authenticated session are committed. The Supabase project URL and publishable key are public configuration. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Before real patient care

Obtain independent clinical workflow validation, medication catalog governance, privacy/security assessment for the actual jurisdiction, an appropriate hosting agreement, tested backups/restores, account recovery, staff onboarding/offboarding, device controls, operational incident handling, and load testing at intended volumes. Confirm hosted Auth/RLS/Storage with multiple real test accounts. No commercial deployment is asserted by this development delivery.
