# Mtaa Quiz Battle — Question Authoring Guide

## Quick-start checklist

Before adding a question, confirm:

- [ ] `id` is unique (`q001`–`q999`; next available after `q222`)
- [ ] `category` matches exactly one name in `categories.ts`
- [ ] `difficulty` is `'easy'`, `'medium'`, or `'hard'`
- [ ] Exactly **4** options in both `options` (Swahili) and `options_en` (English)
- [ ] No duplicate options within the same array
- [ ] `answer` is contained in `options`; `answer_en` is contained in `options_en`
- [ ] `question_en`, `answer_en`, and `explanation_en` are present
- [ ] `timeSensitive: true` questions also have `sourceNote`, `sourceUrl`, `reviewAfter`, and `reviewReason`

---

## Field reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | Unique, format `q###` |
| `category` | `string` | ✅ | Must match `Category.name` in `categories.ts` |
| `question` | `string` | ✅ | Swahili question text |
| `question_en` | `string` | ✅ | English question text |
| `options` | `string[4]` | ✅ | Swahili answer choices |
| `options_en` | `string[4]` | ✅ | English answer choices |
| `answer` | `string` | ✅ | Must be in `options` |
| `answer_en` | `string` | ✅ | Must be in `options_en` |
| `explanation` | `string` | ✅ | Swahili explanation shown after answering |
| `explanation_en` | `string` | ✅ | English explanation |
| `difficulty` | `'easy'\|'medium'\|'hard'` | ✅ | |
| `sourceNote` | `string` | ⚠️ Recommended for facts; **required** if `timeSensitive` | Human-readable citation |
| `sourceUrl` | `string` | ⚠️ Recommended for facts; **required** if `timeSensitive` | Must start with `https://` |
| `timeSensitive` | `boolean` | Optional | Flag for facts that may change (leaders, records, stats) |
| `reviewAfter` | `string` (ISO date) | Required if `timeSensitive` | Date to re-verify the answer |
| `reviewReason` | `string` | Required if `timeSensitive` | Why this fact may change |

---

## Difficulty guidelines

| Level | Description | Target accuracy |
|---|---|---|
| `easy` | Common knowledge; most Tanzanians know it | > 70% |
| `medium` | Requires some study or local familiarity | 45–70% |
| `hard` | Specialist or deep local knowledge | < 45% |

Aim for roughly **40% easy / 40% medium / 20% hard** per category.

---

## Apostrophes & special characters

All strings in `questions.ts` use **single quotes**. Escape any apostrophe inside a value:

```ts
// ✅ Correct
explanation_en: 'Tanzania\'s capital is Dodoma.',

// ❌ Wrong — breaks JS parsing
explanation_en: 'Tanzania's capital is Dodoma.',
```

Swahili words with apostrophes (e.g. `ng'ombe`) must also be escaped:

```ts
options: ['Siagi ya ng\'ombe', ...]
```

**Tip:** Use `inject-questions.mjs` pattern (data in `.mjs` files using double-quoted strings, serialized by the injector) to avoid this entirely when adding large batches.

---

## Time-sensitive questions

Use `timeSensitive: true` for any fact that can change:

- Current office-holders (presidents, ministers, party leaders)
- Active records (fastest, tallest, most…)
- Population figures, GDP rankings
- League/cup standings and champions
- Sponsorship names (e.g. league title sponsors)
- VAT/tax rates

```ts
{
  id: 'q138',
  category: 'Simba na Yanga',
  question: 'Ligi Kuu Tanzania inajulikana kwa jina gani la msimamizi?',
  question_en: "What is Tanzania's top football league currently called?",
  options: ['NBC Premier League', 'Ligi Bingwa', 'Tanzania Super League', 'Azam League'],
  options_en: ['NBC Premier League', 'Champions League', 'Tanzania Super League', 'Azam League'],
  answer: 'NBC Premier League',
  answer_en: 'NBC Premier League',
  explanation: 'Ligi ya juu Tanzania inajulikana kwa jina NBC Premier League baada ya msimamizi.',
  explanation_en: "Tanzania's top flight is known as the NBC Premier League after its title sponsor.",
  difficulty: 'medium',
  timeSensitive: true,
  reviewAfter: '2027-12-31',
  reviewReason: 'Sponsorship name changes with each title sponsor deal.',
  sourceNote: 'NBC Bank is title sponsor as of 2024 season.',
  sourceUrl: 'https://www.tff.or.tz',
},
```

---

## Per-category examples

### Bongo Fleva 🎵
Focus on artists, albums, labels, and genre history. Avoid chart positions (time-sensitive).

