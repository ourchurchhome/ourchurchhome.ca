# CMS UI Fields

**Goal**: Define the complete set of UI field controls rendered by the CMS `FieldsPane`. Each field maps to one or more Zod types and is responsible for collecting, validating, and emitting a correctly-typed value back to the editor save handler.

## Field–Control Map

| Field control | Zod type(s) | Emitted value type |
|---|---|---|
| `TextInput` | `z.string()` | `string` |
| `TextArea` | `z.string()` (multiline hint or long content) | `string` |
| `NumberInput` | `z.number()` | `number` |
| `DatePicker` | `z.date()` / `z.coerce.date()` | ISO-8601 date string (coerced to `Date` on save) |
| `UrlInput` | `z.string().url()` | `string` (valid URL) |
| `EmailInput` | `z.string().email()` | `string` (valid email) |
| `Toggle` | `z.boolean()` | `boolean` |
| `TagInput` | `z.array(z.string())` | `string[]` |
| `Group` | `z.object({…})` | `Record<string, unknown>` |
| `Repeater` | `z.array(z.object({…}))` | `Record<string, unknown>[]` |
| `Widgets` | `z.array(z.discriminatedUnion(…))` | `Record<string, unknown>[]` |
| `Table` | `z.array(z.object({…}))` with scalar columns only | `Record<string, unknown>[]` |

> **Selection between `Repeater` and `Table`**: Both map to `z.array(z.object({…}))`. The distinction is presentational and configured via `cms.config.ts` field overrides. When no override is present, the CMS defaults to `Repeater`. Use `Table` for arrays whose objects contain only scalar fields (text, number, date, url, email, boolean) and benefit from a compact spreadsheet-style layout.

---

## Field Definitions

### TextInput

A single-line plain-text input.

- **Rendered as**: `<input type="text">`
- **Inferred from**: `z.string()` (default, when no `.url()`, `.email()`, or multiline hint is present)
- **Emits**: `string`
- **Validation**: passes through Zod `.min()` / `.max()` constraints as `minLength` / `maxLength` HTML attributes

### TextArea

A multi-line plain-text input.

- **Rendered as**: `<textarea>`
- **Inferred from**: `z.string()` when the field key ends in `body`, `description`, `content`, `notes`, `bio`, or `summary` (heuristic); or when overridden via `cms.config.ts`
- **Emits**: `string`
- **Behaviour**: auto-grows vertically up to a maximum height, then scrolls

### NumberInput

A numeric input that only accepts numeric characters.

- **Rendered as**: `<input type="number">`
- **Inferred from**: `z.number()`
- **Emits**: `number`
- **Validation**: passes through `.min()` / `.max()` as `min` / `max` HTML attributes; step defaults to `1`, `0.01` when `.multipleOf(0.01)` or similar is detected

### DatePicker

A date selector.

- **Rendered as**: `<input type="date">`
- **Inferred from**: `z.date()` / `z.coerce.date()`
- **Emits**: ISO-8601 string (`YYYY-MM-DD`); the save handler coerces this back to a `Date` when writing frontmatter
- **Display**: shows the value formatted according to the user's locale

### UrlInput

A single-line input constrained to a valid URL.

- **Rendered as**: `<input type="url">`
- **Inferred from**: `z.string().url()`
- **Emits**: `string` (valid URL)
- **Validation**: browser-native URL validation; additionally validated against the Zod schema on save

### EmailInput

A single-line input constrained to a valid email address.

- **Rendered as**: `<input type="email">`
- **Inferred from**: `z.string().email()`
- **Emits**: `string` (valid email)
- **Validation**: browser-native email validation; additionally validated against the Zod schema on save

### Toggle

A boolean on/off control.

- **Rendered as**: styled `<input type="checkbox">` (visually a toggle switch)
- **Inferred from**: `z.boolean()`
- **Emits**: `boolean`
- **Label**: displayed inline to the right of the toggle

### TagInput

A free-form multi-value text input where each value is an independent tag/string.

- **Rendered as**: pill-style tag list with an inline text input to add new tags
- **Inferred from**: `z.array(z.string())`
- **Emits**: `string[]`
- **Interaction**: press `Enter` or `,` to commit a tag; click the `×` on a pill to remove it
- **Validation**: each individual tag is validated against the inner Zod string schema (e.g. `.min(1)`)

### Group

A named set of heterogeneous fields rendered as a collapsible section.

- **Rendered as**: bordered card with a collapsible header containing a nested `FieldsPane`
- **Inferred from**: `z.object({…})`
- **Emits**: `Record<string, unknown>` (the aggregated values of all child fields)
- **Nesting**: each property of the object is resolved recursively through the same field-inference pipeline; groups may be nested

### Repeater

An ordered list of identical record blocks, each containing the same set of heterogeneous fields.

- **Rendered as**: a vertical stack of numbered cards, each containing a nested `FieldsPane`; "Add item" button appends a new empty block; drag handle reorders; trash icon removes
- **Inferred from**: `z.array(z.object({…}))` (default when no `Table` override is present)
- **Emits**: `Record<string, unknown>[]`
- **Child fields**: each item's fields are resolved from the inner `z.object({…})` schema, recursively

### Widgets

An ordered list of heterogeneous record blocks where each item may have a different shape, distinguished by a discriminant field (e.g. `type`).

- **Rendered as**: a vertical stack of cards; an "Add widget" dropdown lists the available widget types; each card renders only the fields relevant to its discriminant value
- **Inferred from**: `z.array(z.discriminatedUnion("type", […]))` — **not** auto-inferred; must be explicitly set via a `cms.config.ts` component override (`component: 'Widgets'`)
- **Emits**: `Record<string, unknown>[]` where each item includes the discriminant key
- **Child fields**: resolved per variant from each union member's `z.object({…})` schema

### Table

A compact spreadsheet-style grid for arrays of objects whose columns are all scalar fields.

- **Rendered as**: an HTML `<table>` with one column per object property and one row per item; inline cell editing; "Add row" button appends a blank row; row delete button on the right
- **Inferred from**: `z.array(z.object({…}))` where every property is a scalar (string, number, date, url, email, boolean) — **or** explicitly set via `cms.config.ts` (`component: 'Table'`)
- **Emits**: `Record<string, unknown>[]`
- **Column controls**: each column renders the appropriate scalar control (`TextInput`, `NumberInput`, `DatePicker`, `Toggle`, `UrlInput`, `EmailInput`) inline within the cell
- **Constraints**: nested objects and arrays are not supported as column types; use `Repeater` instead

---

## Acceptance Criteria

- [ ] Each field control renders for its corresponding Zod type with no `cms.config.ts` override required
- [ ] `TextInput` and `TextArea` are correctly distinguished by the field-key heuristic
- [ ] `UrlInput` prevents saving an invalid URL
- [ ] `EmailInput` prevents saving an invalid email address
- [ ] `Toggle` renders as a styled switch and emits a `boolean`
- [ ] `TagInput` adds a tag on `Enter` or `,` and removes tags via the pill `×` button
- [ ] `Group` renders a nested `FieldsPane` and emits a correctly structured object
- [ ] `Repeater` adds, removes, and reorders items; each item emits a correctly typed object
- [ ] `Widgets` shows a type picker; each item renders only its variant's fields
- [ ] `Table` renders scalar fields as inline cell controls; non-scalar columns are rejected with a dev warning
- [ ] `Repeater` is used by default for `z.array(z.object({…}))`; `Table` requires an explicit override or scalar-only detection
- [ ] All controls are keyboard-accessible (WCAG AA)
- [ ] All controls display the field label derived from the field key (title-cased) unless overridden

