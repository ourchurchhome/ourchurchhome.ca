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

const MULTILINE_KEYS = /body|description|content|notes|bio|summary/i;

function inferType(z: ZodTypeAny, key?: string): FieldType {
  const inner = unwrap(z);
  const t = defType(inner);

  switch (t) {
    case 'string': {
      const checks = (inner._def as { checks?: Array<{ format?: string }> }).checks ?? [];
      if (checks.some((c) => c.format === 'url')) return 'url';
      if (checks.some((c) => c.format === 'email')) return 'email';
      if (key && MULTILINE_KEYS.test(key)) return 'text';
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
    object: 'Group',
    unknown: 'TextInput',
  };
  return map[type];
}

/** True when every property of a Zod object shape is a scalar (non-object, non-array). */
function isAllScalar(shape: Record<string, ZodTypeAny>): boolean {
  return Object.values(shape).every((v) => {
    const t = inferType(v);
    return t !== 'object' && t !== 'array';
  });
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
  override?: FieldOverride,
  childOverrides: Record<string, FieldOverride> = {}
): ResolvedField | null {
  if (override?.hidden) return null;

  const type = inferType(zodType, key);
  const label = override?.label ?? toTitleCase(key);
  const control = override?.component ?? defaultControl(type);
  const required = !isOptional(zodType);

  const field: ResolvedField = { key, label, type, required, control };

  // ── enum options ──────────────────────────────────────────────────────────
  if (type === 'enum') {
    const inner = unwrap(zodType);
    const entries = (inner._def as { entries?: string[] | Record<string, string> }).entries;
    if (Array.isArray(entries)) {
      field.options = entries;
    } else if (entries && typeof entries === 'object') {
      field.options = Object.values(entries);
    } else {
      field.options = [];
    }
  }

  // ── array fields ──────────────────────────────────────────────────────────
  if (type === 'array') {
    const inner = unwrap(zodType);
    const element = (inner._def as { element?: ZodTypeAny }).element;

    if (element) {
      const elementType = inferType(element);

      if (elementType === 'object') {
        // Always resolve child fields so Table/Repeater have their column definitions,
        // even when the control was explicitly overridden in cms.config.ts.
        const shape = (unwrap(element)._def as { shape?: Record<string, ZodTypeAny> }).shape ?? {};
        const columnOverrides = override?.columns ?? {};
        const elementChildren = Object.entries(shape)
          .map(([k, v]) => resolveOne(k, v, columnOverrides[k]))
          .filter((f): f is ResolvedField => f !== null);

        field.elementChildren = elementChildren;

        // Only auto-assign Table vs Repeater when the user hasn't set an explicit override.
        if (!override?.component) {
          field.control = isAllScalar(shape) ? 'Table' : 'Repeater';
        }
      }
    }
  }

  // ── object / Group ────────────────────────────────────────────────────────
  if (type === 'object') {
    const inner = unwrap(zodType);
    const shape = (inner._def as { shape: Record<string, ZodTypeAny> }).shape;
    field.children = Object.entries(shape)
      .map(([k, v]) => resolveOne(k, v, childOverrides[k]))
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

