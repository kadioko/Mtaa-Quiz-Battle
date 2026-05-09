/**
 * Injects all new question batches (q123-q222) into src/data/questions.ts.
 * Run once: node scripts/inject-questions.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bongoflevaQuestions } from './q-bongo-fleva.mjs';
import { simbaYangaQuestions } from './q-simba-yanga.mjs';
import { mikoaQuestions } from './q-mikoa.mjs';
import { historiaQuestions } from './q-historia.mjs';
import { vyakulaQuestions } from './q-vyakula.mjs';
import { methaliQuestions } from './q-methali.mjs';
import { mitaaQuestions } from './q-mitaa.mjs';
import { wanyamaQuestions } from './q-wanyama.mjs';
import { biasharaQuestions } from './q-biashara.mjs';
import { generalQuestions } from './q-general.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/questions.ts');

const ANCHOR = `];

export const getQuestionsByCategory`;

let src = fs.readFileSync(file, 'utf8');

if (!src.includes(ANCHOR)) {
  console.error('Anchor not found — already patched or file changed');
  process.exit(1);
}

const allNew = [
  ...bongoflevaQuestions,
  ...simbaYangaQuestions,
  ...mikoaQuestions,
  ...historiaQuestions,
  ...vyakulaQuestions,
  ...methaliQuestions,
  ...mitaaQuestions,
  ...wanyamaQuestions,
  ...biasharaQuestions,
  ...generalQuestions,
];

// Check for ID conflicts with existing questions
const existingIds = new Set([...src.matchAll(/id: '(q\d+)'/g)].map(m => m[1]));
const conflicts = allNew.filter(q => existingIds.has(q.id));
if (conflicts.length > 0) {
  console.error('ID conflicts:', conflicts.map(q => q.id).join(', '));
  process.exit(1);
}

// Serialize each question object to a formatted TS object literal
const serialize = (obj) => {
  const lines = ['  {'];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      const items = v.map(i => `'${String(i).replace(/'/g, "\\'")}'`).join(', ');
      lines.push(`    ${k}: [${items}],`);
    } else if (typeof v === 'string') {
      lines.push(`    ${k}: '${v.replace(/'/g, "\\'")}',`);
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
console.log(`Injected ${allNew.length} questions (q123-q222)`);
