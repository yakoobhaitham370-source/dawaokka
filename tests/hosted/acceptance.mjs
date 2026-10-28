// Prepared hosted acceptance. Never runs on import or without explicit gates.
// Uses real Auth tokens and public API/RLS, never a service-role credential.
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomInt } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// Existing mixed/unverified project is protected from automated acceptance writes.
export const TARGET = 'https://qfnaubzpakbmtgxhqrhc.supabase.co';
export const ACTORS = ['A_OWNER', 'A_PHARMACIST', 'A_STAFF', 'B_OWNER', 'PLATFORM_ONLY'];
export const PLAN = [
  'Real Auth sign-in and user lookup for five distinct, human-provisioned test accounts',
  'Verify exact tenant memberships/roles and synthetic tenant-name guards before writes',
  'Anonymous denial and platform-owner absence of implicit clinical access',
  'Create/read/edit/archive/restore synthetic patients in two independent test pharmacies',
  'Cross-tenant SELECT/RPC denial; direct table update and audit-delete denial',
  'Synthetic catalog/medication/dispensing persistence, idempotency and refill dates',
  '005 null-field rejection, critical allergy review retention and pharmacist override denial',
  'Private Storage upload/read/delete, other-tenant and staff byte-access denial',
  'Require denied staff clinical/audit access under the separately approved 006 policy',
  'Archive only this run\'s synthetic patients and sign out only test-account sessions',
];

export function validateRunEnvironment(env) {
  if (env.CRM_HOSTED_APPROVAL !== 'synthetic-development-acceptance-approved') throw Error('Explicit hosted-test approval gate is missing.');
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(env.CRM_TEST_URL ?? '') || env.CRM_TEST_URL === TARGET || env.CRM_TEST_URL !== env.CRM_APPROVED_ISOLATED_TEST_URL || env.CRM_TEST_DATA_CLASSIFICATION !== 'synthetic-only') throw Error('Target must be an explicitly approved isolated synthetic-only project; the existing project is protected.');
  if (env.CRM_MIGRATION_005_CONFIRMED !== 'yes') throw Error('Confirm hosted migration 005 and its read-only preflight first.');
  if (env.CRM_SECURITY_006_CONFIRMED !== 'yes') throw Error('Confirm the separately approved security 006 policy first.');
  if (!env.CRM_TEST_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw Error('A publishable key is required; secret/service-role keys are forbidden.');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (![env.CRM_TEST_TENANT_A, env.CRM_TEST_TENANT_B].every(v => uuid.test(v ?? ''))) throw Error('Two dedicated test tenant UUIDs are required.');
  if (env.CRM_TEST_TENANT_A === env.CRM_TEST_TENANT_B) throw Error('Test pharmacies must be different.');
  for (const actor of ACTORS) {
    if (!env[`CRM_TEST_${actor}_EMAIL`] || !env[`CRM_TEST_${actor}_PASSWORD`]) throw Error(`Missing private terminal credentials for ${actor}.`);
  }
  return { url: env.CRM_TEST_URL, key: env.CRM_TEST_PUBLISHABLE_KEY, a: env.CRM_TEST_TENANT_A, b: env.CRM_TEST_TENANT_B };
}

