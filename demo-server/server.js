const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const capturesDir = path.join(__dirname, 'captures');
if (!fs.existsSync(capturesDir)) {
  fs.mkdirSync(capturesDir);
}

app.post('/webhook', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `capture-${timestamp}.json`;
  const filepath = path.join(capturesDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(req.body, null, 2));
  
  console.log(`[${timestamp}] Ricevuto exfiltration da ${req.body.host}/${req.body.user}`);
  console.log(`File: ${req.body.data.length} file trovati, ${req.body.data.reduce((sum, d) => sum + d.suspiciousLines.length, 0)} righe esfiltrate`);
  
  res.status(200).send('ok');
});

app.get('/captures', (req, res) => {
  const files = fs.readdirSync(capturesDir).reverse();
  const summaries = files.map(file => {
    const content = fs.readFileSync(path.join(capturesDir, file), 'utf8');
    const data = JSON.parse(content);
    return {
      file,
      timestamp: data.timestamp,
      host: data.host,
      user: data.user,
      count: data.data.length,
      lines: data.data.reduce((sum, d) => sum + d.suspiciousLines.length, 0)
    };
  });
  res.json(summaries);
});

app.get('/captures/:filename', (req, res) => {
  const filepath = path.join(capturesDir, req.params.filename);
  if (fs.existsSync(filepath)) {
    const content = fs.readFileSync(filepath, 'utf8');
    res.json(JSON.parse(content));
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(3000, () => {
  console.log('Demo server in ascolto su http://localhost:3000');
  console.log('Endpoint webhook: http://localhost:3000/webhook');
  console.log('Visualizza catture: http://localhost:3000/captures');
});