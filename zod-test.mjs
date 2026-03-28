import { z } from './node_modules/zod/index.js';

function defType(schema) { return schema._def?.type ?? ''; }
function unwrap(schema) {
  const t = defType(schema);
  if (t === 'optional' || t === 'nullable' || t === 'default') return unwrap(schema._def.innerType);
  return schema;
}
function inferType(schema) {
  const inner = unwrap(schema);
  const t = defType(inner);
  switch (t) {
    case 'string': {
      const checks = inner._def.checks ?? [];
      if (checks.some(c => c.format === 'url')) return 'url';
      if (checks.some(c => c.format === 'email')) return 'email';
      return 'string';
    }
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'date': return 'date';
    case 'enum': return 'enum';
    case 'array': return 'array';
    case 'object': return 'object';
    default: return 'unknown';
  }
}

const articlesSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  category: z.enum(['announcement', 'news', 'reflection', 'general']),
  church: z.enum(['morell', 'mount-stewart']).default('morell'),
  description: z.string().optional(),
  link: z.string().url().optional(),
  draft: z.boolean().default(false),
});

const shape = articlesSchema._def.shape;
for (const [key, val] of Object.entries(shape)) {
  const type = inferType(val);
  let extras = '';
  if (type === 'enum') {
    const inner = unwrap(val);
    extras = 'entries=' + JSON.stringify(inner._def.entries);
  }
  console.log(key, '->', type, extras);
}

const bannerSchema = z.object({
  enabled: z.boolean().default(false),
  link: z.string().url().optional(),
});

console.log('\nbanner schema:');
for (const [key, val] of Object.entries(bannerSchema._def.shape)) {
  console.log(key, '->', inferType(val));
}