```ts
{
  id: 'q124',
  category: 'Bongo Fleva',
  question: 'Lebo ya WCB Wasafi inamilikiwa na nani?',
  question_en: 'Who owns the WCB Wasafi music label?',
  options: ['Diamond Platnumz', 'Ali Kiba', 'Harmonize', 'Rayvanny'],
  options_en: ['Diamond Platnumz', 'Ali Kiba', 'Harmonize', 'Rayvanny'],
  answer: 'Diamond Platnumz',
  answer_en: 'Diamond Platnumz',
  explanation: 'WCB Wasafi ni lebo inayomilikiwa na Diamond Platnumz.',
  explanation_en: 'WCB Wasafi is owned by Diamond Platnumz.',
  difficulty: 'easy',
},
```

### Simba na Yanga ⚽
Focus on club history, colours, stadium, federation. Flag current champions/standings as `timeSensitive`.

```ts
{
  id: 'q135',
  category: 'Simba na Yanga',
  question: 'Simba SC ilianzishwa mwaka gani?',
  question_en: 'In which year was Simba SC founded?',
  options: ['1936', '1948', '1964', '1920'],
  options_en: ['1936', '1948', '1964', '1920'],
  answer: '1936',
  answer_en: '1936',
  explanation: 'Simba SC ilianzishwa mwaka 1936 kama Queens Club, kabla ya kubadilishwa jina.',
  explanation_en: 'Simba SC was founded in 1936 as Queens Club before being renamed.',
  difficulty: 'hard',
  sourceNote: 'Simba SC official history gives 1936 as the founding year.',
},
```

### Mikoa ya Tanzania 🗺️
Focus on geography, bordering features, regional products. Flag admin counts as `timeSensitive`.

```ts
{
  id: 'q150',
  category: 'Mikoa ya Tanzania',
  question: 'Mkoa gani una Hifadhi ya Taifa ya Serengeti?',
  question_en: 'Which region contains Serengeti National Park?',
  options: ['Mara', 'Arusha', 'Mwanza', 'Shinyanga'],
  options_en: ['Mara', 'Arusha', 'Mwanza', 'Shinyanga'],
  answer: 'Mara',
  answer_en: 'Mara',
  explanation: 'Hifadhi ya Serengeti ipo ndani ya mkoa wa Mara kaskazini mwa Tanzania.',
  explanation_en: 'Serengeti National Park falls within Mara Region in northern Tanzania.',
  difficulty: 'medium',
},
```

### Historia ya Tanzania 📜
Dates, events, leaders. Use `sourceNote` for founding dates and war years.

```ts
{
  id: 'q157',
  category: 'Historia ya Tanzania',
  question: 'Vita vya Tanzania dhidi ya Uganda vilifanyika miaka gani?',
  question_en: 'The Tanzania-Uganda War took place in which years?',
  options: ['1978-1979', '1964-1965', '1990-1991', '1972-1973'],
  options_en: ['1978-1979', '1964-1965', '1990-1991', '1972-1973'],
  answer: '1978-1979',
  answer_en: '1978-1979',
  explanation: 'Tanzania iliingia Uganda kupigana dhidi ya Idi Amin mnamo 1978-1979.',
  explanation_en: 'Tanzania entered Uganda to fight Idi Amin in 1978-1979.',
  difficulty: 'hard',
},
```

### Vyakula vya Bongo 🍛
Ingredients, cooking methods, regional origins. Avoid questions on prices.

```ts
{
  id: 'q165',
  category: 'Vyakula vya Bongo',
  question: 'Chakula cha "Wali wa Nazi" kinatumia kiungo gani muhimu?',
  question_en: 'The dish "Wali wa Nazi" uses which key ingredient?',
  options: ['Maziwa ya nazi', 'Siagi', 'Mafuta ya alizeti', 'Cream ya maziwa'],
  options_en: ['Coconut milk', 'Butter', 'Sunflower oil', 'Dairy cream'],
  answer: 'Maziwa ya nazi',
  answer_en: 'Coconut milk',
  explanation: 'Wali wa Nazi ni wali uliopikwa kwa kutumia maziwa ya nazi badala ya maji.',
  explanation_en: 'Wali wa Nazi is rice cooked using coconut milk instead of water.',
  difficulty: 'easy',
},
```

### Methali za Kiswahili 💬
Ask for meanings, closest English equivalents, or lessons. Keep options clearly distinct.

```ts
{
  id: 'q176',
  category: 'Methali za Kiswahili',
  question: '"Penye moshi pana moto" inafanana na methali gani ya Kiingereza?',
  question_en: '"Penye moshi pana moto" mirrors which English proverb?',
  options: ["Where there's smoke there's fire", 'Actions speak louder than words', 'Birds of a feather', 'Time is money'],
  options_en: ["Where there's smoke there's fire", 'Actions speak louder than words', 'Birds of a feather', 'Time is money'],
  answer: "Where there's smoke there's fire",
  answer_en: "Where there's smoke there's fire",
  explanation: '"Penye moshi pana moto" inafanana na "where there\'s smoke there\'s fire".',
  explanation_en: '"Penye moshi pana moto" mirrors "where there\'s smoke there\'s fire".',
  difficulty: 'easy',
},
```

