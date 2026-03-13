const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTIFACTS_DIR = path.join(ROOT, 'artifacts');
const REGISTRY_PATH = path.join(ARTIFACTS_DIR, 'registry.json');

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(registry) {
  ensureDir(ARTIFACTS_DIR);
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
}

function getArtifact(id) {
  return loadRegistry().find(a => a.id === id) || null;
}

function listArtifacts(type) {
  const all = loadRegistry();
  return type ? all.filter(a => a.type === type) : all;
}

// Store an artifact: writes the file + registers metadata
function storeArtifact({ id, type, subdir, filename, content, metadata }) {
  const dir = path.join(ARTIFACTS_DIR, subdir || type || '');
  ensureDir(dir);

  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content);

  const relativePath = path.relative(ROOT, filePath);

  const entry = {
    id,
    type,
    path: relativePath,
    created: new Date().toISOString(),
    metadata: metadata || {}
  };

  const registry = loadRegistry();
  const existing = registry.findIndex(a => a.id === id);
  if (existing !== -1) {
    registry[existing] = { ...registry[existing], ...entry };
  } else {
    registry.push(entry);
  }
  saveRegistry(registry);

  return entry;
}

// Read artifact content from disk
function readArtifactContent(id) {
  const artifact = getArtifact(id);
  if (!artifact) return null;

  const filePath = path.join(ROOT, artifact.path);
  if (!fs.existsSync(filePath)) return null;

  return {
    ...artifact,
    content: fs.readFileSync(filePath, 'utf8')
  };
}

function removeArtifact(id) {
  const registry = loadRegistry();
  const artifact = registry.find(a => a.id === id);
  if (!artifact) return false;

  // Delete file
  const filePath = path.join(ROOT, artifact.path);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  // Remove from registry
  saveRegistry(registry.filter(a => a.id !== id));
  return true;
}

module.exports = {
  getArtifact,
  listArtifacts,
  storeArtifact,
  readArtifactContent,
  removeArtifact
};
