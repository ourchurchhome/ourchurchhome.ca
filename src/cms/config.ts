import type { ComponentType } from 'react';

// ---------------------------------------------------------------------------
// Built-in control names
// These are the controls the CMS knows how to render natively.
// The correct control for a field is inferred from its Zod schema type by
// src/cms/lib/schema-fields.ts — users only need to reference these names
// when they want to OVERRIDE the inferred default in cms.config.ts.
// ---------------------------------------------------------------------------

export type BuiltInControl =
  | 'TextInput'
  | 'TextArea'
  | 'NumberInput'
  | 'DatePicker'
  | 'Toggle'
  | 'Select'
  | 'TagInput'
  | 'UrlInput'
  | 'EmailInput'
  | 'ImageUrl'
  | 'Group'
  | 'Repeater'
  | 'Widgets'
  | 'Table';

// ---------------------------------------------------------------------------
// Custom field component contract
// Implement this interface when providing a custom React component as a
// field override in cms.config.ts.
// ---------------------------------------------------------------------------

export interface FieldComponentProps {
  /** Current field value (typed according to the Zod schema for this field) */
  value: unknown;
  /** Call this to update the field value in the editor state */
  onChange: (value: unknown) => void;
  /** The fully resolved field definition, including inferred type and options */
  field: ResolvedField;
}

// ---------------------------------------------------------------------------
// FieldOverride — presentation-only overrides applied on top of the Zod schema
//
// IMPORTANT: This object describes HOW to display a field, never WHAT the
// field type is. Field types are always inferred from the Zod schema in
// src/content/schemas.ts. Adding a key here that does not exist in the Zod
// schema has no effect (and will warn in development).
// ---------------------------------------------------------------------------

export interface FieldOverride {
  /**
   * Swap the auto-inferred control for a different built-in or a custom
   * React component. Only needed when the default inference is wrong for
   * your use case (e.g. use 'TextArea' for a string that should be
   * multi-line, or supply a custom date-range component).
   */
  component?: BuiltInControl | ComponentType<FieldComponentProps>;
  /**
   * Human-readable label shown above the control.
   * Defaults to the field key converted to Title Case.
   */
  label?: string;
  /**
   * Set to true to hide this field from the editor form entirely.
   * Useful for fields managed programmatically (e.g. `draft`, `updatedAt`).
   */
  hidden?: boolean;
  /**
   * Per-column presentation overrides for Table (and Repeater) fields.
   * Keys match the property names of the inner object in the Zod array schema.
   * Only `component` and `label` are meaningful here; `hidden` hides the column.
   */
  columns?: Record<string, FieldOverride>;
}

// ---------------------------------------------------------------------------
// Collection config — collection-level behaviour switches + field overrides
// ---------------------------------------------------------------------------

export interface CollectionConfig {
  /**
   * When true the collection is a single document (e.g. a site banner).
   * It appears directly in the sidebar and links straight to the editor;
   * there is no list page.
   */
  singleton?: boolean;
  /** Show the "New item" action. Default: true. */
  allowCreate?: boolean;
  /** Show the "Delete" action. Default: true. */
  allowDelete?: boolean;
  /**
   * Icon shown in the sidebar next to the collection name.
   * Any string is accepted — emoji work well (e.g. "📝").
   * Defaults to 📄 for singletons and 📂 for group collections.
   */
  icon?: string;
  /**
   * When true, this collection is only visible in the CMS when running in
   * development mode (import.meta.env.DEV). Useful for test/kitchen-sink
   * collections that should never appear in production.
   */
  development?: boolean;
  /**
   * Presentation overrides for specific fields, keyed by field name.
   * These are merged on top of the auto-generated field config derived
   * from the collection's Zod schema — they never replace it.
   */
  fields?: Record<string, FieldOverride>;
}

// ---------------------------------------------------------------------------
// Top-level CMS config
// ---------------------------------------------------------------------------

export interface CmsConfig {
  collections: Record<string, CollectionConfig>;
}

// ---------------------------------------------------------------------------
// defineConfig — user-facing helper that provides TypeScript autocompletion
// in cms.config.ts without any runtime transformation.
// ---------------------------------------------------------------------------

export function defineConfig(config: CmsConfig): CmsConfig {
  return config;
}

// ---------------------------------------------------------------------------
// Resolved types — internal to the CMS, produced by schema-fields.ts
// Users never construct these directly.
// ---------------------------------------------------------------------------

/**
 * The semantic field type inferred by walking the Zod schema.
 * Determines which built-in control is rendered by default.
 */
export type FieldType =
  | 'string'   // z.string() → TextInput
  | 'text'     // z.string() with multiline hint → TextArea
  | 'number'   // z.number() → NumberInput
  | 'boolean'  // z.boolean() → Toggle
  | 'date'     // z.date() / z.coerce.date() → DatePicker
  | 'url'      // z.string().url() → UrlInput
  | 'email'    // z.string().email() → EmailInput
  | 'enum'     // z.enum([...]) → Select
  | 'array'    // z.array(...) → TagInput (for string arrays)
  | 'object'   // z.object({...}) → nested FieldsPane
  | 'unknown'; // fallback → TextInput

/**
 * A fully resolved field definition ready to be rendered by FieldsPane.
 * Produced by merging the Zod-inferred field config with any FieldOverride
 * from cms.config.ts.
 */
export interface ResolvedField {
  /** The field key as it appears in the Zod schema */
  key: string;
  /** Display label (from override or auto-generated) */
  label: string;
  /** Semantic type inferred from the Zod schema — never from cms.config.ts */
  type: FieldType;
  /** For enum fields: the values from z.enum([...]) */
  options?: string[];
  /** True when the Zod schema does not call .optional() or supply a .default() */
  required: boolean;
  /**
   * The control to render. Set to the inferred default unless a cms.config.ts
   * override specifies a different BuiltInControl or custom component.
   */
  control: BuiltInControl | ComponentType<FieldComponentProps>;
  /** For object fields (Group): recursively resolved child fields */
  children?: ResolvedField[];
  /**
   * For array-of-object fields (Repeater, Table, Widgets): the resolved fields
   * that describe each item in the array.
   */
  elementChildren?: ResolvedField[];
  /**
   * For Widgets: the discriminant key (e.g. "type") used to distinguish variants.
   */
  discriminantKey?: string;
  /**
   * For Widgets: one entry per union variant, keyed by the discriminant value.
   * Each entry holds the child fields specific to that variant (excluding the
   * discriminant field itself).
   */
  widgetVariants?: Array<{ discriminantValue: string; children: ResolvedField[] }>;
}

/**
 * A fully resolved collection descriptor, combining the Zod schema introspection
 * result with the cms.config.ts collection-level settings.
 */
export interface ResolvedCollection {
  /** Collection slug matching the key in content.config.ts */
  name: string;
  /** Human-readable title (Title Case of the collection name) */
  label: string;
  singleton: boolean;
  allowCreate: boolean;
  allowDelete: boolean;
  /** Icon shown in the sidebar. Defaults to 📄 (singleton) or 📂 (group). */
  icon: string;
  /** Fields derived from the Zod schema, with overrides applied */
  fields: ResolvedField[];
  /** File extension used by this collection's content files */
  fileExtension: 'md' | 'json';
  /** Path prefix from the repo root where content files live */
  basePath: string;
}

