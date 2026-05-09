/**
 * Injects question batch 5 (q463–q502) into src/data/questions.ts.
 * Run once: node scripts/inject-batch5.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bongoFlevaE } from './q-bongo-fleva-e.mjs';
import { simbaYangaE } from './q-simba-yanga-e.mjs';
import { mikoaE } from './q-mikoa-e.mjs';
import { historiaE } from './q-historia-e.mjs';
import { vyakulaE } from './q-vyakula-e.mjs';
import { methaliE } from './q-methali-e.mjs';
import { mitaaE } from './q-mitaa-e.mjs';
import { wanyamaE } from './q-wanyama-e.mjs';
import { biasharaE } from './q-biashara-e.mjs';
import { generalE } from './q-general-e.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/questions.ts');

const ANCHOR = `];

export const getQuestionsByCategory`;

let src = fs.readFileSync(file, 'utf8');

if (!src.includes(ANCHOR)) {
  console.error('Anchor not found — questions array closing bracket pattern changed.');
  process.exit(1);
}

const allNew = [
  ...bongoFlevaE,
  ...simbaYangaE,
  ...mikoaE,
  ...historiaE,
  ...vyakulaE,
  ...methaliE,
  ...mitaaE,
  ...wanyamaE,
  ...biasharaE,
  ...generalE,
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
console.log(`Injected ${allNew.length} questions (q463–q502) successfully.`);