### Mitaa ya Dar 🏙️
Neighbourhoods, districts, landmarks, markets. Keep options to real Dar es Salaam place names.

```ts
{
  id: 'q183',
  category: 'Mitaa ya Dar',
  question: 'Mtaa wa Magomeni uko wilaya gani Dar es Salaam?',
  question_en: 'Magomeni neighbourhood is in which district of Dar es Salaam?',
  options: ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo'],
  options_en: ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo'],
  answer: 'Kinondoni',
  answer_en: 'Kinondoni',
  explanation: 'Magomeni ni mtaa uliopo wilaya ya Kinondoni, Dar es Salaam.',
  explanation_en: 'Magomeni is a neighbourhood in Kinondoni District, Dar es Salaam.',
  difficulty: 'medium',
},
```

### Wanyama na Hifadhi 🦁
Species facts, park names, conservation. Use `sourceNote` for renaming events.

```ts
{
  id: 'q196',
  category: 'Wanyama na Hifadhi',
  question: 'Selous Game Reserve sasa inaitwa jina gani jipya?',
  question_en: 'Selous Game Reserve is now known by what new name?',
  options: ['Nyerere National Park', 'Ruaha Extension', 'Mikumi Reserve', 'Kilwa Park'],
  options_en: ['Nyerere National Park', 'Ruaha Extension', 'Mikumi Reserve', 'Kilwa Park'],
  answer: 'Nyerere National Park',
  answer_en: 'Nyerere National Park',
  explanation: 'Selous Game Reserve iliitwa upya Nyerere National Park mwaka 2019.',
  explanation_en: 'Selous Game Reserve was renamed Nyerere National Park in 2019.',
  difficulty: 'medium',
  sourceNote: 'Tanzania government gazette renamed Selous to Nyerere National Park in 2019.',
},
```

### Biashara na Hustle 💰
Economy, mobile money, markets, exports. Flag rates, rankings, and company facts as `timeSensitive`.

```ts
{
  id: 'q204',
  category: 'Biashara na Hustle',
  question: 'M-Pesa ilianzishwa Tanzania kupitia kampuni gani?',
  question_en: 'M-Pesa was launched in Tanzania through which company?',
  options: ['Vodacom Tanzania', 'Airtel Tanzania', 'Tigo Tanzania', 'TTCL'],
  options_en: ['Vodacom Tanzania', 'Airtel Tanzania', 'Tigo Tanzania', 'TTCL'],
  answer: 'Vodacom Tanzania',
  answer_en: 'Vodacom Tanzania',
  explanation: 'M-Pesa ilianzishwa Tanzania na Vodacom Tanzania, ikifuata mfano wa Kenya.',
  explanation_en: 'M-Pesa was launched in Tanzania by Vodacom Tanzania, following the Kenyan model.',
  difficulty: 'easy',
},
```

### General Knowledge TZ 🇹🇿
Flag, currency, borders, languages, constitution. Flag population figures and political facts as `timeSensitive`.

```ts
{
  id: 'q213',
  category: 'General Knowledge TZ',
  question: 'Bendera ya Tanzania ina rangi ngapi?',
  question_en: 'How many colours does the Tanzanian flag have?',
  options: ['4', '3', '2', '5'],
  options_en: ['4', '3', '2', '5'],
  answer: '4',
  answer_en: '4',
  explanation: 'Bendera ya Tanzania ina rangi nne: kijani, njano, nyeusi, na bluu.',
  explanation_en: "Tanzania's flag has four colours: green, yellow, black, and blue.",
  difficulty: 'easy',
},
```

---

## Adding a new batch (recommended workflow)

1. Create a file `scripts/q-<category-slug>.mjs` exporting an array of question objects (use double-quoted JS strings to avoid apostrophe issues).
2. Import it in `scripts/inject-questions.mjs` and add it to `allNew`.
3. Run `node scripts/inject-questions.mjs` — the script checks for ID conflicts.
4. Run `node scripts/validate-data.mjs` — fix any reported errors.
5. Run `npm run typecheck` — ensure no TypeScript errors.
6. Commit.

---

## Reviewing time-sensitive questions

Run a search for questions due for review:

```bash
node -e "
const {questions} = require('./src/data/questions.ts');
const now = new Date();
questions
  .filter(q => q.timeSensitive && new Date(q.reviewAfter) <= now)
  .forEach(q => console.log(q.id, q.reviewAfter, q.reviewReason));
"
```
