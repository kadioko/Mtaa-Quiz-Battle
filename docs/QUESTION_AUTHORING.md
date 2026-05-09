# Question Authoring Guide

Use this guide when adding or editing Mtaa Quiz Battle questions.
For the full field reference, difficulty guidelines, apostrophe rules, and per-category examples see `docs/AUTHORING_GUIDE.md`.

## Current state

- **382 questions** across 10 categories (IDs `q001`–`q382`)
- **Next available ID: `q383`**
- Target: 50 questions per category (~38 average now, 30 minimum reached ✅)

## Adding questions

**For multiple questions (recommended):** use the batch injector.

```bash
# 1. Create scripts/q-<slug>.mjs exporting an array of question objects
# 2. Import that array in scripts/inject-questions.mjs
# 3. Run:
node scripts/inject-batch3.mjs  # or create inject-batch4.mjs for the next round
npm run validate:data
```

**For one or two questions:** append directly to `src/data/questions.ts` before the closing `];`.

## Required fields

Every question must have all of these:

```ts
{
  id: 'q383',
  category: 'General Knowledge TZ',   // must match categories.ts exactly
  question: 'Swali la Kiswahili?',
  question_en: 'English question?',
  options: ['A', 'B', 'C', 'D'],
  options_en: ['A', 'B', 'C', 'D'],
  answer: 'B',
  answer_en: 'B',
  explanation: 'Maelezo mafupi ya Kiswahili.',
  explanation_en: 'Short English explanation.',
  difficulty: 'medium',               // 'easy' | 'medium' | 'hard'
}
```

Rules:

- `id` must be unique and follow `q###` format.
- `options` / `options_en` must each have exactly 4 unique choices.
- `answer` must appear in `options`; `answer_en` must appear in `options_en`.
- All `_en` fields are required.

## Optional source metadata

Recommended for any question relying on a fact, statistic, or official record:

```ts
sourceNote: 'Official Ikulu profile identifies Samia Suluhu Hassan as President.',
sourceUrl: 'https://www.ikulu.go.tz/president',
```

## Time-sensitive questions

If the answer can change (current leaders, records, active counts), add all three fields:

```ts
timeSensitive: true,
reviewAfter: '2026-12-31',
reviewReason: 'Office holder may change after elections.',
```

`sourceNote` and `sourceUrl` are **required** when `timeSensitive: true`.

## Writing style

- Short, direct questions. Avoid trick wording.
- Use local Tanzanian phrasing — understandable across regions.
- Explanations should be educational, not just restate the answer.
- Aim for ~40% easy / 40% medium / 20% hard per category.

## Apostrophes

All strings in `questions.ts` use single quotes. Escape apostrophes:

```ts
explanation_en: 'Tanzania\'s capital is Dodoma.',
```

Or use a double-quote string when the value contains many apostrophes.

## Validation

After every content change:

```bash
npm run validate:data   # fast check
npm run check           # full CI gate (typecheck + validate + contrast + tests)
```

The validator catches: duplicate IDs, category mismatches, missing translations, invalid difficulty, duplicate options, answers not in options, bad source URL shape, missing time-sensitive metadata, daily challenge regressions.
