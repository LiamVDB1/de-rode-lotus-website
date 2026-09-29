#!/usr/bin/env node
/**
 * Stelt het beheerderswachtwoord in zonder dat het ergens in platte tekst belandt.
 *
 *   npm run admin:password               → productie (derodelotus.com)
 *   npm run admin:password -- --staging  → staging-worker
 *   npm run admin:password -- --print    → toont enkel de hash (bv. voor .dev.vars)
 *
 * Het wachtwoord wordt lokaal gehasht (PBKDF2-SHA256) en enkel de hash gaat naar Cloudflare.
 * Bestaat SESSION_SECRET nog niet, voeg dan `--session` toe om er meteen één aan te maken.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

// Workers staat maximaal 100 000 iteraties toe voor PBKDF2.
const ITERATIONS = 100_000;
const args = new Set(process.argv.slice(2));
const envArgs = args.has('--staging') ? ['--env', 'staging'] : [];

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Typen niet tonen.
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

export function hashPassword(password, salt = randomBytes(16)) {
  const hash = pbkdf2Sync(password.normalize('NFKC'), salt, ITERATIONS, 32, 'sha256');
  return `pbkdf2-sha256$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function putSecret(name, value) {
  const result = spawnSync('npx', ['wrangler', 'secret', 'put', name, ...envArgs], { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
  if (result.status !== 0) {
    console.error(`\nKon ${name} niet instellen (wrangler gaf code ${result.status}).`);
    process.exit(1);
  }
}

const password = await ask('Nieuw wachtwoord (min. 12 tekens): ');
if (password.length < 12) {
  console.error('Te kort: kies minstens 12 tekens.');
  process.exit(1);
}
if ((await ask('Herhaal het wachtwoord: ')) !== password) {
  console.error('De wachtwoorden verschillen.');
  process.exit(1);
}

const hash = hashPassword(password);
if (args.has('--print')) {
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  process.exit(0);
}

putSecret('ADMIN_PASSWORD_HASH', hash);
if (args.has('--session')) putSecret('SESSION_SECRET', randomBytes(48).toString('base64url'));
console.log(`\nKlaar. Iedereen die ingelogd was, moet opnieuw inloggen${envArgs.length ? ' (staging)' : ''}.`);
