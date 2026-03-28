import React, { useState } from 'react';
import type { ResolvedField } from '../config';
import { FieldsPane } from './FieldsPane';
import { VisualEditor } from './VisualEditor';

export interface EditorLayoutProps {
  hasBody: boolean;
  fields: ResolvedField[];
  initialValues: Record<string, unknown>;
  initialBody?: string;
  bodyFieldName?: string;
}

export function EditorLayout({
  hasBody,
  fields,
  initialValues,
  initialBody = '',
  bodyFieldName = 'body',
}: EditorLayoutProps) {
  const [activePane, setActivePane] = useState<'fields' | 'editor'>('fields');

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

  // Left pane: hidden on mobile when editor tab is active (and hasBody)
  const leftHidden = hasBody && activePane === 'editor';
  // Right pane: hidden on mobile when fields tab is active
  const rightHidden = activePane === 'fields';

  return (
    <div className="flex flex-col h-full">
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
            hasBody
              ? 'lg:w-1/2 lg:border-r lg:border-gray-800'
              : 'w-full',
            leftHidden ? 'hidden lg:block' : 'flex-1 lg:flex-none',
          ].join(' ')}
        >
          {fields.length > 0 ? (
            <FieldsPane fields={fields} initialValues={initialValues} />
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
            <VisualEditor initialValue={initialBody} name={bodyFieldName} />
          </div>
        )}
      </div>
    </div>
  );
}

