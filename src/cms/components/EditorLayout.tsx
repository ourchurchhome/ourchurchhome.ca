import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import type { ResolvedField } from '../config';
import { FieldsPane } from './FieldsPane';
import { VisualEditor } from './VisualEditor';

type SaveStatus = 'unchanged' | 'dirty' | 'invalid' | 'saving' | 'saved' | 'error';

export interface EditorLayoutProps {
  hasBody: boolean;
  fields: ResolvedField[];
  initialValues: Record<string, unknown>;
  initialBody?: string;
  bodyFieldName?: string;
  singleton: boolean;
  /** Display label for the collection (breadcrumb) */
  collectionLabel: string;
  /** URL of the collection list page (breadcrumb + Cancel) */
  collectionHref: string;
  /** Slug of the current item — shown/editable in the breadcrumb for existing items */
  slug: string;
  /** Current GitHub blob SHA — required to avoid 409 conflicts on update */
  initialSha: string;
  /** When true, renders the slug input and POSTs a create; redirects on success */
  isNew?: boolean;
  /**
   * When true (default), existing items show an editable slug input.
   * Set to false for singletons whose slug must not be changed.
   */
  allowSlugRename?: boolean;
  /**
   * When set, a "Preview" button appears in the header. Clicking it
   * base64-encodes the current form values and opens
   * `{previewUrl}?draft={encoded}` in a new tab.
   */
  previewUrl?: string;
}

