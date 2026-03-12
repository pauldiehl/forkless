const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'capabilities', 'registry.json');
const SCRIPTS_DIR = path.join(ROOT, 'capabilities', 'scripts');

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

function removeCapability(id) {
  const registry = loadRegistry();
  const filtered = registry.filter(c => c.id !== id);
  if (filtered.length === registry.length) return false;
  saveRegistry(filtered);
  return true;
}

// Write a script file and register it as a capability
function createScript({ id, name, description, useCase, filename, code, args }) {
  // Ensure scripts dir exists
  if (!fs.existsSync(SCRIPTS_DIR)) {
    fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  }

  const scriptPath = path.join(SCRIPTS_DIR, filename);
  fs.writeFileSync(scriptPath, code);

  const cap = {
    id,
    name,
    description,
    useCase: useCase || description,
    type: 'script',
    inline: false,
    path: `capabilities/scripts/${filename}`,
    usage: {
      command: `node capabilities/scripts/${filename}`,
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
  removeCapability,
  createScript
};
