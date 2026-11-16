// ai-excited-01 entry: deliver the finished image to the grader's output dir.
//
// The artwork itself is the file entry.png beside this program, rendered
// during the build. This program's only job is to place an exact copy of
// those bytes at <output>/entry.png, then prove the copy is identical.
// Before copying it also validates the artwork: the gate refuses anything
// that is not a whole PNG within the size limit, so a corrupt or oversized
// source must fail loudly here instead of shipping silently.
// It uses the Node standard library only, never touches the network, and
// always produces the same bytes, so repeated runs agree byte for byte.

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, 'entry.png');

// The grader runs with a writable /output; locally MAKEFUN_OUTPUT_DIR
// stands in for it (see the README's Run it section).
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const TARGET = join(OUTPUT_DIR, 'entry.png');

function sha256Hex(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

// Fail fast on a missing, non-PNG, or oversized source.
const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const sourceBytes = readFileSync(SOURCE);
if (!sourceBytes.subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error('entry.png is not a PNG file');
}
if (sourceBytes.length > 1048576) {
  throw new Error(`entry.png is ${sourceBytes.length} bytes, over the 1048576 gate limit`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(SOURCE, TARGET);

const before = sha256Hex(SOURCE);
const after = sha256Hex(TARGET);
if (before !== after) {
  throw new Error(`entry.png copy mismatch: ${before} != ${after}`);
}
console.log(`wrote ${TARGET} (${readFileSync(TARGET).length} bytes, sha256 ${after})`);