export function EditorLayout({
  hasBody,
  fields,
  initialValues,
  initialBody = '',
  bodyFieldName = 'body',
  singleton,
  collectionLabel,
  collectionHref,
  slug,
  initialSha,
  isNew = false,
  allowSlugRename = true,
  previewUrl,
}: EditorLayoutProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [activePane, setActivePane] = useState<'fields' | 'editor'>('fields');
  const [currentSha, setCurrentSha] = useState(initialSha);
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unchanged');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Track live field values so the Preview button always encodes the latest state
  const [currentValues, setCurrentValues] = useState<Record<string, unknown>>(initialValues);

  // ── Undo / redo history ───────────────────────────────────────────────────
  // Stored in refs so mutations never trigger re-renders.
  const MAX_HISTORY = 100;
  const historyRef = useRef<Record<string, unknown>[]>([initialValues]);
  const historyIndexRef = useRef(0);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When non-undefined this is pushed into FieldsPane as externalValues to
  // restore a historical snapshot without remounting the component.
  const [restoredValues, setRestoredValues] = useState<Record<string, unknown> | undefined>(undefined);

  // ── Slug validation ───────────────────────────────────────────────────────────
  const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
  function validateSlug(val: string): string | null {
    if (!val) return 'Slug is required';
    if (!SLUG_RE.test(val)) return 'Only lowercase letters, numbers, and hyphens. Must start with a letter or number.';
    return null;
  }

  // ── TanStack Form ────────────────────────────────────────────────────────────
  const form = useForm({
    defaultValues: {},
    onSubmit: async () => {
      const el = formRef.current;
      if (!el) return;

      // Validate the slug field first (real-time state may already show an error)
      const slugFieldVal = isNew
        ? ((el.elements.namedItem('__slug') as HTMLInputElement | null)?.value ?? '')
        : (allowSlugRename ? currentSlug : slug);
      const slugErr = (isNew || allowSlugRename) ? validateSlug(slugFieldVal) : null;
      if (slugErr) {
        setSlugError(slugErr);
        setSaveStatus('invalid');
        return;
      }

      // Native HTML constraint validation (required fields, patterns, etc.)
      if (!el.checkValidity()) {
        el.reportValidity();
        setSaveStatus('invalid');
        return;
      }

      setSaveStatus('saving');
      setErrorMsg(null);

      try {
        const formData = new FormData(el);
        // Ensure the in-memory SHA is used (not the stale server-rendered value)
        formData.set('__sha', currentSha);

        const res = await fetch(window.location.href, {
          method: 'POST',
          headers: { 'X-CMS-Fetch': '1' },
          body: formData,
        });

        const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

        if (!res.ok) {
          throw new Error((json.error as string | undefined) ?? `Save failed (${res.status})`);
        }

        // New-item creation OR slug rename: server returns a redirect URL
        if (typeof json.redirectUrl === 'string') {
          if (isNew) {
            // Full navigation to the new item's editor
            window.location.href = json.redirectUrl;
            return;
          }
          // Slug rename: update the URL bar without reloading the page
          history.replaceState(null, '', json.redirectUrl);
          // Extract the new slug from the URL so subsequent saves POST to the right place
          const parts = (json.redirectUrl as string).split('/');
          setCurrentSlug(parts[parts.length - 1]);
        }

        // Capture the new SHA for subsequent saves
        if (typeof json.sha === 'string') {
          setCurrentSha(json.sha);
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('unchanged'), 3000);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Save failed');
        setSaveStatus('error');
      }
    },
  });

  // ── Dirty tracking ───────────────────────────────────────────────────────────
  const markDirty = useCallback(() => {
    setSaveStatus((prev) => (prev === 'saving' ? prev : 'dirty'));
  }, []);

  // Typed wrappers to satisfy FieldsPane / VisualEditor callback signatures
  const handleFieldsChange = useCallback(
    (values: Record<string, unknown>) => {
      setCurrentValues(values);
      markDirty();
      // Debounce snapshot: wait for 1s of inactivity before committing to history.
      if (historyDebounceRef.current !== null) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => {
        historyDebounceRef.current = null;
        // Truncate any "future" entries that exist after the current index
        // (user made a change after undoing).
        const next = historyRef.current.slice(0, historyIndexRef.current + 1);
        next.push(values);
        if (next.length > MAX_HISTORY) next.shift();
        historyRef.current = next;
        historyIndexRef.current = next.length - 1;
      }, 1000);
    },
    [markDirty]
  );
  const handleBodyChange = useCallback((_md: string) => markDirty(), [markDirty]);

  // ── Preview handler ───────────────────────────────────────────────────────────
  const handlePreview = useCallback(() => {
    if (!previewUrl) return;
    try {
      // Interpolate {slug} and any {fieldName} tokens in the URL template.
      const resolvedUrl = previewUrl.replace(/\{([^}]+)\}/g, (_, key) => {
        if (key === 'slug') return encodeURIComponent(currentSlug);
        const val = currentValues[key];
        return val != null ? encodeURIComponent(String(val)) : '';
      });
      const json = JSON.stringify(currentValues);
      // Encode as UTF-8 bytes → binary string → base64 (matches Node's Buffer decode)
      const bytes = new TextEncoder().encode(json);
      const binary = String.fromCharCode(...bytes);
      const b64 = btoa(binary);
      window.open(`${resolvedUrl}?draft=${encodeURIComponent(b64)}`, '_blank', 'noopener');
    } catch {
      // Encoding failed — open the page without draft data as a fallback
      window.open(previewUrl, '_blank', 'noopener');
    }
  }, [previewUrl, currentValues, currentSlug]);

  // ── Undo / redo keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      if (e.key === 'z' && !e.shiftKey) {
        // Undo
        if (historyIndexRef.current <= 0) return;
        e.preventDefault();
        historyIndexRef.current -= 1;
        const snapshot = historyRef.current[historyIndexRef.current];
        setRestoredValues({ ...snapshot });
        setCurrentValues(snapshot);
        markDirty();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        // Redo
        if (historyIndexRef.current >= historyRef.current.length - 1) return;
        e.preventDefault();
        historyIndexRef.current += 1;
        const snapshot = historyRef.current[historyIndexRef.current];
        setRestoredValues({ ...snapshot });
        setCurrentValues(snapshot);
        markDirty();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [markDirty]);

  // ── Unsaved-changes guard ─────────────────────────────────────────────────────
  // Covers: breadcrumb link, Cancel button, browser back, tab close.
  useEffect(() => {
    const hasUnsaved = saveStatus === 'dirty' || saveStatus === 'invalid' || saveStatus === 'error';
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusEl = (() => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-xs text-blue-400 animate-pulse">Saving…</span>;
      case 'saved':
        return <span className="text-xs text-green-400">✓ Saved</span>;
      case 'error':
        return (
          <span className="text-xs text-red-400" title={errorMsg ?? undefined}>
            Save failed
          </span>
        );
      case 'invalid':
        return <span className="text-xs text-red-400">Check required fields</span>;
      case 'dirty':
        return <span className="text-xs text-amber-400">Unsaved changes</span>;
      default:
        return null;
    }
  })();

  // ── Tab helpers (mobile) ─────────────────────────────────────────────────────
  const tabBtn = (pane: 'fields' | 'editor', label: string) => (
    <button
      type="button"
      onClick={() => setActivePane(pane)}
      className={[
        'flex-1 py-2.5 text-sm font-medium transition-colors border-b-2',
        activePane === pane
          ? 'text-white border-blue-500'
          : 'text-gray-400 hover:text-gray-200 border-transparent',
      ].join(' ')}
    >
      {label}
    </button>
  );

  const leftHidden = hasBody && activePane === 'editor';
  const rightHidden = activePane === 'fields';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <form
      ref={formRef}
      method="POST"
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
      className="h-full flex flex-col"
    >
      {/* SHA hidden field — kept in sync via currentSha state */}
      <input type="hidden" name="__sha" value={currentSha} />

      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-5 h-[60px] border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!singleton && (
            <>
              <a
                href={collectionHref}
                className="text-gray-400 hover:text-white text-sm transition-colors shrink-0"
              >
                ← {collectionLabel}
              </a>
              <span className="text-gray-600 shrink-0">/</span>
            </>
          )}
          {isNew ? (
            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              <input
                id="__slug"
                type="text"
                name="__slug"
                required
                pattern="[a-z0-9][a-z0-9-]*"
                placeholder="new-item-slug"
                title="Lowercase letters, numbers, and hyphens. Must start with a letter or number."
                onChange={(e) => setSlugError(validateSlug(e.target.value))}
                className={[
                  'min-w-0 w-full bg-gray-900 border rounded-md px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 font-mono',
                  slugError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-700 focus:ring-blue-500 focus:border-blue-500',
                ].join(' ')}
              />
              {slugError && <span className="text-xs text-red-400 leading-tight">{slugError}</span>}
            </div>
          ) : allowSlugRename ? (
            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              <input
                id="__newSlug"
                type="text"
                name="__newSlug"
                required
                pattern="[a-z0-9][a-z0-9-]*"
                title="Lowercase letters, numbers, and hyphens. Must start with a letter or number."
                value={currentSlug}
                onChange={(e) => {
                  setCurrentSlug(e.target.value);
                  setSlugError(validateSlug(e.target.value));
                  markDirty();
                }}
                className={[
                  'min-w-0 w-full border rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 font-mono transition-colors',
                  slugError
                    ? 'bg-gray-900 border-red-500 focus:ring-red-500'
                    : 'bg-transparent border-transparent hover:border-gray-700 focus:border-gray-600 focus:bg-gray-900 focus:ring-blue-500',
                ].join(' ')}
              />
              {slugError && <span className="text-xs text-red-400 leading-tight">{slugError}</span>}
            </div>
          ) : (
            <h1 className="text-sm font-semibold text-white font-mono truncate">{currentSlug}</h1>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {statusEl}
          {previewUrl && (
            <button
              type="button"
              onClick={handlePreview}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Preview ↗
            </button>
          )}
          <a
            href={collectionHref}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={form.state.isSubmitting}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
          >
            {form.state.isSubmitting ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Mobile tab toggle — only shown when there is a body editor */}
      {hasBody && (
        <div className="lg:hidden flex shrink-0 border-b border-gray-800 bg-gray-900">
          {tabBtn('fields', 'Fields')}
          {tabBtn('editor', 'Content')}
        </div>
      )}

      {/* Pane row */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Left pane — Fields */}
        <div
          className={[
            'overflow-y-auto p-6',
            hasBody ? 'lg:w-1/2 lg:border-r lg:border-gray-800' : 'w-full',
            leftHidden ? 'hidden lg:block' : 'flex-1 lg:flex-none',
          ].join(' ')}
        >
          {fields.length > 0 ? (
            <FieldsPane fields={fields} initialValues={initialValues} onChange={handleFieldsChange} externalValues={restoredValues} />
          ) : (
            <p className="text-gray-500 text-sm">No fields configured.</p>
          )}
        </div>

        {/* Right pane — Visual editor (only when hasBody) */}
        {hasBody && (
          <div
            className={[
              'overflow-y-auto',
              rightHidden ? 'hidden lg:block' : 'flex-1 lg:flex-none',
              'lg:flex-1',
            ].join(' ')}
          >
            <VisualEditor initialValue={initialBody} name={bodyFieldName} onChange={handleBodyChange} />
          </div>
        )}
      </div>
    </form>
  );
}

