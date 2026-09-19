import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { briefSchema } from '../src/domain/brief';

const schema = z.toJSONSchema(briefSchema, { target: 'draft-2020-12' });
const output =
  JSON.stringify(
    {
      ...schema,
      title: 'Council OnePager brief v1.0',
      description:
        'Structural contract for public working drafts. Application validation additionally checks unique IDs, source references, and URL credentials. Validation does not establish factual accuracy.',
    },
    null,
    2,
  ) + '\n';
const path = new URL('../schemas/brief.schema.json', import.meta.url);
if (process.argv.includes('--check')) {
  if ((await readFile(path, 'utf8')) !== output)
    throw new Error('Schema is stale. Run pnpm schema:generate.');
} else {
  await mkdir(new URL('../schemas/', import.meta.url), { recursive: true });
  await writeFile(path, output);
}
