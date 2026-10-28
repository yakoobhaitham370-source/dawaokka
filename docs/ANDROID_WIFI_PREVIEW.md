# Android preview over local Wi-Fi

Use the existing `dist/` output; no rebuild, public deployment, tunnel or paid hosting is needed. This is a temporary synthetic-data preview, not a clinical server. No certificate or firewall settings were changed during the readiness review.

## Why HTTPS matters here

`src/domain/clinical.ts` calls `crypto.randomUUID()` directly. That API requires a secure context. Loopback/localhost is considered trustworthy, but a phone opening a PC's ordinary LAN address over HTTP generally is not. Opening medication/dispensing forms can therefore fail on HTTP even though desktop localhost tests passed. This is a source/API compatibility finding; a physical Android phone has not yet been tested. [MDN randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), [secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts).

Do not use browser flags that treat insecure sites as secure, bypass certificate warnings, disable Defender/firewall, or enter account credentials into an untrusted HTTP preview.

## Functional Wi-Fi preview with trusted HTTPS

1. Put the Windows PC and Android test phone on the same trusted private Wi-Fi. Avoid a guest network with client isolation. Run `ipconfig` in your own Windows terminal and find the Wi-Fi adapter's IPv4 address, such as `192.168.1.23`. That example is not your detected address.
2. Arrange a trusted development certificate whose subject alternative names include that exact address. The free, open-source [mkcert project](https://github.com/FiloSottile/mkcert) documents Windows installation and mobile trust. Installing a development CA expands device trust: do this yourself only on your own test devices, and remove the test CA after the preview period. No CA was installed by Codex.
3. With mkcert installed by you, create the certificate locally. Keep keys in ignored `.local/`, never in Git or on the phone:

```powershell
Set-Location -LiteralPath 'C:\Users\yakoob\Documents\Codex\2026-10-27\additional-requirement-zero-cost-development-build-2\outputs\pharmacy-chronic-care-crm'
$lanAddress = '192.168.1.23' # Replace with the PC Wi-Fi IPv4 address.
New-Item -ItemType Directory -Path .local/certs -Force
mkcert -install
mkcert -cert-file .local/certs/lan-cert.pem -key-file .local/certs/lan-key.pem $lanAddress localhost 127.0.0.1
mkcert -CAROOT
```

4. The last command shows the development CA directory. Install only its public `rootCA.pem` certificate on your own Android test phone using Android's CA-certificate installation setting (wording varies by version/vendor; a `.crt` copy may be needed). **Never transfer `rootCA-key.pem` or the leaf private key.** The browser must trust the certificate normally; stop if it still shows a warning. [mkcert mobile instructions](https://github.com/FiloSottile/mkcert#mobile-devices).
5. In the same project terminal, start the included HTTPS preview:

```powershell
$env:CRM_PREVIEW_HOST = $lanAddress
$env:CRM_PREVIEW_CERT = (Resolve-Path -LiteralPath .local/certs/lan-cert.pem).Path
$env:CRM_PREVIEW_KEY = (Resolve-Path -LiteralPath .local/certs/lan-key.pem).Path
node node_modules/vite/bin/vite.js preview --config tests/tooling/lan-preview.config.ts --configLoader native
```

6. If Windows asks about inbound access, review that prompt yourself and allow only the needed private-network access for this temporary preview. Keep public-network access blocked. Do not create router port forwarding or expose port 4173 to the internet.
7. On Android Chrome, open `https://192.168.1.23:4173/demo`, replacing the address. Check that there is no certificate warning. Use fictional demo records only. Test navigation, a patient form, medication editor, Allergy Inbox, dispensing and the keyboard in both orientations. Every module remains in the horizontally scrollable navigation.
8. Stop the preview with Ctrl+C. Clear the three `CRM_PREVIEW_...` variables, remove the test CA from the phone when finished, and keep all private keys private. The preview configuration binds only the selected private IPv4 address and refuses a missing certificate. It does not build assets or change Supabase.

Vite's preview supports an explicit host, strict port and HTTPS configuration. [Vite preview options](https://vite.dev/config/preview-options.html). The selected port is fixed at 4173; if occupied, stop and inspect your own service instead of killing arbitrary processes.

## Quick visual-only HTTP inspection

If you have not arranged trusted HTTPS, you can inspect the dashboard/patient list visually using the existing assets:

```powershell
node node_modules/vite/bin/vite.js preview --host 192.168.1.23 --port 4173 --strictPort --configLoader native
```

Open `http://192.168.1.23:4173/demo`. This is **not a functional acceptance workaround**: secure-context APIs can fail, including on the dispensing route. Do not sign in or use actual patient data. For complete phone testing, use trusted HTTPS rather than weakening browser security.

No actual Android execution is claimed by desktop viewport emulation. Record Android version, Chrome version, orientation, text scaling, keyboard behavior, test date and any failures in the pilot checklist.
