# Hosted Auth changes proposed for owner approval

No command in this document has been applied. A local application setting cannot
disable hosted signup or enforce server MFA. Do not submit dashboard Save actions
or API configuration updates without separate approval.

1. Approve `Allow new users to sign up = OFF`, retaining existing users and email
   confirmation ON. Existing authenticated accounts still need restrictive RLS.
   No automatic invitations, account deletions or password resets.
2. Retain anonymous sign-ins OFF and manual linking OFF unless a reviewed product
   need changes that decision. Current owner/platform-authorized onboarding RPCs
   remain the only pharmacy/membership path; public signup confers neither role.
3. Owner supplies exact trusted sign-in/recovery origin and callback URLs; the
   current localhost:3000/empty redirect configuration is not a verified recovery
   setup. Avoid broad wildcards; no public preview is authorized by this request.
4. Privately review session lifetime, inactivity/single-session policies, SMTP
   delivery/limits, recovery flow, dashboard/operator MFA and app AAL enforcement.
   Requiring MFA can lock out operators and needs an enrollment/recovery rollout.
   Do not enable paid email/MFA providers or assume Free features are available.
5. App currently supports password sign-in but lacks a complete validated recovery
   UI. Do not call recovery operationally ready. Prepare and test that flow using
   only approved fictional accounts in the separate test project before rollout.
6. Review shared-device browser token storage, sign-out/network failure, back
   navigation, offboarding and cached downloads. Local cache clearing is added;
   it does not revoke tokens on other devices or erase files. Session revocation,
   key rotation and any storage cleanup require explicit scope and approval.

Approve each actual setting value/URL, target and failure/recovery procedure
before changing it. No secrets, live account identifiers or recovery links belong
in this file. Clinical/retention owners approve the role matrix in the security
report independently of these Auth configuration decisions.
