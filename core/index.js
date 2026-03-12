require('dotenv').config();
const express = require('express');
const path = require('path');
const { chat } = require('../lib/llm');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve theme configs
app.use('/themes', express.static(path.join(__dirname, 'themes')));

// Serve static files from layer directories
app.use('/agent-layer', express.static(path.join(__dirname, 'agent-layer')));
app.use('/transaction-layer', express.static(path.join(__dirname, 'transaction-layer')));

// Chat API — accepts conversation history, returns agent response
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Convert to Anthropic format
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

// Main page serves the shell
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shell.html'));
});

app.listen(PORT, () => {
  console.log(`Forkless running on http://localhost:${PORT}`);
});
