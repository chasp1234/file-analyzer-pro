#!/usr/bin/env node

/**
 * Script di pubblicazione automatica per File Analyzer Pro
 * Supporta: GitHub, npm, Clawhub
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const REPO_NAME = PKG.name;

function info(msg) {
  console.log(`\x1b[36mℹ\x1b[0m ${msg}`);
}

function success(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

function warn(msg) {
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`);
}

function error(msg) {
  console.log(`\x1b[31m✗\x1b[0m ${msg}`);
}

function run(cmd, silent = false) {
  try {
    const out = execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', cwd: ROOT });
    return out ? out.toString() : '';
  } catch (e) {
    if (silent) {
      return null;
    }
    throw e;
  }
}

console.log('\n🚀 Pubblicazione skill: File Analyzer Pro\n');

// 1. Controlla git
try {
  run('git --version');
} catch {
  error('Git non installato');
  process.exit(1);
}

// 2. Init git se needed
if (!fs.existsSync(path.join(ROOT, '.git'))) {
  info('Inizializzazione repository Git...');
  run('git init');
  run('git add .');
  run('git commit -m "Initial commit"');
}

// 3. Chiedi URL GitHub
let remoteUrl = null;
try {
  remoteUrl = execSync('git config --get remote.origin.url', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch {}

if (!remoteUrl) {
  console.log('\n📦 Configura GitHub repository:');
  console.log('1. Crea un nuovo repo su https://github.com/new (nome suggerito: file-analyzer-pro)');
  console.log('2. Non inizializzare con README/.gitignore/licenza');
  console.log('3. Copia l\'URL SSH (es. git@github.com:tuo-utente/file-analyzer-pro.git)\n');
  remoteUrl = process.env.GIT_REMOTE || input('URL SSH del repo: ').trim();
  
  if (remoteUrl) {
    run(`git remote add origin ${remoteUrl}`);
  } else {
    warn('Nessun remote impostato. Skip push GitHub.');
  }
} else {
  info(`Remote GitHub esistente: ${remoteUrl}`);
}

// 4. Push
try {
  run('git branch -M main');
  run('git push -u origin main');
  success('Push su GitHub completato');
} catch (e) {
  error(`Push GitHub fallito: ${e.message}`);
}

// 5. npm publish (opzionale)
const doNpm = process.env.DO_NPM === 'true' || confirm('Pubblicare su npm? (y/n)');
if (doNpm) {
  info('Pubblicazione npm...');
  try {
    run('npm publish --access public');
    success('Pubblicato su npm');
  } catch (e) {
    error(`npm publish fallito: ${e.message}`);
  }
} else {
  warn('Skip npm publish');
}

// 6. Clawhub (opzionale)
const doClawhub = process.env.DO_CLAWHUB === 'true' || confirm('Pubblicare su Clawhub? (y/n)');
if (doClawhub) {
  try {
    // clawhub login (if not already)
    try {
      run('clawhub whoami', true);
    } catch {
      info('Login Clawhub richiesto');
      run('clawhub login');
    }
    run('clawhub publish .');
    success('Pubblicato su Clawhub');
  } catch (e) {
    error(`Clawhub publish fallito: ${e.message}`);
  }
} else {
  warn('Skip Clawhub publish');
}

console.log('\n✅ Pubblicazione completata!\n');
console.log('URL utili:');
console.log(`- GitHub: ${remoteUrl || 'https://github.com/tuo-utente/file-analyzer-pro'}`);
console.log('- NPM: https://www.npmjs.com/package/file-analyzer-pro');
console.log('- Clawhub: https://clawhub.com/skill/file-analyzer-pro');

function input(query) {
  process.stdout.write(query);
  return new Promise(resolve => {
    process.stdin.once('data', data => resolve(data.toString().trim()));
  });
}

function confirm(query) {
  const ans = input(`${query} `).toLowerCase();
  return ans === 'y' || ans === 'yes';
}