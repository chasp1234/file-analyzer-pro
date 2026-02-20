const { analyzeFile, analyzeDirectory, parseLogs } = require('../index');

async function runTests() {
  console.log('Test di File Analyzer Pro');
  
  try {
    const result = await analyzeFile('package.json');
    console.log('Test file:', result);
    
    const dirResult = await analyzeDirectory('.');
    console.log('Test directory:', dirResult);
    
    const logsResult = await parseLogs('.');
    console.log('Test logs:', logsResult);
  } catch (err) {
    console.error('Test fallito:', err.message);
  }
}

if (require.main === module) {
  runTests();
}