# Mtaa Quiz Battle Content Standards

This is the editorial reference for the Tanzanian trivia bank. It is designed for human authors, reviewers, and the remote-content pipeline.

## Content Goal

Ship questions that are fun, accurate, bilingual, and durable. The bundled bank currently contains 626 questions in 10 categories. Content should grow through reviewed packs, not bulk generation alone.

## Authoring Rules

1. Write the Swahili question first, then create a natural English equivalent.
2. Give exactly four plausible, unique options in each language.
3. Keep one clearly correct answer. Do not use trick wording or options that overlap.
4. Explain the answer in one or two educational sentences.
5. Choose `easy`, `medium`, or `hard` based on expected Tanzanian general knowledge, not on the length of the question.
6. Use double-quoted JavaScript strings when apostrophes make a single-quoted string hard to read.
7. Verify category spelling against `src/data/categories.ts`.

## Metadata Rules

Use `sourceNote` and `sourceUrl` for facts that need an audit trail. Use `timeSensitive`, `reviewAfter`, and `reviewReason` for leaders, records, active companies, rankings, prices, population figures, and other changing facts.

Do not publish a time-sensitive question without a source and a review date. The validator rejects incomplete time-sensitive metadata.

## Category Guidance

| Category | Good question territory | Avoid without review metadata |
| --- | --- | --- |
| Simba na Yanga | club history, iconic matches, stadiums | current squad, active league table |
| Bongo Fleva | artist catalogues, landmark songs, awards | current charts, new releases |
| Historia ya Tanzania | independence, institutions, historic events | current political office holders |
| Mikoa ya Tanzania | geography, capitals, parks, landmarks | newest boundaries and population estimates |
| Vyakula vya Bongo | ingredients, origins, preparation | restaurant prices and trends |
| Methali za Kiswahili | meaning, use, equivalents | none usually needed |
| Mitaa ya Dar | districts, landmarks, transit context | rapidly changing businesses |
| Wanyama na Hifadhi | species, ecosystems, park facts | live conservation counts |
| Biashara na Hustle | economic concepts, established services | exchange rates, rankings, current CEOs |
| General Knowledge TZ | stable Tanzania and Africa facts | current leaders and active records |

## Review Pipeline

1. Draft: author supplies bilingual question, explanation, difficulty, and sources.
2. Fact check: reviewer opens the source and confirms the exact answer.
3. Editorial check: reviewer removes ambiguity, duplicate options, and weak translations.
4. Validation: run `npm run validate:data` locally.
5. Play check: sample the question on both language settings.
6. Publish: merge bundled questions or publish an approved remote pack.
7. Revisit: run `npm run admin:review -- --stale` before each scheduled content release.

## Remote Pack Contract

Remote packs are fetched from Supabase and validated on the device. Use `r###` IDs, include every required `Question` field, and do not put daily or weekly questions in remote packs because those modes must remain deterministic for every player.

## Validation Commands

```bash
npm run validate:data
npm run admin:review -- --stats
npm run admin:review -- --stale
npm run check
```
