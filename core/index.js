require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { chat } = require('../lib/llm');
const { listCapabilities, getCapability } = require('../lib/capabilities');
const { listArtifacts, readArtifactContent } = require('../lib/artifacts');

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
// CAPABILITIES
// ========================================
app.get('/api/capabilities', (req, res) => {
  res.json(listCapabilities());
});

app.get('/api/capabilities/:id', (req, res) => {
  const cap = getCapability(req.params.id);
  if (!cap) return res.status(404).json({ error: 'Not found' });
  res.json(cap);
});

// ========================================
// ARTIFACTS (for viewers to fetch content)
// ========================================
app.get('/api/artifacts', (req, res) => {
  res.json(listArtifacts(req.query.type));
});

app.get('/api/artifacts/:id', (req, res) => {
  const artifact = readArtifactContent(req.params.id);
  if (!artifact) return res.status(404).json({ error: 'Not found' });
  res.json(artifact);
});

// ========================================
// CHAT
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

    const result = await chat(anthropicMessages);
    res.json({
      response: result.text,
      actions: result.actions || []
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Agent error', detail: err.message });
  }
});

// ========================================
// EXEC (streaming process output)
// ========================================
let activeProcess = null;

app.post('/api/exec', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const cmd = parts[0];
  const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Transfer-Encoding', 'chunked');

  const proc = spawn(cmd, args, { cwd: ROOT, shell: true, env: { ...process.env } });
  activeProcess = proc;

  proc.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      res.write(JSON.stringify({ type: 'stdout', data: line }) + '\n');
    }
  });

  proc.stderr.on('data', (data) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      res.write(JSON.stringify({ type: 'stderr', data: line }) + '\n');
    }
  });

  proc.on('close', (code) => {
    res.write(JSON.stringify({ type: 'exit', code: code || 0 }) + '\n');
    res.end();
    activeProcess = null;
  });

  proc.on('error', (err) => {
    res.write(JSON.stringify({ type: 'stderr', data: err.message }) + '\n');
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
    res.json({ killed: false });
  }
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shell.html'));
});

app.listen(PORT, () => {
  console.log(`Forkless running on http://localhost:${PORT}`);
});
