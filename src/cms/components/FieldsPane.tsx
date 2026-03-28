import React, { useState, useRef } from 'react';
import type { ResolvedField, FieldComponentProps } from '../config';

const inputCls =
  'w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
const btnGhost =
  'text-gray-500 hover:text-white disabled:opacity-30 text-xs px-1 py-0.5 rounded transition-colors';

// ── TagInput ────────────────────────────────────────────────────────────────
function TagInput({ name, tags, onChange }: { name: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const commit = (raw: string) => {
    const t = raw.trim().replace(/,$/, '').trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded text-xs">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-white leading-none" aria-label={`Remove ${tag}`}>×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className={inputCls}
        placeholder="Type and press Enter or , to add…"
        value={input}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(',')) { commit(v); } else { setInput(v); }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(input); }
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

// ── Group ────────────────────────────────────────────────────────────────────
function GroupControl({ field, value, onChange, namePrefix }: {
  field: ResolvedField; value: unknown; onChange: (v: unknown) => void; namePrefix: string;
}) {
  const [open, setOpen] = useState(true);
  const obj = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  return (
    <div className="border border-gray-700 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 text-sm text-gray-300 hover:bg-gray-750 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium">{field.label}</span>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-3 border-t border-gray-700">
          <FieldsPane
            fields={field.children ?? []}
            initialValues={obj}
            namePrefix={namePrefix}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}

// ── Repeater ─────────────────────────────────────────────────────────────────
function RepeaterControl({ field, value, onChange, name }: {
  field: ResolvedField; value: unknown; onChange: (v: unknown) => void; name: string;
}) {
  const init = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const nextId = useRef(init.length);
  // Each item is wrapped in { id, data } — id is stable across reorders so
  // React correctly moves FieldsPane instances rather than reconciling in place.
  const [items, setItems] = useState<{ id: number; data: Record<string, unknown> }[]>(
    () => init.map((data, i) => ({ id: i, data }))
  );
  const update = (next: typeof items) => { setItems(next); onChange(next.map((r) => r.data)); };
  const addItem = () => { const id = nextId.current++; update([...items, { id, data: {} }]); };
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(items.map((r) => r.data))} />
      {items.map(({ id, data }, i) => (
        <div key={id} className="border border-gray-700 rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
            <span className="text-xs text-gray-500 font-mono">Item {i + 1}</span>
            <div className="flex gap-0.5">
              <button type="button" disabled={i === 0} onClick={() => { const n=[...items];[n[i-1],n[i]]=[n[i],n[i-1]];update(n); }} className={btnGhost} aria-label="Move up">↑</button>
              <button type="button" disabled={i === items.length-1} onClick={() => { const n=[...items];[n[i],n[i+1]]=[n[i+1],n[i]];update(n); }} className={btnGhost} aria-label="Move down">↓</button>
              <button type="button" onClick={() => update(items.filter((_,j)=>j!==i))} className={`${btnGhost} text-red-500 hover:text-red-300`} aria-label="Remove item">✕</button>
            </div>
          </div>
          <div className="p-3">
            <FieldsPane
              fields={field.elementChildren ?? []}
              initialValues={data}
              namePrefix={`${name}[${i}]`}
              onChange={(v) => { const n=[...items]; n[i]={ id, data: v as Record<string,unknown> }; update(n); }}
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem}
        className="w-full py-2 border border-dashed border-gray-600 rounded-md text-sm text-gray-400 hover:text-white hover:border-gray-400 transition-colors">
        + Add item
      </button>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
function TableControl({ field, value, onChange, name }: {
  field: ResolvedField; value: unknown; onChange: (v: unknown) => void; name: string;
}) {
  const cols = field.elementChildren ?? [];
  const init = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const [rows, setRows] = useState<Record<string, unknown>[]>(init);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);

  const update = (next: Record<string, unknown>[]) => { setRows(next); onChange(next); };
  const setCell = (r: number, k: string, v: unknown) => {
    update(rows.map((row, i) => i === r ? { ...row, [k]: v } : row));
  };

  const handleDragStart = (r: number) => {
    dragIndex.current = r;
  };
  const handleDragOver = (e: React.DragEvent, r: number) => {
    e.preventDefault(); // required to allow drop
    if (dragIndex.current !== null && dragIndex.current !== r) setDragOverIndex(r);
  };
  const handleDrop = (r: number) => {
    const from = dragIndex.current;
    if (from === null || from === r) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(r, 0, moved);
    update(next);
    dragIndex.current = null;
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="overflow-x-auto">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <table className="w-full text-sm border border-gray-700 rounded-md overflow-hidden">
        <thead>
          <tr className="bg-gray-800 border-b border-gray-700">
            {/* drag handle column header */}
            <th className="w-6" />
            {cols.map((c) => (
              <th key={c.key} className="px-2 py-1.5 text-left text-xs font-medium text-gray-400">{c.label}</th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              draggable
              onDragStart={() => handleDragStart(r)}
              onDragOver={(e) => handleDragOver(e, r)}
              onDrop={() => handleDrop(r)}
              onDragEnd={handleDragEnd}
              className={[
                'border-b border-gray-700/50 last:border-0 transition-colors',
                dragOverIndex === r ? 'bg-blue-900/30 border-blue-500/50' : '',
              ].join(' ')}
            >
              {/* drag handle cell */}
              <td className="px-1 py-1 text-center cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 select-none">
                ⠿
              </td>
              {cols.map((c) => (
                <td key={c.key} className="px-1 py-1">
                  <FieldControl field={c} value={row[c.key]} onChange={(v) => setCell(r, c.key, v)} namePrefix={`${name}[${r}]`} />
                </td>
              ))}
              <td className="px-1 py-1 text-center">
                <button type="button" onClick={() => update(rows.filter((_,i)=>i!==r))} className={`${btnGhost} text-red-500 hover:text-red-300`} aria-label="Remove row">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => update([...rows, {}])}
        className="mt-2 w-full py-1.5 border border-dashed border-gray-600 rounded-md text-sm text-gray-400 hover:text-white hover:border-gray-400 transition-colors">
        + Add row
      </button>
    </div>
  );
}

// ── Widgets ───────────────────────────────────────────────────────────────────
function WidgetsControl({ field, value, onChange, name }: {
  field: ResolvedField; value: unknown; onChange: (v: unknown) => void; name: string;
}) {
  const variants = field.widgetVariants ?? [];
  const discriminantKey = field.discriminantKey ?? 'type';
  const init = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const nextId = useRef(init.length);
  const [items, setItems] = useState<{ id: number; data: Record<string, unknown> }[]>(
    () => init.map((data, i) => ({ id: i, data }))
  );
  const update = (next: typeof items) => { setItems(next); onChange(next.map((r) => r.data)); };
  const addVariant = (dv: string) => { const id = nextId.current++; update([...items, { id, data: { [discriminantKey]: dv } }]); };
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(items.map((r) => r.data))} />
      {items.map(({ id, data }, i) => {
        const dv = String(data[discriminantKey] ?? '');
        const variant = variants.find((v) => v.discriminantValue === dv);
        return (
          <div key={id} className="border border-gray-700 rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-mono">{dv || 'widget'} <span className="text-gray-600">#{i + 1}</span></span>
              <div className="flex gap-0.5">
                <button type="button" disabled={i===0} onClick={() => { const n=[...items];[n[i-1],n[i]]=[n[i],n[i-1]];update(n); }} className={btnGhost} aria-label="Move up">↑</button>
                <button type="button" disabled={i===items.length-1} onClick={() => { const n=[...items];[n[i],n[i+1]]=[n[i+1],n[i]];update(n); }} className={btnGhost} aria-label="Move down">↓</button>
                <button type="button" onClick={() => update(items.filter((_,j)=>j!==i))} className={`${btnGhost} text-red-500 hover:text-red-300`} aria-label="Remove widget">✕</button>
              </div>
            </div>
            {variant && (
              <div className="p-3">
                <FieldsPane
                  fields={variant.children}
                  initialValues={data}
                  namePrefix={`${name}[${i}]`}
                  onChange={(v) => { const n=[...items]; n[i]={ id, data: {...v as Record<string,unknown>,[discriminantKey]:dv} }; update(n); }}
                />
              </div>
            )}
          </div>
        );
      })}
      {variants.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {variants.map((v) => (
            <button key={v.discriminantValue} type="button" onClick={() => addVariant(v.discriminantValue)}
              className="py-1.5 px-3 border border-dashed border-gray-600 rounded-md text-sm text-gray-400 hover:text-white hover:border-gray-400 transition-colors">
              + {v.discriminantValue}
            </button>
          ))}
        </div>
      )}
      {variants.length === 0 && (
        <p className="text-xs text-yellow-600">No widget variants configured. Add <code>widgetVariants</code> to this field in cms.config.ts.</p>
      )}
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
      return <textarea id={name} name={name} className={`${inputCls} min-h-[6rem] resize-y`} value={textVal} required={field.required} rows={4} onChange={(e) => onChange(e.target.value)} />;
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
    case 'Group':
      return <GroupControl field={field} value={value} onChange={onChange} namePrefix={name} />;
    case 'Repeater':
      return <RepeaterControl field={field} value={value} onChange={onChange} name={name} />;
    case 'Table':
      return <TableControl field={field} value={value} onChange={onChange} name={name} />;
    case 'Widgets':
      return <WidgetsControl field={field} value={value} onChange={onChange} name={name} />;
    default: // TextInput, ImageUrl, unknown
      return <input id={name} type="text" name={name} className={inputCls} value={str} required={field.required} onChange={(e) => onChange(e.target.value)} />;
  }
}

// ── FieldsPane ──────────────────────────────────────────────────────────────
export interface FieldsPaneProps {
  fields: ResolvedField[];
  initialValues: Record<string, unknown>;
  namePrefix?: string;
  /** Called whenever any field value changes, with the full updated values map. */
  onChange?: (values: Record<string, unknown>) => void;
}

export function FieldsPane({ fields, initialValues, namePrefix = '', onChange }: FieldsPaneProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const set = (key: string, v: unknown) => setValues((prev) => {
    const next = { ...prev, [key]: v };
    onChange?.(next);
    return next;
  });

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        // Group renders its own label inside its collapsible header; all others need one here.
        const hasOwnLabel = field.control === 'Group';
        return (
          <div key={field.key}>
            {!hasOwnLabel && (
              <label htmlFor={namePrefix ? `${namePrefix}.${field.key}` : field.key} className="block text-sm font-medium text-gray-300 mb-1">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
            )}
            <FieldControl
              field={field}
              value={values[field.key]}
              onChange={(v) => set(field.key, v)}
              namePrefix={namePrefix}
            />
          </div>
        );
      })}
    </div>
  );
}

