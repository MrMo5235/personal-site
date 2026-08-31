'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TurndownService from 'turndown';
import Link from 'next/link';
import type { Note } from '@/content/types';
import { normalizeNoteSlug } from '@/lib/notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type NoteAuth = {
  signedIn: boolean;
  isAdmin: boolean;
  displayName: string;
  signInHref: string;
  signOutHref: string;
};

type NoteDraft = Pick<Note, 'slug' | 'title' | 'summary' | 'content' | 'tags' | 'published'>;

const EMPTY_NOTE: NoteDraft = {
  slug: '',
  title: '',
  summary: '',
  content: '# 新笔记\n\n从这里开始写 Markdown。',
  tags: [],
  published: true,
};

export function NotePageClient({ note, auth }: { note: Note | null; auth: NoteAuth }) {
  const isNew = !note;
  const [editing, setEditing] = useState(isNew && auth.isAdmin);
  const [draft, setDraft] = useState<NoteDraft>(() =>
    note
      ? {
          slug: note.slug,
          title: note.title,
          summary: note.summary,
          content: note.content,
          tags: note.tags,
          published: note.published,
        }
      : { ...EMPTY_NOTE, slug: `note-${Date.now().toString(36)}` },
  );
  const [tagDraft, setTagDraft] = useState(() => draft.tags.join(', '));
  const [status, setStatus] = useState('READY');
  const [busy, setBusy] = useState(false);

  const updatedLabel = useMemo(
    () =>
      note
        ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long' }).format(new Date(note.updatedAt))
        : '尚未发布',
    [note],
  );

  const save = async () => {
    const tags = [...new Set(tagDraft.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))];
    const payload = { ...draft, slug: normalizeNoteSlug(draft.slug), tags };
    if (!payload.title.trim() || !payload.slug) {
      setStatus('需要填写标题和英文 URL 标识');
      return;
    }
    setBusy(true);
    setStatus('SAVING...');
    try {
      const response = await fetch(note ? `/api/notes/${note.id}` : '/api/notes', {
        method: note ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as Note & { error?: string };
      if (!response.ok) throw new Error(result.error || '保存失败');
      window.location.assign(`/notes/${result.slug}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '保存失败');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!note || !window.confirm(`确定删除“${note.title}”吗？`)) return;
    setBusy(true);
    const response = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
    if (response.ok) window.location.assign('/#notes');
    else {
      setStatus('删除失败');
      setBusy(false);
    }
  };

  const importDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatus('PARSING DOCUMENT...');
    try {
      let markdown = '';
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
        markdown = await file.text();
      } else if (lowerName.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
        markdown = turndown.turndown(result.value);
      } else {
        throw new Error('仅支持 .md、.markdown 和 .docx 文件');
      }
      setDraft((current) => ({
        ...current,
        title: current.title || file.name.replace(/\.(md|markdown|docx)$/i, ''),
        content: markdown,
      }));
      setStatus('IMPORT COMPLETE // 请检查后保存');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '文件解析失败');
    } finally {
      setBusy(false);
    }
  };

  if (isNew && !auth.isAdmin) {
    return (
      <main className="note-access">
        <span>ADMIN ONLY</span>
        <h1>NEW NOTE</h1>
        <p>创建笔记需要管理员身份。</p>
        <a className="button button-primary" href={auth.signInHref} target="_top">管理员登录</a>
      </main>
    );
  }

  return (
    <div className="note-shell">
      <header className="note-header">
        <Link className="brand" href="/#notes">
          <span className="brand-mark">PX</span>
          <span className="brand-copy"><strong>PHANTOM X</strong><small>FIELD NOTES</small></span>
        </Link>
        <div className="note-header-actions">
          <Link href="/#notes">← ALL NOTES</Link>
          {auth.isAdmin ? (
            <>
              <button type="button" onClick={() => setEditing((value) => !value)}>
                {editing ? '阅读模式' : '编辑笔记'}
              </button>
              <a href={auth.signOutHref} target="_top">退出登录</a>
            </>
          ) : auth.signedIn ? (
            <a href={auth.signOutHref} target="_top">退出登录</a>
          ) : (
            <a href={auth.signInHref} target="_top">管理员登录</a>
          )}
        </div>
      </header>

      {editing && auth.isAdmin ? (
        <main className="note-editor-shell">
          <div className="note-editor-toolbar">
            <div><span>ADMIN EDIT MODE</span><strong>{status}</strong></div>
            <div>
              {note && <Button variant="destructive" onClick={remove} disabled={busy}>删除</Button>}
              <label className="button button-ghost note-import">
                导入 MD / DOCX
                <input type="file" accept=".md,.markdown,.docx" onChange={importDocument} disabled={busy} />
              </label>
              <Button onClick={save} disabled={busy}>{busy ? '处理中…' : '保存笔记'}</Button>
            </div>
          </div>

          <section className="note-meta-editor">
            <label htmlFor="note-title"><span>标题</span><Input id="note-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label htmlFor="note-slug"><span>URL 标识（英文）</span><Input id="note-slug" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: normalizeNoteSlug(event.target.value) })} /></label>
            <label className="wide" htmlFor="note-summary"><span>摘要</span><Textarea id="note-summary" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
            <label className="wide" htmlFor="note-tags"><span>标签（逗号分隔）</span><Input id="note-tags" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="React, CS2, 随笔" /></label>
            <label className="note-publish-check"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /><span>允许访客查看</span></label>
          </section>

          <section className="markdown-workbench">
            <div className="markdown-source">
              <div className="workbench-label">MARKDOWN SOURCE</div>
              <Textarea value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} spellCheck={false} />
            </div>
            <div className="markdown-preview">
              <div className="workbench-label">LIVE PREVIEW</div>
              <article className="note-prose"><ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content}</ReactMarkdown></article>
            </div>
          </section>
        </main>
      ) : (
        <main className="note-reading-shell">
          <div className="note-reading-meta">
            <span>{note?.published === false ? 'DRAFT' : 'FIELD NOTE'}</span>
            <time>{updatedLabel}</time>
          </div>
          <h1>{note?.title || 'Untitled note'}</h1>
          {note?.summary && <p className="note-summary">{note.summary}</p>}
          <div className="note-tags">{note?.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          <article className="note-prose"><ReactMarkdown remarkPlugins={[remarkGfm]}>{note?.content || ''}</ReactMarkdown></article>
        </main>
      )}
    </div>
  );
}
