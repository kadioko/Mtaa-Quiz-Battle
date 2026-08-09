# Question Authoring Guide

Use this quick guide for every question added to Mtaa Quiz Battle. The complete examples and editorial standards live in `docs/AUTHORING_GUIDE.md`.

## Current Bank

- 626 bundled bilingual questions across 10 categories.
- Bundled IDs run from `q001` through `q626`.
- The next bundled question ID is `q627`.
- Remote packs must use `r###` IDs to avoid collisions with bundled questions.

## Required Shape

```ts
{
  id: 'q627',
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

- Use a unique `q###` or `r###` ID.
- Use an exact category name from `src/data/categories.ts`.
- Provide four unique options in both languages.
- Ensure `answer` and `answer_en` are present in their corresponding options.
- Supply a genuine translation, not a copied Swahili value.
- Keep explanations useful: explain why the answer is right or add short context.

## Fact-Sensitive Questions

Add a source note and source URL for factual, historical, statistical, official, or record-based questions:

```ts
sourceNote: 'Official source that supports the fact.',
sourceUrl: 'https://example.org/source',
```

For facts that can change, add all fields below and select a realistic review date:

```ts
timeSensitive: true,
reviewAfter: '2027-01-01',
reviewReason: 'Office holder, record, or statistic can change.',
```

`sourceNote` and `sourceUrl` are mandatory when `timeSensitive` is true.

## Workflow

1. Draft in a `scripts/q-<category-slug>.mjs` batch file for more than two questions.
2. Add the batch to `scripts/inject-questions.mjs` and run `node scripts/inject-questions.mjs`.
3. Run `npm run validate:data`.
4. Run `npm run typecheck`.
5. Run `npm run check` before merging.

## Editorial Standard

- Prefer one unambiguous answer over clever wording.
- Use Tanzanian context and familiar language without assuming one region's slang.
- Avoid price, ranking, office-holder, and active-record questions unless they are marked time-sensitive.
- Keep a healthy category mix around 40% easy, 40% medium, and 20% hard.
