import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { questions, getDailyQuestions } = require(path.join(rootDir, 'src/data/questions.ts'));
const { categories } = require(path.join(rootDir, 'src/data/categories.ts'));

const errors = [];
const warnings = [];
const difficultyLevels = new Set(['easy', 'medium', 'hard']);
const categoryNames = new Set(categories.map((category) => category.name));

const report = (collection, message) => collection.push(message);
const hasDuplicates = (values) => new Set(values).size !== values.length;

questions.forEach((question, index) => {
  const label = `${question.id || `question_${index + 1}`}`;

  if (!question.id) report(errors, `${label}: missing id`);
  if (!question.category || !categoryNames.has(question.category)) {
    report(errors, `${label}: category "${question.category}" does not match categories.ts`);
  }
  if (!difficultyLevels.has(question.difficulty)) {
    report(errors, `${label}: invalid difficulty "${question.difficulty}"`);
  }

  ['question_en', 'answer_en', 'explanation_en'].forEach((field) => {
    if (!question[field]) report(errors, `${label}: missing ${field}`);
  });

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    report(errors, `${label}: Swahili options must contain exactly 4 choices`);
  } else {
    if (hasDuplicates(question.options)) report(errors, `${label}: Swahili options contain duplicates`);
    if (!question.options.includes(question.answer)) report(errors, `${label}: answer is not in Swahili options`);
  }

  if (!Array.isArray(question.options_en) || question.options_en.length !== 4) {
    report(errors, `${label}: English options must contain exactly 4 choices`);
  } else {
    if (hasDuplicates(question.options_en)) report(errors, `${label}: English options contain duplicates`);
    if (!question.options_en.includes(question.answer_en)) report(errors, `${label}: answer_en is not in English options`);
  }
});

const duplicateIds = questions
  .map((question) => question.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);

if (duplicateIds.length > 0) {
  report(errors, `Duplicate question ids: ${Array.from(new Set(duplicateIds)).join(', ')}`);
}

categories.forEach((category) => {
  const actualCount = questions.filter((question) => question.category === category.name).length;
  if (category.questionCount !== actualCount) {
    report(
      errors,
      `${category.id}: questionCount is ${category.questionCount}, expected ${actualCount}`
    );
  }
  if (actualCount === 0) {
    report(warnings, `${category.id}: category has no questions`);
  }
});

const dailyDate = new Date('2026-05-09T12:00:00Z');
const dailyQuestions = getDailyQuestions(10, dailyDate);
const repeatedDailyQuestions = getDailyQuestions(10, dailyDate);
const dailyIds = dailyQuestions.map((question) => question.id);
const repeatedDailyIds = repeatedDailyQuestions.map((question) => question.id);
const dailyCategoryCount = new Set(dailyQuestions.map((question) => question.category)).size;

if (dailyQuestions.length !== 10) {
  report(errors, `Daily challenge returned ${dailyQuestions.length} questions, expected 10`);
}
if (hasDuplicates(dailyIds)) {
  report(errors, 'Daily challenge contains duplicate questions');
}
if (dailyIds.join('|') !== repeatedDailyIds.join('|')) {
  report(errors, 'Daily challenge is not deterministic for the same date');
}
if (dailyCategoryCount < Math.min(10, categories.length)) {
  report(errors, `Daily challenge covers ${dailyCategoryCount} categories, expected ${Math.min(10, categories.length)}`);
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));

if (errors.length > 0) {
  console.error('Data validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Data validation passed: ${questions.length} questions, ${categories.length} categories.`);
