#!/usr/bin/env node

/*
 * Copyright (c) 2022 - Thoughtworks Inc. All rights reserved.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// externals
const semver = tryRequire('semver');

const WORKSPACE = path.dirname(path.dirname(__dirname));
const SOURCES = WORKSPACE;

const manifest = JSON.parse(fs.readFileSync(path.join(SOURCES, 'package.json')));

const FLAGS = ['--canary', '--optional', '-h', '--help'];

const opts = process.argv.slice(2).reduce((opts, arg) => {
  if (!FLAGS.includes(arg)) {
    usage(`Unknown argument/flag: ${arg}`);
  }

  if ('-h' === arg || '--help' === arg) {
    usage();
  }

  if ('--canary' === arg) {
    opts['canary'] = true;
  }

  if ('--optional' === arg) {
    opts['update-optional-dependencies'] = true;
  }

  return opts;
}, {});

const canary = !!opts.canary;

if (canary) {
  console.warn(
    `canary: ${canary};`,
    'This will perform any major version upgrades as well, even for exact-version package specs',
  );
}

function usage(msg = '') {
  msg = (msg || '').trim();
  const prog = path.basename(process.argv[1]);

  if (msg) {
    console.error(`[FATAL] ${msg}`);
  }

  console.error(`

  USAGE: ${prog} [ OPTIONS ]

  DESCRIPTION

    Updates npm dependencies to the latest versions (patch or major, depending on \`--canary\`). Tree-shakes package-lock.json by
    regenerating it from scratch.

  ARGUMENTS

    none

  OPTIONS

    -h, --help     Shows this help message.

    --canary       When specified, the script will update to the latest major versions. By default (i.e., without this flag), the
                   script only updates to the latest minor or patch version.

    --optional     When specified, the script will update also update the \`optionalDependencies\` block. This may not always be
                   desirable as we use this block to pre-download transitive optionalDependencies to satisfy builds for linux
                   agents in the build pipeline (currently, anyway), so upgrading these might break the build if the parent package
                   is not using the latest version.

`);

  process.exit(1);
}

function update(dict) {
  interestingKeys(dict).forEach((mod) => {
    const range = dict[mod];
    console.log(`Checking ${mod} -- current: ${range}`);

    // reverse sort to get the latest first
    const versions = JSON.parse(execSync(`npm view ${mod} versions --json`).toString()).reverse();
    const major = semver.major(range.replace(/^[^0-9]*/, ''));
    const latest = semver.maxSatisfying(versions, canary ? `>=${major}` : range);

    const detectModifier = range.match(/^([^0-9]+)/);
    const modifier = detectModifier ? detectModifier[1] : '';
    const upgraded = modifier + latest;

    if (range !== upgraded) {
      dict[mod] = upgraded;
      console.log('  => updating', mod, 'to', upgraded);
    }
  });
}

update(manifest.dependencies);
update(manifest.devDependencies);

if (opts['update-optional-dependencies']) {
  update(manifest.optionalDependencies);
}

fs.writeFileSync(path.join(SOURCES, 'package.json'), JSON.stringify(manifest, null, 2) + '\n', {
  encoding: 'utf8',
  mode: 0o644,
});

// deleting package-lock.json allows us to sort of "tree-shake" our deps by forcing yarn to rebuild
// the depgraph; sometimes newer versions of packages remove dependencies and a normal yarn
// update doesn't seem to prune those old deps from the lockfile.
fs.unlinkSync(path.join(SOURCES, 'package-lock.json'));
fs.rmSync(path.join(SOURCES, 'node_modules'), { force: true, recursive: true });

console.log('Updating package-lock.json');
execSync('npm install', { cwd: SOURCES });

function interestingKeys(dict) {
  return Object.keys(dict).filter((k) => excludes(dict, k));
}

function excludes(dict, key) {
  return !(
    dict[key].startsWith('file:') ||
    dict[key].startsWith('http:') ||
    dict[key].startsWith('https:')
  );
}

function tryRequire(name) {
  try {
    return require(name);
  } catch {
    console.error(
      `This script requires the package \`${name}\`; please \`cd ${path.relative(
        process.cwd(),
        __dirname,
      )} && npm install && cd -\` before running this script`,
    );
    process.exit(1);
  }
}
