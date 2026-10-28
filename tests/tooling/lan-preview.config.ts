// Optional synthetic-only LAN preview of the existing dist/; never builds assets.
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const host = process.env.CRM_PREVIEW_HOST ?? '';
const octets = host.split('.').map(Number);
const valid = /^(\d{1,3}\.){3}\d{1,3}$/.test(host) && octets.length === 4 && octets.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
const privateAddress = valid && (octets[0] === 10 || octets[0] === 192 && octets[1] === 168 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31);
if (!privateAddress) throw new Error('Set CRM_PREVIEW_HOST to this PC\'s specific private LAN IPv4 address.');
const cert = process.env.CRM_PREVIEW_CERT, key = process.env.CRM_PREVIEW_KEY;
if (!cert || !key) throw new Error('Trusted development certificate/key paths are required; there is no insecure fallback.');

export default defineConfig({
  preview: {
    host, port: 4173, strictPort: true,
    https: { cert: readFileSync(cert), key: readFileSync(key) },
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  },
});
