/**
 * src/cms/lib/schema-fields.ts
 *
 * Walks a Zod schema and produces a ResolvedField[] array used to auto-generate
 * form controls in the CMS editor. Overrides from cms.config.ts are merged in.
 */

import type { ZodTypeAny } from 'zod';
import type { BuiltInControl, FieldType, ResolvedField, FieldOverride } from '../config';
import { collectionSchemas, type CollectionName } from '../../content/schemas';

// ---------------------------------------------------------------------------
// Zod v4 unwrapping helpers
// In Zod v4: _def.type is a plain string (e.g. 'optional', 'object'),
// _def.shape is a plain object (not a function), enum uses _def.entries.
// ---------------------------------------------------------------------------

function defType(z: ZodTypeAny): string {
  return (z._def as { type?: string }).type ?? '';
}

function unwrap(z: ZodTypeAny): ZodTypeAny {
  const t = defType(z);
  if (t === 'optional' || t === 'nullable' || t === 'default') {
    return unwrap((z._def as { innerType: ZodTypeAny }).innerType);
  }
  return z;
}

function isOptional(z: ZodTypeAny): boolean {
  const t = defType(z);
  return t === 'optional' || t === 'nullable' || t === 'default';
}

// ---------------------------------------------------------------------------
// Zod v4 type → FieldType inference
// ---------------------------------------------------------------------------

function inferType(z: ZodTypeAny): FieldType {
  const inner = unwrap(z);
  const t = defType(inner);

  switch (t) {
    case 'string': {
      const checks = (inner._def as { checks?: Array<{ format?: string }> }).checks ?? [];
      if (checks.some((c) => c.format === 'url')) return 'url';
      if (checks.some((c) => c.format === 'email')) return 'email';
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

function defaultControl(type: FieldType): BuiltInControl {
  const map: Record<FieldType, BuiltInControl> = {
    string: 'TextInput',
    text: 'TextArea',
    url: 'UrlInput',
    email: 'EmailInput',
    number: 'NumberInput',
    boolean: 'Toggle',
    date: 'DatePicker',
    enum: 'Select',
    array: 'TagInput',
    object: 'TextInput', // overridden by recursive rendering
    unknown: 'TextInput',
  };
  return map[type];
}

function toTitleCase(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Core resolution
// ---------------------------------------------------------------------------

function resolveOne(
  key: string,
  zodType: ZodTypeAny,
  override?: FieldOverride
): ResolvedField | null {
  if (override?.hidden) return null;

  const type = inferType(zodType);
  const label = override?.label ?? toTitleCase(key);
  const control = override?.component ?? defaultControl(type);
  const required = !isOptional(zodType);

  const field: ResolvedField = { key, label, type, required, control };

  if (type === 'enum') {
    const inner = unwrap(zodType);
    // Zod v4: _def.entries is a plain object { value: value, … }, not an array
    const entries = (inner._def as { entries?: string[] | Record<string, string> }).entries;
    if (Array.isArray(entries)) {
      field.options = entries;
    } else if (entries && typeof entries === 'object') {
      field.options = Object.values(entries);
    } else {
      field.options = [];
    }
  }

  // Arrays whose element type is an object → use a JSON TextArea instead of TagInput
  if (type === 'array' && !override?.component) {
    const inner = unwrap(zodType);
    const element = (inner._def as { element?: ZodTypeAny }).element;
    if (element && inferType(element) === 'object') {
      field.control = 'TextArea';
    }
  }

  if (type === 'object') {
    const inner = unwrap(zodType);
    // Zod v4: _def.shape is a plain object (not a function)
    const shape = (inner._def as { shape: Record<string, ZodTypeAny> }).shape;
    field.children = Object.entries(shape)
      .map(([k, v]) => resolveOne(k, v, undefined))
      .filter((f): f is ResolvedField => f !== null);
  }

  return field;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the resolved field list for a named collection, applying any
 * overrides from cms.config.ts. The `body` key is always excluded.
 */
export function getFieldsForCollection(
  collection: CollectionName,
  overrides: Record<string, FieldOverride> = {}
): ResolvedField[] {
  const schema = collectionSchemas[collection];
  if (!schema) return [];

  // Zod v4: _def.shape is a plain object (not a function)
  const shape = (schema._def as { shape: Record<string, ZodTypeAny> }).shape;

  return Object.entries(shape)
    .filter(([key]) => key !== 'body')
    .map(([key, zodType]) => resolveOne(key, zodType, overrides[key]))
    .filter((f): f is ResolvedField => f !== null);
}

