/**
 * Injects question batch 2 (q223–q302) into src/data/questions.ts.
 * Run once: node scripts/inject-batch2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bongoFlevaB } from './q-bongo-fleva-b.mjs';
import { simbaYangaB } from './q-simba-yanga-b.mjs';
import { mikoaB } from './q-mikoa-b.mjs';
import { historiaB } from './q-historia-b.mjs';
import { vyakulaB } from './q-vyakula-b.mjs';
import { methaliB } from './q-methali-b.mjs';
import { mitaaB } from './q-mitaa-b.mjs';
import { wanyamaB } from './q-wanyama-b.mjs';
import { biasharaB } from './q-biashara-b.mjs';
import { generalB } from './q-general-b.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/questions.ts');

// Anchor: the closing bracket of the questions array followed by the first export
const ANCHOR = `];

export const getQuestionsByCategory`;

let src = fs.readFileSync(file, 'utf8');

if (!src.includes(ANCHOR)) {
  console.error('Anchor not found — questions array closing bracket pattern changed.');
  process.exit(1);
}

const allNew = [
  ...bongoFlevaB,
  ...simbaYangaB,
  ...mikoaB,
  ...historiaB,
  ...vyakulaB,
  ...methaliB,
  ...mitaaB,
  ...wanyamaB,
  ...biasharaB,
  ...generalB,
];

// Check for ID conflicts with existing questions
const existingIds = new Set([...src.matchAll(/id: '(q\d+)'/g)].map((m) => m[1]));
const conflicts = allNew.filter((q) => existingIds.has(q.id));
if (conflicts.length > 0) {
  console.error('ID conflicts detected:', conflicts.map((q) => q.id).join(', '));
  process.exit(1);
}

// Serialize each question object to a formatted TS object literal
const serialize = (obj) => {
  const lines = ['  {'];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      const items = v.map((i) => `'${String(i).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(', ');
      lines.push(`    ${k}: [${items}],`);
    } else if (typeof v === 'string') {
      lines.push(`    ${k}: '${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`);
    } else if (typeof v === 'boolean') {
      lines.push(`    ${k}: ${v},`);
    } else {
      lines.push(`    ${k}: ${JSON.stringify(v)},`);
    }
  }
  lines.push('  },');
  return lines.join('\n');
};

const block = allNew.map(serialize).join('\n');
src = src.replace(ANCHOR, `\n${block}\n${ANCHOR}`);

fs.writeFileSync(file, src, 'utf8');
console.log(`Injected ${allNew.length} questions (q223–q302) successfully.`);