export async function runAcceptance(env = process.env) {
  const config = validateRunEnvironment(env); // Must precede even client creation.
  const makeClient = () => createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const clients = Object.fromEntries(ACTORS.map(actor => [actor, makeClient()]));
  const anon = makeClient(), runId = randomUUID(), patients = [], uploads = [];
  const signedIn = new Set();
  let passed = 0, completed = false;
  const cleanupIssues = [];
  const observations = {};
  const assert = (condition, label) => { if (!condition) throw Error(label); passed++; console.log('PASS ' + label); };
  const call = (client, tenant, command) => client.rpc('execute_command', { p_pharmacy: tenant, p_command: command });
  const accepted = async (client, tenant, command, label) => {
    const result = await call(client, tenant, command);
    assert(!result.error && result.data?.ok === true, label);
    return result.data;
  };
  const refused = async (client, tenant, command, label) => {
    const result = await call(client, tenant, command);
    assert(result.data?.ok === false || ['42501', 'PGRST301'].includes(result.error?.code), label);
  };
  const readPatient = async (client, tenant, id) => client.from('patients').select('data').eq('pharmacy_id', tenant).eq('id', id).single();
  const today = new Date().toISOString().slice(0, 10);
  const patient = suffix => ({
    id: randomUUID(), name: `SYNTHETIC ACCEPTANCE ${runId.slice(0, 8)} ${suffix}`,
    phone: '+964770' + randomInt(1000000, 9999999), whatsapp: '', dob: '', gender: 'other', address: '', conditions: [], physician: '',
    notes: 'Software test only. Not a real person. Do not contact.', consent: false, preference: 'none', status: 'active',
    allergyStatus: 'unknown', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  try {
    const identities = new Set(),actorIds={};
    for (const actor of ACTORS) {
      const client = clients[actor];
      const login = await client.auth.signInWithPassword({ email: env[`CRM_TEST_${actor}_EMAIL`], password: env[`CRM_TEST_${actor}_PASSWORD`] });
      assert(!login.error && !!login.data.user, actor + ' real Auth sign-in');
      signedIn.add(actor);
      const identity = await client.auth.getUser();
      assert(!identity.error && identity.data.user?.id === login.data.user.id, actor + ' server-verified identity');
      identities.add(identity.data.user.id);
      actorIds[actor]=identity.data.user.id;
      const memberships = await client.from('pharmacy_memberships').select('pharmacy_id,role').eq('user_id', identity.data.user.id).eq('active', true);
      const expectedRole = actor === 'A_PHARMACIST' ? 'pharmacist' : actor === 'A_STAFF' ? 'staff' : 'owner';
      const expectedTenant = actor === 'B_OWNER' ? config.b : config.a;
      assert(!memberships.error && (actor === 'PLATFORM_ONLY' ? memberships.data.length === 0 : memberships.data.length === 1 && memberships.data[0].pharmacy_id === expectedTenant && memberships.data[0].role === expectedRole), actor + ' exact membership fixture');
      if (actor === 'PLATFORM_ONLY') {
        const owner = await client.from('platform_owners').select('user_id').eq('user_id', identity.data.user.id).single();
        assert(!owner.error && !!owner.data, 'Platform-only fixture has platform authority');
      }
    }
    assert(identities.size === ACTORS.length, 'Five distinct test identities');
    const a = clients.A_OWNER, b = clients.B_OWNER;
    for (const [client, tenant] of [[a, config.a], [b, config.b]]) {
      const pharmacy = await client.from('pharmacies').select('data').eq('id', tenant).single();
      assert(!pharmacy.error && pharmacy.data?.data?.name?.startsWith('SYNTHETIC ACCEPTANCE '), 'Dedicated synthetic tenant-name guard');
    }
    const anonymousRead = await anon.from('patients').select('id').limit(1);
    assert(anonymousRead.error?.code === '42501' || !anonymousRead.error && anonymousRead.data.length === 0, 'Anonymous clinical read denied');
    const platformRead = await clients.PLATFORM_ONLY.from('patients').select('id');
    assert(!platformRead.error && platformRead.data.length === 0, 'Platform authority grants no implicit clinical read');
    const pa = patient('A'), pb = patient('B');
    for (const [client, tenant, p] of [[a, config.a, pa], [b, config.b, pb]]) {
      await accepted(client, tenant, { type: 'savePatient', patient: p }, 'Create synthetic patient through RPC');
      patients.push({ client, tenant, id: p.id });
      const saved = await readPatient(client, tenant, p.id);
      assert(!saved.error && saved.data.data.name === p.name, 'Read persisted patient');
      await accepted(client, tenant, { type: 'savePatient', patient: { ...p, address: 'SYNTHETIC edited address' } }, 'Edit patient');
      assert((await readPatient(client, tenant, p.id)).data?.data.address === 'SYNTHETIC edited address', 'Read persisted patient edit');
      await accepted(client, tenant, { type: 'savePatient', patient: { ...p, status: 'archived' } }, 'Archive patient without deleting history');
      assert((await readPatient(client, tenant, p.id)).data?.data.status === 'archived', 'Read archived patient');
      await accepted(client, tenant, { type: 'savePatient', patient: p }, 'Restore synthetic patient');
    }
    for (const [client, tenant, id] of [[a, config.b, pb.id], [b, config.a, pa.id]]) {
      const crossRead = await client.from('patients').select('id').eq('pharmacy_id', tenant).eq('id', id);
      assert(!crossRead.error && crossRead.data.length === 0, 'Cross-pharmacy patient SELECT hidden');
      await refused(client, tenant, { type: 'savePatient', patient: { ...pa, id } }, 'Cross-pharmacy patient RPC rejected');
    }
    assert((await a.from('patients').update({ data: { ...pa, name: 'SYNTHETIC forbidden direct edit' } }).eq('pharmacy_id', config.a).eq('id', pa.id)).error?.code === '42501', 'Direct table UPDATE denied');
    assert((await a.from('audit_logs').delete().eq('pharmacy_id', config.a).eq('id', randomUUID())).error?.code === '42501', 'Client audit DELETE denied');
    await refused(clients.A_STAFF, config.a, { type: 'savePatient', patient: pa }, 'Staff clinical mutation rejected');
    const catalog = { id: randomUUID(), name: 'SYNTHETIC test object', generic: 'SYNTHETIC ingredient', brand: '', ingredient: 'synthetic-' + runId, strength: 'TEST unit', form: 'TEST object', route: '', drugClass: '' };
    await accepted(a, config.a, { type: 'saveCatalog', catalog }, 'Create synthetic medication preparation');
    const medication = { id: randomUUID(), patientId: pa.id, catalogId: catalog.id, dose: 1, frequency: 1, schedule: 'regular', customSchedule: '', timing: '', instructions: 'Software test only', quantity: 30, daysSupply: 30, startDate: today, refillDate: null, physician: '', price: 0, status: 'active', notes: '' };
    const crossCatalog = await b.from('medications_catalog').select('id').eq('id', catalog.id);
    assert(!crossCatalog.error && crossCatalog.data.length === 0, 'Other tenant cannot read private catalog preparation');
    await refused(b, config.b, { type: 'saveMedication', medication: { ...medication, id: randomUUID(), patientId: pb.id } }, 'Other tenant cannot prescribe from private preparation');
    await accepted(a, config.a, { type: 'saveMedication', medication }, 'Create synthetic patient medication');
    await accepted(a,config.a,{type:'saveMedication',medication:{...medication,notes:'SYNTHETIC edited prescription'}},'Edit synthetic medication');
    const editedMedication=await a.from('patient_medications').select('data').eq('pharmacy_id',config.a).eq('id',medication.id).single();
    assert(editedMedication.data?.data?.notes==='SYNTHETIC edited prescription','Read persisted medication edit');
    await accepted(a,config.a,{type:'saveMedication',medication:{...medication,status:'stopped'}},'Stop medication without deleting its history');
    await accepted(a,config.a,{type:'saveMedication',medication},'Reactivate synthetic prescription');
    const dispensing = { id: randomUUID(), patientId: pa.id, medicationId: medication.id, quantity: 30, dose: 1, frequency: 1, schedule: 'regular', timing: '', daysSupply: 30, date: today, refillDate: null, price: 0, alerts: [], acknowledged: true, overrideReason: '', staff: '', createdAt: new Date().toISOString() };
    await accepted(a, config.a, { type: 'dispense', dispensing }, 'Record synthetic dispensing');
    assert((await accepted(a, config.a, { type: 'dispense', dispensing }, 'Replay same dispensing UUID')).duplicate === true, 'Dispensing replay is idempotent');
    const stored = await a.from('dispensing_records').select('data').eq('pharmacy_id', config.a).eq('id', dispensing.id).single();
    const expected = new Date(today + 'T00:00:00Z'); expected.setUTCDate(expected.getUTCDate() + 30);
    assert(stored.data?.data.refillDate === expected.toISOString().slice(0, 10), 'Persisted 30-day refill date');
    const allergy = { id: randomUUID(), patientId: pa.id, substance: 'SYNTHETIC test ingredient', ingredient: catalog.ingredient, drugClass: '', reaction: 'SYNTHETIC critical test event', category: 'software-test', severity: 'critical', status: 'suspected', reactionDate: '', recordedAt: '', recordedBy: '', source: 'Synthetic fixture; not a clinical history', verification: 'unverified', notes: '' };
    await refused(a, config.a, { type: 'saveAllergy', allergy: { ...allergy, severity: null } }, '005 rejects explicit null severity');
    await accepted(a, config.a, { type: 'saveAllergy', allergy }, 'Create synthetic critical allergy');
    await refused(a, config.a, { type: 'dispense', dispensing: { ...dispensing, id: randomUUID() } }, 'Critical match blocks routine owner dispensing');
    await refused(clients.A_PHARMACIST, config.a, { type: 'dispense', dispensing: { ...dispensing, id: randomUUID(), overrideReason: 'Synthetic reason cannot grant pharmacist override authority' } }, 'Pharmacist cannot override critical match');
    const alert = await a.from('allergy_alerts').select('id').eq('pharmacy_id', config.a).eq('allergy_id', allergy.id).single();
    assert(!alert.error && !!alert.data, 'Allergy Inbox alert persists');
    await accepted(a, config.a, { type: 'reviewAlert', review: { id: randomUUID(), alertId: alert.data.id, action: 'resolved', assignedTo: 'Synthetic test owner', notes: 'Software test reviewed; source remains synthetic', by: '', createdAt: '' } }, 'Document Allergy Inbox resolution');
    const retained = await a.from('patient_allergies').select('id').eq('pharmacy_id', config.a).eq('id', allergy.id);
    assert(!retained.error && retained.data.length === 1, 'Inbox resolution retains allergy');
    const staffRead = await clients.A_STAFF.from('patient_allergies').select('id').eq('pharmacy_id', config.a).eq('id', allergy.id);
    assert(staffRead.error?.code === '42501' || !staffRead.error && staffRead.data.length===0, 'Staff detailed allergy access denied');
    observations.staffCanReadDetailedAllergyRow = !staffRead.error && staffRead.data.length > 0;
    const staffAudit=await clients.A_STAFF.from('audit_logs').select('id').eq('pharmacy_id',config.a);
    assert(staffAudit.error?.code==='42501'||!staffAudit.error&&staffAudit.data.length===0,'Staff audit payload access denied');
    const platformConditions=await clients.PLATFORM_ONLY.from('chronic_conditions').select('id');
    assert(!platformConditions.error&&platformConditions.data.length===0,'Unassigned account condition labels denied');
    const followup={id:randomUUID(),patientId:pa.id,dueDate:today,assignedTo:actorIds.A_STAFF,status:'scheduled',notes:'SYNTHETIC clinical detail excluded from staff projection',createdAt:new Date().toISOString()};
    await accepted(a,config.a,{type:'saveFollowup',followup},'Owner assigns synthetic staff task');
    const privateTask={...followup,id:randomUUID(),assignedTo:actorIds.A_PHARMACIST};
    await accepted(a,config.a,{type:'saveFollowup',followup:privateTask},'Owner assigns independent pharmacist task');
    const staffQueue=await clients.A_STAFF.rpc('staff_followup_queue',{p_pharmacy:config.a});
    assert(!staffQueue.error&&Array.isArray(staffQueue.data)&&staffQueue.data.some(t=>t.id===followup.id&&!t.phone&&!('notes' in t))&&!staffQueue.data.some(t=>t.id===privateTask.id),'Staff projection excludes unassigned task and clinical notes');
    const attempt={id:randomUUID(),followupId:followup.id,outcome:'rescheduled',notes:'SYNTHETIC only',createdAt:new Date().toISOString()};
    await accepted(clients.A_STAFF,config.a,{type:'logContact',attempt,nextDate:today},'Assigned staff reschedule accepted');
    await refused(clients.A_STAFF,config.a,{type:'logContact',attempt:{...attempt,id:randomUUID(),followupId:privateTask.id},nextDate:today},'Staff unassigned task mutation denied');
    await refused(clients.A_STAFF,config.a,{type:'logContact',attempt:{...attempt,id:randomUUID(),outcome:'contacted'}},'Staff contact without consent denied');
    const doc = { id: randomUUID(), patientId: pa.id, name: 'SYNTHETIC-' + runId + '.png', category: 'other', size: 68, mime: 'image/png', path: `${config.a}/${pa.id}/${randomUUID()}`, createdAt: new Date().toISOString() };
    const fixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII=', 'base64');
    doc.size = fixture.length;
    assert(!(await a.storage.from('patient-documents').upload(doc.path, fixture, { contentType: 'image/png', upsert: false })).error, 'Private synthetic file upload');
    uploads.push({ client: a, document: doc });
    await accepted(a, config.a, { type: 'saveDocument', document: doc }, 'Private document metadata');
    const ownFile = await a.storage.from('patient-documents').download(doc.path);
    assert(!ownFile.error && ownFile.data.size === fixture.length, 'Owner reads own private bytes');
    for (const deniedClient of [b, clients.A_STAFF, anon]) {
      const deniedFile = await deniedClient.storage.from('patient-documents').download(doc.path);
      assert([401, 403, 404].includes(Number(deniedFile.error?.statusCode ?? deniedFile.error?.status)), 'Unauthorized private file download denied');
    }
    assert(!(await a.storage.from('patient-documents').remove([doc.path])).error, 'Delete only this run\'s synthetic object');
    await accepted(a, config.a, { type: 'deleteDocument', documentId: doc.id }, 'Delete synthetic metadata through audited RPC');
    uploads.length = 0;
    completed = true;
  } catch (error) {
    console.error('FAIL ' + (error instanceof Error ? error.message : 'Hosted acceptance failed'));
    process.exitCode = 1;
  } finally {
    // Preserve clinical/audit history; never bulk-delete patients or test tenants.
    for (const { client, tenant, id } of patients) {
      try {
        const current = await readPatient(client, tenant, id);
        if (!current.data?.data?.name?.includes(runId.slice(0, 8))) throw Error('Fixture verification failed');
        const archived = await call(client, tenant, { type: 'savePatient', patient: { ...current.data.data, status: 'archived' }, duplicateAcknowledged: true });
        if (archived.error || !archived.data?.ok) throw Error('Archive failed');
      } catch { cleanupIssues.push('Review this run\'s synthetic patient archival.'); }
    }
    if (uploads.length) cleanupIssues.push('Synthetic file reconciliation required; no broad deletion attempted.');
    for (const actor of signedIn) {
      try { if ((await clients[actor].auth.signOut({ scope: 'local' })).error) cleanupIssues.push(actor + ' test-session sign-out needs review.'); }
      catch { cleanupIssues.push(actor + ' test-session sign-out needs review.'); }
    }
  }
  if (cleanupIssues.length) process.exitCode = 1;
  console.log(JSON.stringify({ status: completed && !cleanupIssues.length ? 'passed' : 'needs-review', assertions: passed, runId, observations, cleanupIssues, pilotPermissionReviewRequired: true }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--plan')) console.log(PLAN.map((step, i) => `${i + 1}. ${step}`).join('\n'));
  else if (process.argv.includes('--run')) await runAcceptance();
  else { console.log('Prepared only. Use --plan; --run requires target, approval, migration and private credential gates.'); }
}
