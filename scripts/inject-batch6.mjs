/**
 * inject-batch6.mjs — appends q503-q602 (10 per category) to questions.ts
 * Run: node scripts/inject-batch6.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { batch6 } from './q-batch6-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = join(__dirname, '../src/data/questions.ts');

const esc = (s) => (s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const renderQ = (q) => {
  const opts   = q.options.map((o) => `'${esc(o)}'`).join(', ');
  const optsEn = (q.options_en || []).map((o) => `'${esc(o)}'`).join(', ');
  return `  {
    id: '${q.id}',
    category: '${esc(q.category)}',
    difficulty: '${q.difficulty}',
    question: '${esc(q.question)}',
    options: [${opts}],
    answer: '${esc(q.answer)}',
    question_en: '${esc(q.question_en || '')}',
    options_en: [${optsEn}],
    answer_en: '${esc(q.answer_en || '')}',
    explanation: '${esc(q.explanation || '')}',
    explanation_en: '${esc(q.explanation_en || '')}',
  },`;
};

const MARKER = '];\n\nexport const getQuestionsByCategory';
const src = readFileSync(TARGET, 'utf8');
if (!src.includes(MARKER)) {
  console.error('ERROR: injection marker not found in questions.ts');
  process.exit(1);
}

const block = batch6.map(renderQ).join('\n');
const updated = src.replace(MARKER, `${block}\n];\n\nexport const getQuestionsByCategory`);
writeFileSync(TARGET, updated, 'utf8');

const before = (src.match(/id: 'q\d+'/g) || []).length;
const after  = (updated.match(/id: 'q\d+'/g) || []).length;
console.log(`✅ Injected ${after - before} questions (${before} → ${after} total)`);
