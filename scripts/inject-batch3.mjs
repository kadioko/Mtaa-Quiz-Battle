/**
 * Injects question batch 3 (q303–q382) into src/data/questions.ts.
 * Run once: node scripts/inject-batch3.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bongoFlevaC } from './q-bongo-fleva-c.mjs';
import { simbaYangaC } from './q-simba-yanga-c.mjs';
import { mikoaC } from './q-mikoa-c.mjs';
import { historiaC } from './q-historia-c.mjs';
import { vyakulaC } from './q-vyakula-c.mjs';
import { methaliC } from './q-methali-c.mjs';
import { mitaaC } from './q-mitaa-c.mjs';
import { wanyamaC } from './q-wanyama-c.mjs';
import { biasharaC } from './q-biashara-c.mjs';
import { generalC } from './q-general-c.mjs';

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
  ...bongoFlevaC,
  ...simbaYangaC,
  ...mikoaC,
  ...historiaC,
  ...vyakulaC,
  ...methaliC,
  ...mitaaC,
  ...wanyamaC,
  ...biasharaC,
  ...generalC,
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
console.log(`Injected ${allNew.length} questions (q303–q382) successfully.`);
