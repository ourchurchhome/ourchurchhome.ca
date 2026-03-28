import React, { useState } from 'react';
import type { ResolvedField, FieldComponentProps } from '../config';

const inputCls =
  'w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';

// ── TagInput ────────────────────────────────────────────────────────────────
function TagInput({ name, tags, onChange }: { name: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded text-xs">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-white leading-none">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className={inputCls}
        placeholder="Type and press Enter to add…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const t = input.trim();
            if (t && !tags.includes(t)) onChange([...tags, t]);
            setInput('');
          }
        }}
      />
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ name, value, onChange }: { name: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name={name} value={value ? 'true' : 'false'} />
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <span className="text-sm text-gray-400">{value ? 'Enabled' : 'Disabled'}</span>
    </div>
  );
}

// ── FieldControl ────────────────────────────────────────────────────────────
function FieldControl({ field, value, onChange, namePrefix }: {
  field: ResolvedField; value: unknown; onChange: (v: unknown) => void; namePrefix: string;
}) {
  const name = namePrefix ? `${namePrefix}.${field.key}` : field.key;
  const str = typeof value === 'string' ? value : '';
  const num = typeof value === 'number' ? value : '';

  if (typeof field.control === 'function') {
    const C = field.control as React.ComponentType<FieldComponentProps>;
    return <C value={value} onChange={onChange} field={field} />;
  }

  switch (field.control) {
    case 'TextArea': {
      const textVal = typeof value === 'string' ? value : (value != null ? JSON.stringify(value, null, 2) : '');
      return <textarea id={name} name={name} className={`${inputCls} min-h-[6rem] resize-y font-mono`} value={textVal} required={field.required} rows={6} onChange={(e) => onChange(e.target.value)} />;
    }
    case 'NumberInput':
      return <input id={name} type="number" name={name} className={inputCls} value={num} required={field.required} onChange={(e) => onChange(e.target.valueAsNumber)} />;
    case 'DatePicker': {
      const d = value instanceof Date ? value.toISOString().split('T')[0] : str.split('T')[0];
      return <input id={name} type="date" name={name} className={inputCls} value={d} required={field.required} onChange={(e) => onChange(e.target.value)} />;
    }
    case 'Toggle':
      return <Toggle name={name} value={!!value} onChange={onChange} />;
    case 'Select':
      return (
        <select id={name} name={name} className={inputCls} value={str} required={field.required} onChange={(e) => onChange(e.target.value)}>
          {!field.required && <option value="">— Select —</option>}
          {(Array.isArray(field.options) ? field.options : []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'TagInput':
      return <TagInput name={name} tags={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
    case 'UrlInput':
      return <input id={name} type="url" name={name} className={inputCls} value={str} required={field.required} onChange={(e) => onChange(e.target.value)} />;
    case 'EmailInput':
      return <input id={name} type="email" name={name} className={inputCls} value={str} required={field.required} onChange={(e) => onChange(e.target.value)} />;
    default: // TextInput, ImageUrl, unknown
      return <input id={name} type="text" name={name} className={inputCls} value={str} required={field.required} onChange={(e) => onChange(e.target.value)} />;
  }
}

// ── FieldsPane ──────────────────────────────────────────────────────────────
export interface FieldsPaneProps {
  fields: ResolvedField[];
  initialValues: Record<string, unknown>;
  namePrefix?: string;
}

export function FieldsPane({ fields, initialValues, namePrefix = '' }: FieldsPaneProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const set = (key: string, v: unknown) => setValues((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.key}>
          <label htmlFor={namePrefix ? `${namePrefix}.${field.key}` : field.key} className="block text-sm font-medium text-gray-300 mb-1">
            {field.label}
            {field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          {field.type === 'object' && field.children ? (
            <div className="pl-3 border-l border-gray-700">
              <FieldsPane
                fields={field.children}
                initialValues={(typeof values[field.key] === 'object' && values[field.key] !== null ? values[field.key] : {}) as Record<string, unknown>}
                namePrefix={namePrefix ? `${namePrefix}.${field.key}` : field.key}
              />
            </div>
          ) : (
            <FieldControl
              field={field}
              value={values[field.key]}
              onChange={(v) => set(field.key, v)}
              namePrefix={namePrefix}
            />
          )}
        </div>
      ))}
    </div>
  );
}

