const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve theme configs
app.use('/themes', express.static(path.join(__dirname, 'themes')));

// Serve static files from layer directories
app.use('/agent-layer', express.static(path.join(__dirname, 'agent-layer')));
app.use('/transaction-layer', express.static(path.join(__dirname, 'transaction-layer')));

// Main page serves the shell
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'shell.html'));
});

app.listen(PORT, () => {
  console.log(`Forkless running on http://localhost:${PORT}`);
});
