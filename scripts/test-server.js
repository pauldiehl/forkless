const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', [path.join(__dirname, '..', 'core', 'index.js')], {
  stdio: 'inherit'
});

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  try {
    const main = await fetch('http://localhost:3000/');

    const checks = [
      ['Main page serves shell.html', main.status === 200 && main.body.includes('agent-layer')],
      ['All three modes present in HTML', main.body.includes('mode-collapsed') && main.body.includes('mode-minimal') && main.body.includes('mode-full')],
      ['Conversation UI elements present', main.body.includes('conversation-log') && main.body.includes('user-input') && main.body.includes('send-btn')],
      ['Mode switching buttons present', main.body.includes('btn-collapse') && main.body.includes('btn-minimal') && main.body.includes('btn-full')],
      ['Floating action button with pulse', main.body.includes('agent-fab') && main.body.includes('fab-pulse')],
      ['Local canned responses present', main.body.includes('cannedResponses')],
      ['Smooth CSS transitions configured', main.body.includes('cubic-bezier') && main.body.includes('transition')],
    ];

    const tl = await fetch('http://localhost:3000/transaction-layer/index.html');
    checks.push(['Transaction Layer placeholder loads', tl.status === 200 && tl.body.includes('tl-landing')]);

    for (const [name, result] of checks) {
      if (result) {
        console.log('PASS:', name);
        passed++;
      } else {
        console.log('FAIL:', name);
        failed++;
      }
    }

    console.log(`\n${passed}/${passed + failed} tests passed`);
  } catch (err) {
    console.error('Test error:', err.message);
    failed = 1;
  }

  server.kill();
  process.exit(failed > 0 ? 1 : 0);
}

// Give server time to start, then run tests
setTimeout(runTests, 2000);

setTimeout(() => {
  console.error('TIMEOUT');
  server.kill();
  process.exit(1);
}, 10000);
