const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'capabilities', 'registry.json');
const RUNNERS_DIR = path.join(ROOT, 'capabilities', 'runners');

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
}

function getCapability(id) {
  return loadRegistry().find(c => c.id === id) || null;
}

function listCapabilities() {
  return loadRegistry();
}

function registerCapability(cap) {
  const registry = loadRegistry();
  const existing = registry.findIndex(c => c.id === cap.id);
  if (existing !== -1) {
    registry[existing] = { ...registry[existing], ...cap };
  } else {
    registry.push(cap);
  }
  saveRegistry(registry);
  return cap;
}

// Create a runner script and register it
function createScript({ id, name, description, filename, code, args }) {
  if (!fs.existsSync(RUNNERS_DIR)) {
    fs.mkdirSync(RUNNERS_DIR, { recursive: true });
  }

  const scriptPath = path.join(RUNNERS_DIR, filename);
  fs.writeFileSync(scriptPath, code);

  const cap = {
    id,
    name,
    description,
    type: 'runner',
    path: `capabilities/runners/${filename}`,
    viewWith: 'execute-command',
    usage: {
      command: `node capabilities/runners/${filename}`,
      args: args || []
    }
  };

  registerCapability(cap);
  return cap;
}

module.exports = {
  loadRegistry,
  getCapability,
  listCapabilities,
  registerCapability,
  createScript
};
