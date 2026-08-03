#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('smol-toml');

function parseTomlConfig(source, filename) {
  try {
    return parse(source);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${filename}: ${reason}`, { cause: error });
  }
}

function main() {
  const filename = path.resolve(__dirname, '../.pr_agent.toml');
  parseTomlConfig(fs.readFileSync(filename, 'utf8'), filename);
  console.log('[check-config] .pr_agent.toml OK');
}

module.exports = { parseTomlConfig };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[check-config] ${message}`);
    process.exitCode = 1;
  }
}
