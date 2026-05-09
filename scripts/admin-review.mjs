#!/usr/bin/env node
/**
 * Admin Review Tool — Mtaa Quiz Battle
 *
 * Usage:
 *   node scripts/admin-review.mjs                  # interactive menu
 *   node scripts/admin-review.mjs --category "Bongo Fleva"
 *   node scripts/admin-review.mjs --stale           # show time-sensitive questions past reviewAfter
 *   node scripts/admin-review.mjs --difficulty hard # filter by difficulty
 *   node scripts/admin-review.mjs --missing-en      # questions missing English fields
 *   node scripts/admin-review.mjs --stats           # per-category question count breakdown
 *   node scripts/admin-review.mjs --export          # export full question bank as JSON
 *   node scripts/admin-review.mjs --find <term>     # search question text (SW or EN)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const questionsFile = path.join(root, 'src/data/questions.ts');

// ── Parse questions from questions.ts ────────────────────────────────────────
function loadQuestions() {
  const src = fs.readFileSync(questionsFile, 'utf8');
  const matches = [...src.matchAll(/\{\s*id:\s*'(q\d+)'[\s\S]*?\},(?=\s*\{|\s*\];)/g)];
  const questions = [];

  for (const match of matches) {
    const block = match[0];
    const get = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
      return m ? m[1].replace(/\\'/g, "'") : undefined;
    };
    const getArr = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`));
      if (!m) return [];
      return m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '').replace(/\\'/g, "'"));
    };
    const getBool = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*(true|false)`));
      return m ? m[1] === 'true' : undefined;
    };

    questions.push({
      id: get('id'),
      category: get('category'),
      question: get('question'),
      question_en: get('question_en'),
      options: getArr('options'),
      options_en: getArr('options_en'),
      answer: get('answer'),
      answer_en: get('answer_en'),
      explanation: get('explanation'),
      explanation_en: get('explanation_en'),
      difficulty: get('difficulty'),
      sourceNote: get('sourceNote'),
      sourceUrl: get('sourceUrl'),
      timeSensitive: getBool('timeSensitive'),
      reviewAfter: get('reviewAfter'),
      reviewReason: get('reviewReason'),
    });
  }

  return questions;
}

// ── Formatters ────────────────────────────────────────────────────────────────
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

function printQuestion(q, index, total) {
  const diffColor = q.difficulty === 'easy' ? GREEN : q.difficulty === 'medium' ? YELLOW : RED;
  console.log(`\n${BOLD}${CYAN}[${index + 1}/${total}] ${q.id}${RESET} ${DIM}(${q.category})${RESET}`);
  console.log(`  ${BOLD}Difficulty:${RESET} ${diffColor}${q.difficulty}${RESET}`);
  console.log(`  ${BOLD}SW:${RESET} ${q.question}`);
  if (q.question_en) console.log(`  ${BOLD}EN:${RESET} ${q.question_en}`);
  console.log(`  ${BOLD}Options:${RESET} ${q.options.join(' | ')}`);
  console.log(`  ${BOLD}Answer:${RESET} ${GREEN}${q.answer}${RESET}`);
  if (q.explanation) console.log(`  ${BOLD}Explanation:${RESET} ${DIM}${q.explanation}${RESET}`);
  if (q.timeSensitive) {
    const stale = q.reviewAfter && new Date(q.reviewAfter) < new Date();
    console.log(`  ${BOLD}Time-Sensitive:${RESET} ${stale ? RED + '⚠ STALE — ' + q.reviewAfter + RESET : YELLOW + '✓ Review by ' + q.reviewAfter + RESET}`);
    if (q.reviewReason) console.log(`  ${BOLD}Review reason:${RESET} ${DIM}${q.reviewReason}${RESET}`);
  }
  if (q.sourceNote) console.log(`  ${BOLD}Source:${RESET} ${DIM}${q.sourceNote} ${q.sourceUrl ? '(' + q.sourceUrl + ')' : ''}${RESET}`);
}

function printStats(questions) {
  const byCategory = {};
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  let timeSensitiveCount = 0;
  let staleCount = 0;
  let missingEnCount = 0;

  for (const q of questions) {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    if (q.difficulty) byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    if (q.timeSensitive) {
      timeSensitiveCount++;
      if (q.reviewAfter && new Date(q.reviewAfter) < new Date()) staleCount++;
    }
    if (!q.question_en || !q.answer_en || !q.explanation_en) missingEnCount++;
  }

  console.log(`\n${BOLD}${CYAN}=== Question Bank Statistics ===${RESET}`);
  console.log(`${BOLD}Total questions:${RESET} ${GREEN}${questions.length}${RESET}`);
  console.log(`\n${BOLD}By Category:${RESET}`);

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sorted) {
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`  ${cat.padEnd(28)} ${String(count).padStart(3)} ${DIM}${bar}${RESET}`);
  }

  console.log(`\n${BOLD}By Difficulty:${RESET}`);
  console.log(`  ${GREEN}Easy:${RESET}   ${byDifficulty.easy}`);
  console.log(`  ${YELLOW}Medium:${RESET} ${byDifficulty.medium}`);
  console.log(`  ${RED}Hard:${RESET}   ${byDifficulty.hard}`);

  console.log(`\n${BOLD}Quality flags:${RESET}`);
  console.log(`  Time-sensitive: ${timeSensitiveCount}`);
  if (staleCount > 0) console.log(`  ${RED}⚠ Stale (past reviewAfter): ${staleCount}${RESET}`);
  if (missingEnCount > 0) console.log(`  ${YELLOW}⚠ Missing English fields: ${missingEnCount}${RESET}`);
}

// ── CLI argument handling ─────────────────────────────────────────────────────
const args = process.argv.slice(2);

async function main() {
  const questions = loadQuestions();

  if (args.includes('--stats')) {
    printStats(questions);
    return;
  }

  if (args.includes('--export')) {
    const outPath = path.join(root, 'scripts', 'question-bank-export.json');
    fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`${GREEN}Exported ${questions.length} questions to scripts/question-bank-export.json${RESET}`);
    return;
  }

  if (args.includes('--stale')) {
    const today = new Date();
    const stale = questions.filter((q) => q.timeSensitive && q.reviewAfter && new Date(q.reviewAfter) < today);
    if (stale.length === 0) {
      console.log(`${GREEN}No stale time-sensitive questions. All up to date!${RESET}`);
      return;
    }
    console.log(`${RED}${BOLD}${stale.length} stale question(s) need review:${RESET}`);
    stale.forEach((q, i) => printQuestion(q, i, stale.length));
    return;
  }

  if (args.includes('--missing-en')) {
    const missing = questions.filter(
      (q) => !q.question_en || !q.answer_en || !q.options_en?.length || !q.explanation_en
    );
    if (missing.length === 0) {
      console.log(`${GREEN}All questions have full English translations.${RESET}`);
      return;
    }
    console.log(`${YELLOW}${BOLD}${missing.length} question(s) missing English fields:${RESET}`);
    missing.forEach((q, i) => printQuestion(q, i, missing.length));
    return;
  }

  const findIdx = args.indexOf('--find');
  if (findIdx !== -1) {
    const term = (args[findIdx + 1] ?? '').toLowerCase();
    if (!term) { console.log('Usage: --find <search term>'); return; }
    const found = questions.filter(
      (q) =>
        (q.question ?? '').toLowerCase().includes(term) ||
        (q.question_en ?? '').toLowerCase().includes(term) ||
        (q.answer ?? '').toLowerCase().includes(term) ||
        (q.explanation ?? '').toLowerCase().includes(term)
    );
    console.log(`${CYAN}Found ${found.length} result(s) for "${term}":${RESET}`);
    found.forEach((q, i) => printQuestion(q, i, found.length));
    return;
  }

  const diffIdx = args.indexOf('--difficulty');
  const catIdx = args.indexOf('--category');

  let filtered = questions;
  if (diffIdx !== -1) {
    const diff = args[diffIdx + 1];
    filtered = filtered.filter((q) => q.difficulty === diff);
    console.log(`${CYAN}Filtering by difficulty: ${diff} (${filtered.length} questions)${RESET}`);
  }
  if (catIdx !== -1) {
    const cat = args[catIdx + 1];
    filtered = filtered.filter((q) => q.category.toLowerCase().includes(cat.toLowerCase()));
    console.log(`${CYAN}Filtering by category: "${cat}" (${filtered.length} questions)${RESET}`);
  }

  if (args.length > 0 && (diffIdx !== -1 || catIdx !== -1)) {
    filtered.forEach((q, i) => printQuestion(q, i, filtered.length));
    return;
  }

  // Interactive menu
  printStats(questions);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const prompt = (msg) => new Promise((res) => rl.question(msg, res));

  console.log(`\n${BOLD}${CYAN}=== Admin Review Menu ===${RESET}`);
  console.log(`  ${BOLD}1${RESET} Browse all questions`);
  console.log(`  ${BOLD}2${RESET} Browse by category`);
  console.log(`  ${BOLD}3${RESET} Browse by difficulty`);
  console.log(`  ${BOLD}4${RESET} Show stale time-sensitive questions`);
  console.log(`  ${BOLD}5${RESET} Show questions missing English translations`);
  console.log(`  ${BOLD}6${RESET} Search by keyword`);
  console.log(`  ${BOLD}7${RESET} Export JSON`);
  console.log(`  ${BOLD}q${RESET} Quit`);

  const choice = await prompt('\nChoose option: ');

  if (choice === '1') {
    for (let i = 0; i < questions.length; i++) {
      printQuestion(questions[i], i, questions.length);
      if ((i + 1) % 5 === 0 && i + 1 < questions.length) {
        const cont = await prompt(`\n${DIM}-- Press Enter for next 5, or q to quit --${RESET} `);
        if (cont.toLowerCase() === 'q') break;
      }
    }
  } else if (choice === '2') {
    const cats = [...new Set(questions.map((q) => q.category))].sort();
    cats.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
    const pick = await prompt('Choose category number: ');
    const cat = cats[parseInt(pick) - 1];
    if (cat) {
      const subset = questions.filter((q) => q.category === cat);
      subset.forEach((q, i) => printQuestion(q, i, subset.length));
    }
  } else if (choice === '3') {
    const diff = await prompt('Difficulty (easy/medium/hard): ');
    const subset = questions.filter((q) => q.difficulty === diff.trim());
    console.log(`${CYAN}${subset.length} ${diff} question(s):${RESET}`);
    subset.forEach((q, i) => printQuestion(q, i, subset.length));
  } else if (choice === '4') {
    const today = new Date();
    const stale = questions.filter((q) => q.timeSensitive && q.reviewAfter && new Date(q.reviewAfter) < today);
    if (stale.length === 0) console.log(`${GREEN}No stale questions!${RESET}`);
    else stale.forEach((q, i) => printQuestion(q, i, stale.length));
  } else if (choice === '5') {
    const missing = questions.filter((q) => !q.question_en || !q.answer_en || !q.explanation_en);
    if (missing.length === 0) console.log(`${GREEN}All questions fully translated!${RESET}`);
    else missing.forEach((q, i) => printQuestion(q, i, missing.length));
  } else if (choice === '6') {
    const term = (await prompt('Search term: ')).toLowerCase();
    const found = questions.filter(
      (q) =>
        (q.question ?? '').toLowerCase().includes(term) ||
        (q.question_en ?? '').toLowerCase().includes(term) ||
        (q.answer ?? '').toLowerCase().includes(term) ||
        (q.explanation ?? '').toLowerCase().includes(term)
    );
    console.log(`${CYAN}${found.length} result(s):${RESET}`);
    found.forEach((q, i) => printQuestion(q, i, found.length));
  } else if (choice === '7') {
    const outPath = path.join(root, 'scripts', 'question-bank-export.json');
    fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`${GREEN}Exported to scripts/question-bank-export.json${RESET}`);
  }

  rl.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
