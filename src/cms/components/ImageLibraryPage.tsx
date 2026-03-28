/**
 * src/cms/components/ImageLibraryPage.tsx
 *
 * Full-page image library for /cms/images.
 * Reuses the same /cms/api/images endpoint as the modal, but renders
 * inline (no backdrop / onSelect / onClose).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ImageEntry } from './ImageLibrary';

function fmtSize(bytes: number): string {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageLibraryPage() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/cms/api/images');
      if (!res.ok) throw new Error(`Failed to load images (${res.status})`);
      setImages(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/cms/api/images', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as any).error ?? `Upload failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (img: ImageEntry) => {
    if (!confirm(`Delete "${img.filename}"?`)) return;
    setDeleting(img.path);
    setError(null);
    try {
      const res = await fetch('/cms/api/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: img.path, sha: img.sha }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as any).error ?? `Delete failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-5 h-[60px] border-b border-gray-800">
        <h1 className="text-sm font-semibold text-white">Images</h1>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
        >
          {uploading ? 'Uploading…' : '+ Upload'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <p className="mb-4 text-xs text-red-400 bg-red-900/30 border border-red-700 rounded px-3 py-2">{error}</p>
        )}
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-16">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-16">No images yet. Upload one to get started.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {images.map((img) => (
              <div key={img.path} className="group relative flex flex-col gap-1">
                <div className="w-full aspect-square rounded-md overflow-hidden border border-gray-700 bg-gray-800">
                  <img src={img.url} alt={img.filename} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <p className="text-xs text-gray-400 truncate text-center px-0.5" title={img.filename}>{img.filename}</p>
                {img.sizeBytes > 0 && (
                  <p className="text-xs text-gray-600 text-center">{fmtSize(img.sizeBytes)}</p>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  disabled={deleting === img.path}
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-700 hover:bg-red-600 disabled:opacity-60 rounded text-white text-xs leading-none transition-colors"
                  title="Delete image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

