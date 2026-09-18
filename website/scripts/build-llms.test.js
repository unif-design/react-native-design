'use strict';
require('./build-llms-core.test.js');
require('./build-llms-site.test.js');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildBundle } = require('./llms/bundle');
const output = buildBundle({ root: path.join(__dirname, '..') });
const entries = JSON.parse(output['md/index.json'].toString('utf8'));
for (const expected of [
  'md/components/overview.md',
  'md/design/intro.md',
  'md/UNIF-DESIGN.md',
]) {
  assert(entries.some((entry) => entry.mdPath === expected));
}
assert(!Object.hasOwn(output, 'md/components.md'));
assert(!Object.hasOwn(output, 'md/design.md'));
console.log('PASS Design canonical overview and component routes');
