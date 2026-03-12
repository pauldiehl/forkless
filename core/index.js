require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { chat } = require('../lib/llm');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

app.use(express.json());

// Static assets
app.use('/themes', express.static(path.join(__dirname, 'themes')));
app.use('/agent-layer', express.static(path.join(__dirname, 'agent-layer')));
app.use('/transaction-layer', express.static(path.join(__dirname, 'transaction-layer')));
app.use('/capabilities', express.static(path.join(ROOT, 'capabilities')));

// ========================================
// CAPABILITIES REGISTRY
// ========================================
app.get('/api/capabilities', (req, res) => {
  try {
    delete require.cache[require.resolve('../capabilities/registry.json')];
    const registry = require('../capabilities/registry.json');
    res.json(registry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/capabilities/:id', (req, res) => {
  try {
    delete require.cache[require.resolve('../capabilities/registry.json')];
    const registry = require('../capabilities/registry.json');
    const cap = registry.find(c => c.id === req.params.id);
    if (!cap) return res.status(404).json({ error: 'Capability not found' });
    res.json(cap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// CHAT API
// ========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const anthropicMessages = messages.map(m => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.text
    }));

    const response = await chat(anthropicMessages);
    res.json({ response });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Agent error', detail: err.message });
  }
});

// ========================================
// EXEC API (streaming process output)
// ========================================
let activeProcess = null;

app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  // Parse command into parts
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const cmd = parts[0];
  const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));

  // Stream response
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Transfer-Encoding', 'chunked');

  const proc = spawn(cmd, args, {
    cwd: ROOT,
    shell: true,
    env: { ...process.env }
  });

  activeProcess = proc;

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      res.write(JSON.stringify({ type: 'stdout', data: line }) + '\n');
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      res.write(JSON.stringify({ type: 'stderr', data: line }) + '\n');
    }
  });

  proc.on('close', (code) => {
    res.write(JSON.stringify({ type: 'exit', code: code || 0 }) + '\n');
    res.end();
    activeProcess = null;
  });

  proc.on('error', (err) => {
    res.write(JSON.stringify({ type: 'stderr', data: `Error: ${err.message}` }) + '\n');
    res.write(JSON.stringify({ type: 'exit', code: 1 }) + '\n');
    res.end();
    activeProcess = null;
  });
});

app.post('/api/exec/kill', (req, res) => {
  if (activeProcess) {
    activeProcess.kill('SIGTERM');
    activeProcess = null;
    res.json({ killed: true });
  } else {
    res.json({ killed: false, reason: 'No active process' });
  }
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shell.html'));
});

app.listen(PORT, () => {
  console.log(`Forkless running on http://localhost:${PORT}`);
});
