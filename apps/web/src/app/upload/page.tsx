'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../components/ui';

interface DocItem {
  id: string;
  title: string;
  type: string;
  mimeType?: string;
  fileSize?: number;
  status: string;
  tags: string[];
  createdAt: string;
}

const FILE_TYPES = [
  { ext: 'audio', label: 'Audio', icon: '🎵' },
  { ext: 'video', label: 'Video', icon: '🎬' },
  { ext: 'pdf', label: 'PDF', icon: '📕' },
  { ext: 'doc', label: 'Word', icon: '📝' },
  { ext: 'xls', label: 'Excel', icon: '📊' },
  { ext: 'ppt', label: 'PPT', icon: '📽' },
  { ext: 'md', label: 'Markdown', icon: '📋' },
  { ext: 'txt', label: 'TXT', icon: '📄' },
  { ext: 'img', label: 'Image', icon: '🖼' },
  { ext: 'zip', label: 'ZIP', icon: '📦' },
];

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export default function UploadPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...(typeFilter && { type: typeFilter }) });
    fetch(`/api/documents?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setDocs(res.data.items ?? []);
          setTotal(res.data.total ?? 0);
        }
      })
      .catch(() => {});
  }, [page, typeFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const uid = crypto.randomUUID();
      const item: UploadItem = { id: uid, name: file.name, progress: 0, status: 'pending' };
      setUploads((prev) => [...prev, item]);

      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 30;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          setUploads((prev) => prev.map((u) => u.id === uid ? { ...u, progress: 100, status: 'processing' } : u));

          fetch('/api/documents/simulate-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, mimeType: file.type || 'application/octet-stream', fileSize: file.size }),
          })
            .then((r) => r.json())
            .then(() => {
              setUploads((prev) => prev.map((u) => u.id === uid ? { ...u, status: 'completed' } : u));
              fetchDocs();
            })
            .catch(() => {
              setUploads((prev) => prev.map((u) => u.id === uid ? { ...u, status: 'failed', error: 'Upload failed' } : u));
            });
        } else {
          setUploads((prev) => prev.map((u) => u.id === uid ? { ...u, progress: Math.min(prog, 99), status: 'uploading' } : u));
        }
      }, 200);
    });
  }, [fetchDocs]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <PageHeader title="上传中心" />

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-secondary)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-3xl)',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'var(--bg-hover)' : 'var(--bg-secondary)',
          transition: 'all 0.2s',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>📤</div>
        <p style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>拖拽文件到此处或点击上传</p>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>支持 Audio, Video, PDF, Word, Excel, PPT, Markdown, TXT, Image, ZIP</p>
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* File Type Quick Buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {FILE_TYPES.map((ft) => (
          <Badge key={ft.ext}>{ft.icon} {ft.label}</Badge>
        ))}
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card title="上传进度" >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {uploads.map((u) => (
              <div key={u.id} style={{ padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: 'var(--font-sm)' }}>{u.name}</span>
                  <span style={{ fontSize: 'var(--font-sm)', color: u.status === 'completed' ? 'var(--accent-green)' : u.status === 'failed' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    {u.status === 'completed' ? '✓ 完成' : u.status === 'failed' ? '✗ 失败' : u.status === 'processing' ? '处理中...' : `${Math.round(u.progress)}%`}
                  </span>
                </div>
                <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border-primary)' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px', width: `${u.progress}%`,
                    background: u.status === 'completed' ? 'var(--accent-green)' : u.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-blue)',
                    transition: 'width 0.2s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Document List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>文档列表</h3>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{
          padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)',
          background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 'var(--font-sm)',
        }}>
          <option value="">全部类型</option>
          {FILE_TYPES.map((ft) => <option key={ft.ext} value={ft.ext}>{ft.label}</option>)}
        </select>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon="📄" text="暂无文档" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {docs.map((d) => (
            <div key={d.id} style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>{d.title}</span>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                  {d.type} · {d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : 'N/A'} · {new Date(d.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
              <Badge color={d.status === 'COMPLETED' ? 'var(--accent-green)' : 'var(--text-muted)'}>{d.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)', padding: 'var(--space-md) 0', borderTop: '1px solid var(--border-primary)' }}>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>第 {page} / {totalPages} 页</span>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      </div>
    </div>
  );
}
