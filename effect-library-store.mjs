import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { validateLibrary } from './effect-library.mjs';

export async function readLibrary(root) {
  try { return validateLibrary(JSON.parse(await readFile(join(root, 'effect-library.json'), 'utf8'))); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
let pending = Promise.resolve();
export function saveLibrary(root, value, initialize = false) {
  const task = pending.then(async () => {
    const previous = await readLibrary(root);
    if (initialize && previous) return previous;
    validateLibrary(value, previous);
    const path = join(root, 'effect-library.json');
    await writeFile(`${path}.tmp`, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(`${path}.tmp`, path);
    return value;
  });
  pending = task.catch(() => {});
  return task;
}
