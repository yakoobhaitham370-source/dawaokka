import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRunEnvironment, TARGET } from './acceptance.mjs';

test('hosted runner refuses missing approval before any client is created', () => assert.throws(() => validateRunEnvironment({}), /approval/));
test('hosted runner refuses another target', () => assert.throws(() => validateRunEnvironment({ CRM_HOSTED_APPROVAL: 'synthetic-development-acceptance-approved', CRM_TEST_URL: 'https://unapproved.invalid' }), /Target/));
test('hosted runner requires migration confirmation', () => assert.throws(() => validateRunEnvironment({ CRM_HOSTED_APPROVAL: 'synthetic-development-acceptance-approved', CRM_TEST_URL: TARGET }), /migration/));
test('hosted runner rejects secret keys', () => assert.throws(() => validateRunEnvironment({ CRM_HOSTED_APPROVAL: 'synthetic-development-acceptance-approved', CRM_TEST_URL: TARGET, CRM_MIGRATION_005_CONFIRMED: 'yes', CRM_TEST_PUBLISHABLE_KEY: 'REJECT_THIS_PLACEHOLDER' }), /publishable/));

const approvedShape = { CRM_HOSTED_APPROVAL: 'synthetic-development-acceptance-approved', CRM_TEST_URL: TARGET, CRM_MIGRATION_005_CONFIRMED: 'yes', CRM_TEST_PUBLISHABLE_KEY: 'sb_publishable_EXAMPLE_NOT_A_REAL_KEY' };
test('hosted runner requires explicit test tenant identifiers', () => assert.throws(() => validateRunEnvironment(approvedShape), /UUID/));
test('hosted runner refuses the same tenant for both isolation actors', () => assert.throws(() => validateRunEnvironment({ ...approvedShape, CRM_TEST_TENANT_A: 'f1000000-0000-4000-8000-000000000001', CRM_TEST_TENANT_B: 'f1000000-0000-4000-8000-000000000001' }), /different/));
test('hosted runner requires private actor credentials after all target gates', () => assert.throws(() => validateRunEnvironment({ ...approvedShape, CRM_TEST_TENANT_A: 'f1000000-0000-4000-8000-000000000001', CRM_TEST_TENANT_B: 'f1000000-0000-4000-8000-000000000002' }), /private terminal credentials/));
