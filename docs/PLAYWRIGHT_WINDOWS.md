# Windows Playwright diagnosis and safe execution

28 October 2026. Tests use isolated synthetic `/demo` contexts. No production database, deployment, security setting or account permission was changed.

## Confirmed cause

Codex's restricted execution context denies Node child-process creation when pipe/IPC handles are requested. The exact same saved diagnostic succeeds when run through approved execution outside that context. This is not a failure to execute the Node binary generally: inherited and ignored output work even inside the restricted context.

| Read-only diagnostic | Restricted Codex context | Approved outside context |
|---|---|---|
| `node.exe --version`, piped stdout/stderr | `spawn EPERM` | Exit 0 |
| Same executable, inherited output | Exit 0 | Exit 0 |
| Same executable, ignored output | Exit 0 | Exit 0 |
| Node `fork`, `['ignore','pipe','pipe','ipc']` | `spawn EPERM` | Exit 0 |

Playwright's first failed operation was `child_process.fork` from `WorkerHost.startRunner`, launching:

- Executable: `C:\Program Files\nodejs\node.exe`
- Worker script: `node_modules\playwright\lib\worker\workerProcessEntry.js`
- Standard I/O: `['ignore','pipe','pipe','ipc']`

It failed before running a test or starting a browser. A direct Playwright library launch inside the restricted context also failed while spawning `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` with its pipe transport. The direct launch outside that context succeeded and rendered Arabic RTL, with `chromiumSandbox: true`.

The installed Node is v24.21.0. `@playwright/test`, `playwright` and `playwright-core` are all 1.64.1; their local manifests require Node >=20. There is no installed bundled Chromium under the default Playwright cache. Existing Edge (Chromium engine 156.0.4314.50) supplies the browser. Chrome is also installed but was not needed. Nothing was downloaded or reinstalled.

No recent matching block/audit records were returned from the available Defender, AppLocker or Code Integrity logs during the diagnostic window. That observation alone does not prove antivirus can never interfere. The controlled inside/outside process comparison identifies the current blocker as the restricted execution boundary. No Defender exclusion, antivirus change, ACL change, execution-policy change or Windows security setting was used.

## Run from your own Windows terminal

Open a normal Windows Terminal/PowerShell window yourself, outside the Codex tool sandbox, using your usual account. Start here; an Administrator terminal is not required by this workflow.

```powershell
Set-Location -LiteralPath 'C:\Users\yakoob\Documents\Codex\2026-10-27\additional-requirement-zero-cost-development-build-2\outputs\pharmacy-chronic-care-crm'
node tests/tooling/process-smoke.cjs
node tests/tooling/browser-smoke.mjs
node node_modules/@playwright/test/cli.js test --config=tests/tooling/playwright.smoke.config.ts --workers=1
node node_modules/@playwright/test/cli.js test --workers=1 --reporter=line
```

These commands use the already installed dependencies and Edge. They avoid PowerShell's `npm.ps1` wrapper, so no script execution-policy workaround is needed. The full suite starts a loopback-only Vite server if port 5173 does not already serve this app. Keep that port available or stop your own unrelated service first; do not terminate arbitrary processes.

The first command should report four successful process probes. The second should print `directLaunch: true`. The third is one minimal browser test. The last runs the CRM suite. If the process probe fails in your own terminal too, retain its exact output and consult the machine's security logs/policies; do not disable protection or apply broad permission changes.

`npm.cmd run test:e2e` is an equivalent convenience command. Diagnostic scripts are also available as `npm.cmd run test:e2e:diagnose` and `npm.cmd run test:e2e:smoke`.

## Test tooling changes

- On Windows, the configuration selects installed `msedge`; other platforms keep Playwright's bundled Chromium default. `PLAYWRIGHT_EXECUTABLE_PATH` remains an explicit override, and `PLAYWRIGHT_BROWSER_CHANNEL` can select another already installed supported channel.
- One worker is retained. Setting one worker does not eliminate the worker subprocess, so that setting alone cannot fix pipe/IPC denial.
- Chromium sandboxing is explicitly enabled. Failure traces and screenshots are retained under ignored `test-results/`; successful runs do not retain traces.
- Previously unexecuted tests needed destination-heading and filter waits, and role-based combobox selectors. A list-card heading is not evidence that the patient profile finished navigation. Exact label text on a wrapping select can include option text; accessible combobox names avoid that mismatch.
- Coverage now includes actual patient editing/archive/restore, medication editing, persisted dispensing/refill dates and critical-match pharmacist blocking, alongside the original RTL/module and inbox checks. Application code is unchanged.

## Scope of browser verification

Final result: **16/16 CRM browser checks passed in 1.9 minutes**, using one worker outside the restricted execution context. The independent one-worker smoke test also passed (1/1), and the direct browser launch passed. The first unblocked full run exposed selector/timing failures in the previously unexecuted tests; the final run passed after correcting those tests. See `evidence/playwright-2026-10-28.log` for the final command output.

The main configuration has 16 checks: four scenarios at 320×900, 390×844, 768×1024 and 1440×1000. The scenarios cover all module routes, Arabic RTL/page overflow, demo network isolation, patient creation/edit/archive/restore, medication form order/focus/editing, allergy-history distinction, dispensing acknowledgement, 30-day refill calculation/history after reload, Allergy Inbox resolution retaining the original allergy, restricted staff actions and critical ingredient blocking for pharmacists.

These are Edge/Chromium viewport tests against synthetic data, not physical-device/Safari testing, hosted multi-account acceptance or clinical certification. Hosted migration 005 remains unapplied pending approval.

References: [Playwright worker processes](https://playwright.dev/docs/test-parallel), [supported browser channels](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge).
