# Zero additional infrastructure cost

Decision date: 27 October 2026. No purchases, upgrades, usage-based billing, payment gateway, paid clinical feed, SMS, automatic WhatsApp or AI API have been enabled. Development uses the user's existing Codex allowance. Account-wide limits and other existing usage are outside this application's control.

## Development services

| Component | $0 development implementation | Later cost trigger / constraint |
|---|---|---|
| Source control | Existing GitHub Free repository | Private Actions minutes, artifact/package storage or organizational features beyond included quotas |
| UI and calculation | Local React/TypeScript; MIT/Apache ecosystem packages; local exact ingredient comparison | Maintenance and clinical validation work; no runtime API fee required |
| Database/Auth | One shared Supabase Free development project | Capacity, availability, advanced backup, higher auth limits or dedicated tenant projects |
| Documents | Private Supabase Storage; 5MB application upload cap | Storage and download/egress volume; malware scanning service if required |
| Preview | Netlify Free configuration supplied; not published | Monthly deployment/traffic credit budget, team features or production availability |
| WhatsApp | Manual `wa.me` link, recorded consent and preference | Provider charges for future automated messaging; never required for core workflows |
| Prescription extraction | Disabled provider interface, manual entry remains available | External inference, OCR, hosting, consent and privacy controls; separate approval required |
| Allergy checking | Exact pharmacist-entered ingredient identity and structured records | Licensed interaction/cross-reactivity reference, clinical content updates and independent validation |
| Email and staff | Existing Auth user UUID membership administration | Production SMTP/deliverability or a future invitation provider; no automatic email service is configured |
| Operations | Local tests, manual export/restore procedures | Monitoring, long-term audit retention, support, backups, disaster recovery and compliance work |
| Branding/domains | Included hosting subdomain when approved | Optional custom domain registration and renewal |
| Commercial SaaS | Manual development account status/entitlements | Payment processing, invoicing/tax, commercial support and contractual obligations |

The current Supabase Free published allowance includes a 500MB database, 1GB storage and limited egress; inactive projects may pause. It is a development service without a production availability assumption. Verify your account's actual allocation before every rollout. [Supabase pricing](https://supabase.com/pricing)

Netlify currently lists a 300-credit monthly Free budget. Usage is shared across applicable account sites. Keep the project on Free, do not enable recharge, and stop/reduce preview usage when a limit approaches. [Netlify pricing](https://www.netlify.com/pricing/)

GitHub Free supports public/private repositories; CI and storage allocations depend on repository/account conditions. This build does not schedule recurring Actions or deploy on push. [GitHub pricing](https://github.com/pricing)

## Cost controls in the source

- No telemetry, external font request, hosted image, maps API or paid SDK. Cairo is self-hosted.
- Static Vite output, lazy-loaded workflow screens, no server rendering service or cron dependency.
- One shared database with tenant isolation rather than one project per pharmacy.
- Indexed membership, patient, ingredient and refill fields. RLS uses role lookups on indexed memberships.
- SELECT only for client tables; transactional RPC commands prevent multi-request partial dispensing.
- 30-second query freshness and no polling or focus refetch. Failed queries retry once. No realtime subscription or background keep-alive.
- Result loading uses explicit 200-row pages to avoid Supabase's default response cap. The current small-development workspace still loads all pharmacy records and refreshes after a write. Before large tenants, replace this with module-specific server filtering, aggregate queries and incremental refresh; do not raise database limits to conceal inefficient loading.
- Document types restricted to PDF/JPEG/PNG and 5MB. Use synthetic small files during development. No public medical bucket.
- Keep a backup/retention policy appropriate to patient records. Never delete clinically required records merely to free quota. Archive users in the app; audit rows cannot be deleted by routine client permissions.

## Approval policy

Review an actual price, data flow, expected volume and spending cap before proposing any paid feature. Obtain the user's approval before purchasing, upgrading, recharging, enabling metered billing or deploying. If a free limit prevents safe operation, stop the affected operation, explain it and retain the existing records. Security, privacy and clinical review take precedence over the $0 objective.
