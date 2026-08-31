'use client';

import { FormEvent, useState } from 'react';
import type { MediaAsset, SiteContent } from '@/content/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function AdminDashboard({
  initialContent,
  initialMedia,
  email,
  signOutHref,
}: {
  initialContent: SiteContent;
  initialMedia: MediaAsset[];
  email: string;
  signOutHref: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(initialContent, null, 2));
  const [media, setMedia] = useState(initialMedia);
  const [status, setStatus] = useState('SYSTEM READY');
  const [busy, setBusy] = useState(false);

  const updateContent = (next: SiteContent) => {
    setContent(next);
    setJsonDraft(JSON.stringify(next, null, 2));
  };

  const updatePlayer = (key: keyof SiteContent['player'], value: string) => {
    updateContent({ ...content, player: { ...content.player, [key]: value } });
  };

  const updateProfileField = (oldLabel: string, label: string, value: string) => {
    const entries = Object.entries(content.profile.fields).map(([key, current]) =>
      key === oldLabel ? [label || oldLabel, value] : [key, current],
    );
    updateContent({
      ...content,
      profile: { ...content.profile, fields: Object.fromEntries(entries) },
    });
  };

  const addProfileField = () => {
    let index = Object.keys(content.profile.fields).length + 1;
    let label = `NEW FIELD ${index}`;
    while (label in content.profile.fields) label = `NEW FIELD ${++index}`;
    updateContent({
      ...content,
      profile: {
        ...content.profile,
        fields: { ...content.profile.fields, [label]: 'New value' },
      },
    });
  };

  const removeProfileField = (label: string) => {
    const fields = { ...content.profile.fields };
    delete fields[label];
    updateContent({ ...content, profile: { ...content.profile, fields } });
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as SiteContent;
      updateContent(parsed);
      setStatus('JSON APPLIED // SAVE TO PUBLISH');
    } catch {
      setStatus('ERROR // INVALID JSON');
    }
  };

  const saveContent = async () => {
    setBusy(true);
    setStatus('SAVING CONFIGURATION...');
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Save failed');
      setStatus('CONFIGURATION SAVED // LIVE');
    } catch (error) {
      setStatus(`ERROR // ${error instanceof Error ? error.message : 'SAVE FAILED'}`);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStatus('UPLOADING FILE...');
    const form = event.currentTarget;
    try {
      const response = await fetch('/api/media', { method: 'POST', body: new FormData(form) });
      const result = (await response.json()) as MediaAsset & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      setMedia((items) => [...items, result]);
      form.reset();
      setStatus('UPLOAD COMPLETE // LIVE');
    } catch (error) {
      setStatus(`ERROR // ${error instanceof Error ? error.message : 'UPLOAD FAILED'}`);
    } finally {
      setBusy(false);
    }
  };

  const removeMedia = async (asset: MediaAsset) => {
    if (!window.confirm(`确定删除 ${asset.name}？`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/media/${asset.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      setMedia((items) => items.filter((item) => item.id !== asset.id));
      setStatus('FILE DELETED');
    } catch (error) {
      setStatus(`ERROR // ${error instanceof Error ? error.message : 'DELETE FAILED'}`);
    } finally {
      setBusy(false);
    }
  };

  const moveMedia = async (asset: MediaAsset, direction: -1 | 1) => {
    const group = media
      .filter((item) => item.category === asset.category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = group.findIndex((item) => item.id === asset.id);
    const target = group[currentIndex + direction];
    if (!target) return;
    setBusy(true);
    try {
      const requests = [
        fetch(`/api/media/${asset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: target.sortOrder }),
        }),
        fetch(`/api/media/${target.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: asset.sortOrder }),
        }),
      ];
      const responses = await Promise.all(requests);
      if (responses.some((response) => !response.ok)) throw new Error('Reorder failed');
      setMedia((items) =>
        items.map((item) =>
          item.id === asset.id
            ? { ...item, sortOrder: target.sortOrder }
            : item.id === target.id
              ? { ...item, sortOrder: asset.sortOrder }
              : item,
        ),
      );
      setStatus('MEDIA ORDER UPDATED');
    } catch (error) {
      setStatus(`ERROR // ${error instanceof Error ? error.message : 'REORDER FAILED'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p>PHANTOM X // SECURE CONTROL</p>
          <h1>ADMIN CONSOLE</h1>
        </div>
        <div className="admin-account">
          <span><i /> AUTHORIZED</span>
          <strong>{email}</strong>
          <div><a href="/">VIEW SITE ↗</a><a href={signOutHref} target="_top">SIGN OUT</a></div>
        </div>
      </header>

      <div className="admin-status" role="status"><span>{status}</span><small>CHANGES ARE SERVER VERIFIED</small></div>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span>01</span><h2>IDENTITY & PROFILE</h2></div>
          <p>常用资料可直接在这里修改。</p>
        </div>
        <div className="admin-form-grid">
          {([
            ['name', '真实姓名'],
            ['callsign', '选手代号'],
            ['role', '角色定位'],
            ['focus', '当前方向'],
            ['initials', '头像缩写'],
            ['status', '在线状态'],
          ] as Array<[keyof SiteContent['player'], string]>).map(([key, label]) => (
            <label className="admin-field" key={key}>
              <span>{label}</span>
              <Input value={content.player[key]} onChange={(event) => updatePlayer(key, event.target.value)} />
            </label>
          ))}
          <label className="admin-field admin-field-wide">
            <span>个人介绍</span>
            <Textarea value={content.player.tagline} onChange={(event) => updatePlayer('tagline', event.target.value)} />
          </label>
        </div>

        <div className="admin-subheading"><h3>DYNAMIC PROFILE FIELDS</h3><Button type="button" onClick={addProfileField}>+ ADD FIELD</Button></div>
        <div className="admin-dynamic-list">
          {Object.entries(content.profile.fields).map(([label, value]) => (
            <div className="admin-dynamic-row" key={label}>
              <Input
                aria-label="字段名称"
                value={label}
                onChange={(event) => updateProfileField(label, event.target.value, Array.isArray(value) ? value.join(' / ') : value)}
              />
              <Input
                aria-label="字段内容"
                value={Array.isArray(value) ? value.join(' / ') : value}
                onChange={(event) => updateProfileField(label, label, event.target.value)}
              />
              <Button type="button" variant="destructive" onClick={() => removeProfileField(label)}>REMOVE</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span>02</span><h2>MEDIA & DOCUMENTS</h2></div>
          <p>图片自动进入顶部滚动栏，文档自动进入公开资料区。</p>
        </div>
        <form className="upload-zone" onSubmit={upload}>
          <label className="admin-field"><span>选择文件（最大 10 MB）</span><Input name="file" type="file" required /></label>
          <label className="admin-field"><span>图片说明 / 文档描述</span><Input name="alt" placeholder="简短说明" /></label>
          <Button type="submit" disabled={busy}>UPLOAD FILE</Button>
        </form>
        <div className="media-admin-list">
          {media.length === 0 && <p className="admin-empty">NO UPLOADS // 文件库为空</p>}
          {[...media].sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder).map((asset) => (
            <article className="media-admin-card" key={asset.id}>
              <div className="media-admin-preview">
                {asset.category === 'image' ? <img src={asset.url} alt={asset.alt} /> : <span>DOC</span>}
              </div>
              <div><small>{asset.category} // {(asset.size / 1024).toFixed(1)} KB</small><strong>{asset.name}</strong><p>{asset.alt || 'No description'}</p></div>
              <div className="media-admin-actions">
                <Button type="button" variant="outline" onClick={() => moveMedia(asset, -1)} disabled={busy}>↑</Button>
                <Button type="button" variant="outline" onClick={() => moveMedia(asset, 1)} disabled={busy}>↓</Button>
                <Button type="button" variant="destructive" onClick={() => removeMedia(asset)} disabled={busy}>DELETE</Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span>03</span><h2>ADVANCED CONFIG</h2></div>
          <p>技能、项目、导航和联系方式可通过完整 JSON 修改。</p>
        </div>
        <Textarea className="json-editor" value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} spellCheck={false} />
        <div className="admin-save-row">
          <Button type="button" variant="outline" onClick={applyJson} disabled={busy}>APPLY JSON</Button>
          <Button type="button" onClick={saveContent} disabled={busy}>SAVE & PUBLISH CONFIG</Button>
        </div>
      </section>
    </main>
  );
}
