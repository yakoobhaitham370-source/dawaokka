// Local, read-only audit. Findings contain locations/rule IDs, never matched values.
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const refs = git(['rev-list', '--objects', '--all']).trim().split('\n');
const paths = new Map(refs.map(line => {
  const space = line.indexOf(' ');
  return [space < 0 ? line : line.slice(0, space), space < 0 ? '' : line.slice(space + 1)];
}));
for (const line of git(['ls-files', '--stage']).trim().split('\n')) {
  const [metadata, path] = line.split('\t');
  if (path) paths.set(metadata.split(' ')[1], path);
}
const batch = spawnSync('git', ['cat-file', '--batch'], {
  input: [...paths.keys()].join('\n') + '\n', maxBuffer: 64 * 1024 * 1024,
});
if (batch.error || batch.status !== 0) throw new Error('Git object read failed; run this diagnostic in your own terminal.');
const findings = [];
let offset = 0, textBlobs = 0, binaryBlobs = 0;
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['provider-secret', /\b(?:sb_secret_[A-Za-z0-9_-]{15,}|sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{25,})\b/g],
  ['aws-access-id', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['database-password-url', /postgres(?:ql)?:\/\/[^\s:"']+:[^\s@"']{6,}@/g],
  ['literal-credential', /\b(?:password|access_token|refresh_token|client_secret|service_role_key|api_key)\b["']?\s*[:=]\s*["'][^"'\n]{8,}["']/gi],
];
while (offset < batch.stdout.length) {
  const end = batch.stdout.indexOf(10, offset);
  if (end < 0) break;
  const [sha, type, length] = batch.stdout.subarray(offset, end).toString().split(' ');
  const size = Number(length);
  if (!Number.isSafeInteger(size)) throw new Error('Unexpected Git object header.');
  const bytes = batch.stdout.subarray(end + 1, end + 1 + size);
  offset = end + 1 + size + 1;
  if (type !== 'blob') continue;
  const path = paths.get(sha) || '(historical blob)';
  if (/(?:^|\/)(?:\.env(?:\.(?!example$)[^/]+)?|id_rsa|id_ed25519|credentials\.json|[^/]+\.p12)$/.test(path)) {
    findings.push({ rule: 'sensitive-file-path', path, blob: sha });
  }
  if (bytes.includes(0)) { binaryBlobs++; continue; }
  textBlobs++;
  const text = bytes.toString('utf8');
  for (const [rule, regex] of rules) {
    for (const match of text.matchAll(regex)) {
      findings.push({ rule, path, blob: sha, line: text.slice(0, match.index).split('\n').length });
    }
  }
  for (const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g)) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString());
      if (payload.role === 'service_role' || payload.sub || payload.email) {
        findings.push({ rule: 'privileged-or-user-jwt', path, blob: sha, line: text.slice(0, match.index).split('\n').length });
      }
    } catch { /* Not a decodable JWT. */ }
  }
}
const report = {
  scope: 'all locally reachable Git objects/refs plus the staged tracked files',
  head: git(['rev-parse', 'HEAD']).trim(),
  textBlobs, binaryBlobs, findings,
  limitation: 'Pattern scan is not proof of absence. Synthetic fixture provenance and screenshots require human review.',
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
if (findings.length) process.exitCode = 1;
