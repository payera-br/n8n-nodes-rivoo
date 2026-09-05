import { cp, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// Copies node icons and codex metadata into dist, mirroring the source layout.
// Kept dependency-free: verified community nodes must not ship runtime dependencies.
const NODES_DIR = 'nodes';
const OUT_DIR = join('dist', 'nodes');

const entries = await readdir(NODES_DIR, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const files = await readdir(join(NODES_DIR, entry.name));
  for (const file of files) {
    if (!file.endsWith('.svg') && !file.endsWith('.png') && !file.endsWith('.json')) continue;
    await cp(join(NODES_DIR, entry.name, file), join(OUT_DIR, entry.name, file));
  }
}
