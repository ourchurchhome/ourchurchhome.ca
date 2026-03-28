import React, { useState, useCallback } from 'react';
import { EditorState } from 'prosemirror-state';
import type { Transaction } from 'prosemirror-state';
import { schema, defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap, toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';
import { ProseMirror, ProseMirrorDoc, reactKeys, useEditorEventCallback } from '@handlewithcare/react-prosemirror';

// ── Toolbar ──────────────────────────────────────────────────────────────────
function Btn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="px-2 py-1 text-xs font-mono text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
    >
      {label}
    </button>
  );
}

function EditorToolbar() {
  const cmd = (fn: Parameters<typeof useEditorEventCallback>[0]) => useEditorEventCallback(fn); // eslint-disable-line react-hooks/rules-of-hooks

  const bold       = cmd((v) => { toggleMark(schema.marks.strong)(v.state, v.dispatch, v); v.focus(); });
  const italic     = cmd((v) => { toggleMark(schema.marks.em)(v.state, v.dispatch, v); v.focus(); });
  const code       = cmd((v) => { toggleMark(schema.marks.code)(v.state, v.dispatch, v); v.focus(); });
  const h1         = cmd((v) => { setBlockType(schema.nodes.heading, { level: 1 })(v.state, v.dispatch, v); v.focus(); });
  const h2         = cmd((v) => { setBlockType(schema.nodes.heading, { level: 2 })(v.state, v.dispatch, v); v.focus(); });
  const h3         = cmd((v) => { setBlockType(schema.nodes.heading, { level: 3 })(v.state, v.dispatch, v); v.focus(); });
  const para       = cmd((v) => { setBlockType(schema.nodes.paragraph)(v.state, v.dispatch, v); v.focus(); });
  const codeBlock  = cmd((v) => { setBlockType(schema.nodes.code_block)(v.state, v.dispatch, v); v.focus(); });
  const blockquote = cmd((v) => { wrapIn(schema.nodes.blockquote)(v.state, v.dispatch, v); v.focus(); });
  const ul         = cmd((v) => { wrapInList(schema.nodes.bullet_list)(v.state, v.dispatch, v); v.focus(); });
  const ol         = cmd((v) => { wrapInList(schema.nodes.ordered_list)(v.state, v.dispatch, v); v.focus(); });
  const hr         = cmd((v) => {
    const { state, dispatch } = v;
    const tr = state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create());
    dispatch(tr); v.focus();
  });

  const sep = <div className="w-px h-4 bg-gray-700 mx-1 self-center" />;
  return (
    <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-700 bg-gray-900 sticky top-0 z-10">
      <Btn label="B" title="Bold (Ctrl+B)" onClick={bold} />
      <Btn label="I" title="Italic (Ctrl+I)" onClick={italic} />
      <Btn label="`" title="Inline code" onClick={code} />
      {sep}
      <Btn label="H1" title="Heading 1" onClick={h1} />
      <Btn label="H2" title="Heading 2" onClick={h2} />
      <Btn label="H3" title="Heading 3" onClick={h3} />
      <Btn label="¶" title="Paragraph" onClick={para} />
      {sep}
      <Btn label="```" title="Code block" onClick={codeBlock} />
      <Btn label="❝" title="Blockquote" onClick={blockquote} />
      {sep}
      <Btn label="• List" title="Bullet list" onClick={ul} />
      <Btn label="1. List" title="Ordered list" onClick={ol} />
      <Btn label="—" title="Horizontal rule" onClick={hr} />
    </div>
  );
}

// ── VisualEditor ─────────────────────────────────────────────────────────────
function createState(markdown: string): EditorState {
  return EditorState.create({
    doc: defaultMarkdownParser.parse(markdown),
    plugins: [
      history(),
      keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo }),
      keymap(baseKeymap),
      reactKeys(),
    ],
  });
}

export interface VisualEditorProps {
  initialValue?: string;
  name?: string;
}

export function VisualEditor({ initialValue = '', name = 'body' }: VisualEditorProps) {
  const [state, setState] = useState(() => createState(initialValue));
  const [markdown, setMarkdown] = useState(initialValue);

  const dispatch = useCallback((tr: Transaction) => {
    setState((s) => {
      const next = s.apply(tr);
      if (tr.docChanged) setMarkdown(defaultMarkdownSerializer.serialize(next.doc));
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-gray-950">
      <ProseMirror state={state} dispatchTransaction={dispatch}>
        <EditorToolbar />
        <div className="prose prose-sm text-[white!important] max-w-none p-6 flex-1 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full">
          <ProseMirrorDoc />
        </div>
      </ProseMirror>
      <input type="hidden" name={name} value={markdown} />
    </div>
  );
}

