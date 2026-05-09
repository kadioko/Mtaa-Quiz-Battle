import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/questions.ts');
let src = fs.readFileSync(file, 'utf8');

const patches = [
  {
    id: 'q138',
    addAfter: "reviewReason: 'Sponsorship name changes with each title sponsor deal.',",
    insert: "\n    sourceNote: 'NBC Bank is title sponsor as of 2024 season.',\n    sourceUrl: 'https://www.tff.or.tz',"
  },
  {
    id: 'q143',
    addAfter: "reviewReason: 'Tanzania may create additional regions through government decrees.',",
    insert: "\n    sourceNote: 'Tanzania 2022 census report lists 31 regions.',\n    sourceUrl: 'https://www.nbs.go.tz',"
  },
  {
    id: 'q208',
    addAfter: "reviewReason: 'VAT rates can change with annual government budget revisions.',",
    insert: "\n    sourceNote: 'Tanzania Revenue Authority confirms 18% standard VAT rate as of 2024.',\n    sourceUrl: 'https://www.tra.go.tz',"
  },
  {
    id: 'q209',
    addAfter: "reviewReason: 'Export rankings shift with commodity prices and new mineral discoveries.',",
    insert: "\n    sourceNote: 'Tanzania Natural Resources and Tourism reports gold as top export earner.',\n    sourceUrl: 'https://www.bot.go.tz',"
  },
  {
    id: 'q216',
    addAfter: "reviewReason: 'Population grows with each census; next census expected around 2032.',",
    insert: "\n    sourceNote: 'Tanzania National Bureau of Statistics 2022 census result.',\n    sourceUrl: 'https://www.nbs.go.tz',"
  },
];

for (const p of patches) {
  if (!src.includes(p.addAfter)) {
    console.error('Anchor not found for', p.id, ':', p.addAfter.substring(0, 40));
    process.exit(1);
  }
  src = src.replace(p.addAfter, p.addAfter + p.insert);
  console.log('Patched', p.id);
}

fs.writeFileSync(file, src, 'utf8');
console.log('All patches applied');
