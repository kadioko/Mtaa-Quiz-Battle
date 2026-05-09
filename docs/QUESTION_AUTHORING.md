# Question Authoring Guide

Use this guide when adding or editing Mtaa Quiz Battle questions.

## Goals

- Keep questions fun, local, and replayable.
- Keep facts accurate enough for trivia.
- Make Swahili the primary language while preserving a complete English experience.
- Flag questions that can become outdated.

## Required Fields

Every question in `src/data/questions.ts` must include:

```ts
{
  id: 'q123',
  category: 'General Knowledge TZ',
  question: 'Swali la Kiswahili?',
  question_en: 'English question?',
  options: ['A', 'B', 'C', 'D'],
  options_en: ['A', 'B', 'C', 'D'],
  answer: 'B',
  answer_en: 'B',
  explanation: 'Maelezo mafupi ya Kiswahili.',
  explanation_en: 'Short English explanation.',
  difficulty: 'medium',
}
```

Rules:

- `id` must be unique and follow the current `q###` style.
- `category` must exactly match a category name from `src/data/categories.ts`.
- `options` and `options_en` must each contain exactly four unique choices.
- `answer` must appear in `options`.
- `answer_en` must appear in `options_en`.
- `difficulty` must be `easy`, `medium`, or `hard`.
- English fields are required for every question.

## Optional Source Metadata

Use source metadata for questions that rely on public facts, official counts, office holders, institutions, or records:

```ts
sourceNote: 'Official Ikulu profile identifies Samia Suluhu Hassan as President.',
sourceUrl: 'https://www.ikulu.go.tz/president',
```

Prefer primary or authoritative sources:

- Government and public institution sites
- Official sports federation or league sites
- Official park, museum, or statistical agency pages
- Publisher/artist/label pages for music questions

Avoid using social media posts as the only source for a permanent trivia answer.

## Time-Sensitive Questions

If a question can change, add all of these fields:

```ts
timeSensitive: true,
reviewAfter: '2026-12-31',
reviewReason: 'Current office holder questions should be checked after elections or succession events.',
```

Examples of time-sensitive questions:

- Current presidents, ministers, mayors, captains, coaches, or CEOs
- Active league team counts
- Current population estimates
- Current records, rankings, awards, prices, or statistics
- "Most followed", "latest", "current", or "as of today" questions

For stable historical facts, use the year in the question instead of marking it current.

## Writing Style

- Keep questions short and direct.
- Avoid trick wording unless the explanation makes it fair.
- Use local phrasing, but keep it understandable across Tanzania.
- Keep explanations educational, not just "because it is correct."
- Mix easy recall, medium context, and hard detail questions.

## Category Growth Targets

Target range per category:

- Minimum playable depth: 20 questions
- Good replay depth: 30 questions
- Strong replay depth: 50 questions

Current strategy:

- Add balanced batches across all categories.
- Avoid growing one category far ahead of the others unless a feature needs it.
- Run validation after every content batch.

## Validation

Run:

```bash
npm run validate:data
```

Before merging content changes, run:

```bash
npm run check
```

The validator catches:

- Duplicate question IDs
- Category mismatches
- Missing translations
- Invalid difficulty values
- Duplicate answer options
- Answers missing from options
- Broken source URL shape
- Missing review fields on time-sensitive questions
- Daily challenge selection regressions
- UI translation key and placeholder mismatches
