'use client';
// oxlint-disable next/no-img-element

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, SyntheticEvent } from 'react';
import Link from 'next/link';
import type { GalleryImage, MediaAsset, NoteSummary, SiteContent } from '@/content/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type AuthView = {
  signedIn: boolean;
  isAdmin: boolean;
  displayName: string;
  signInHref: string;
  signOutHref: string;
};

export function SiteClient({
  content,
  media,
  notes,
  auth,
}: {
  content: SiteContent;
  media: MediaAsset[];
  notes: NoteSummary[];
  auth: AuthView;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clock, setClock] = useState('--:--:--');
  const [draft, setDraft] = useState(content);
  const [editMode, setEditMode] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState(media);
  const [status, setStatus] = useState('READY');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (auth.isAdmin && new URLSearchParams(window.location.search).get('edit') === '1') {
      const timer = window.setTimeout(() => setEditMode(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [auth.isAdmin]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible')),
      { threshold: 0.08 },
    );
    document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const galleryImages = useMemo(() => {
    const uploaded = mediaItems
      .filter((item) => item.category === 'image')
      .map<GalleryImage>((item) => ({ src: item.url, alt: item.alt || item.name }));
    return uploaded.length ? uploaded : draft.gallery.images;
  }, [draft.gallery.images, mediaItems]);

  const tickerImages = useMemo(() => {
    const repeated: GalleryImage[] = [];
    if (!galleryImages.length) return repeated;
    while (repeated.length < Math.max(8, galleryImages.length)) repeated.push(...galleryImages);
    return repeated.slice(0, Math.max(8, galleryImages.length));
  }, [galleryImages]);

  const documents = mediaItems.filter((item) => item.category === 'document');
  const navigation = draft.navigation.map((item) =>
    item.target === 'operations' ? { label: 'NOTES', target: 'notes' } : item,
  );

  const saveContent = async () => {
    setBusy(true);
    setStatus('SAVING...');
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || '保存失败');
      setStatus('SAVED // LIVE');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  const cancelEdits = () => {
    setDraft(content);
    setStatus('CHANGES RESET');
    setEditMode(false);
  };

  const updateProfileField = (oldLabel: string, label: string, value: string) => {
    const fields = Object.fromEntries(
      Object.entries(draft.profile.fields).map(([key, current]) =>
        key === oldLabel ? [label || oldLabel, value] : [key, current],
      ),
    );
    setDraft({ ...draft, profile: { ...draft.profile, fields } });
  };

  const addProfileField = () => {
    const label = `NEW FIELD ${Object.keys(draft.profile.fields).length + 1}`;
    setDraft({
      ...draft,
      profile: { ...draft.profile, fields: { ...draft.profile.fields, [label]: 'New value' } },
    });
  };

  const removeProfileField = (label: string) => {
    const fields = { ...draft.profile.fields };
    delete fields[label];
    setDraft({ ...draft, profile: { ...draft.profile, fields } });
  };

  const uploadMedia = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setStatus('UPLOADING...');
    try {
      const response = await fetch('/api/media', { method: 'POST', body: new FormData(form) });
      const result = (await response.json()) as MediaAsset & { error?: string };
      if (!response.ok) throw new Error(result.error || '上传失败');
      setMediaItems((items) => [...items, result]);
      form.reset();
      setStatus('UPLOAD COMPLETE');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '上传失败');
    } finally {
      setBusy(false);
    }
  };

  const deleteMedia = async (asset: MediaAsset) => {
    if (!window.confirm(`确定删除 ${asset.name} 吗？`)) return;
    setBusy(true);
    const response = await fetch(`/api/media/${asset.id}`, { method: 'DELETE' });
    if (response.ok) {
      setMediaItems((items) => items.filter((item) => item.id !== asset.id));
      setStatus('FILE DELETED');
    } else {
      setStatus('删除失败');
    }
    setBusy(false);
  };

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#home" aria-label="返回首页">
          <span className="brand-mark">{draft.brand.mark}</span>
          <span className="brand-copy"><strong>{draft.brand.name}</strong><small>{draft.brand.division}</small></span>
        </a>

        <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="主要导航">
          {navigation.map((item) => (
            <a key={item.target} href={`#${item.target}`} onClick={() => setMenuOpen(false)}>{item.label}</a>
          ))}
          {documents.length > 0 && <a href="#documents" onClick={() => setMenuOpen(false)}>FILES</a>}
        </nav>

        <div className="header-actions">
          <div className="system-status"><span className="status-dot" /><span>PLAYER ONLINE</span><time>{clock}</time></div>
          {auth.isAdmin ? (
            <button className={`identity-switch admin ${editMode ? 'active' : ''}`} type="button" onClick={() => setEditMode((value) => !value)}>
              <small>IDENTITY</small><strong>{editMode ? 'ADMIN / EDITING' : 'ADMIN / EDIT SITE'}</strong>
            </button>
          ) : auth.signedIn ? (
            <a className="identity-switch" href={auth.signOutHref} target="_top"><small>SIGNED IN</small><strong>{auth.displayName} / LOGOUT</strong></a>
          ) : (
            <a className="identity-switch" href={auth.signInHref} target="_top"><small>IDENTITY</small><strong>VISITOR / LOGIN</strong></a>
          )}
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-label="切换导航" onClick={() => setMenuOpen((value) => !value)}><span /><span /></button>
        </div>
      </header>

      {auth.isAdmin && editMode && (
        <aside className="inline-admin-bar">
          <div><span className="status-dot" /><strong>FRONTEND EDIT MODE</strong><small>{status}</small></div>
          <div>
            <Button variant="outline" onClick={() => setMediaOpen((value) => !value)}>{mediaOpen ? '关闭文件面板' : '图片 / 文件'}</Button>
            <Link className="button button-ghost" href="/notes/new">+ 新建笔记</Link>
            <Button variant="outline" onClick={cancelEdits} disabled={busy}>取消</Button>
            <Button onClick={saveContent} disabled={busy}>{busy ? '保存中…' : '保存全部修改'}</Button>
          </div>
        </aside>
      )}

      {auth.isAdmin && editMode && mediaOpen && (
        <InlineMediaPanel media={mediaItems} busy={busy} onUpload={uploadMedia} onDelete={deleteMedia} />
      )}

      {tickerImages.length > 0 && (
        <section className="photo-ticker" aria-label="照片展示滚动栏">
          <div className="photo-ticker-shell">
            <div className="photo-ticker-label" aria-hidden="true"><span className="status-dot" /><strong>MEDIA FEED</strong><small>LIVE ARCHIVE</small></div>
            <div className="photo-ticker-viewport">
              <div className="photo-ticker-track" style={{ '--ticker-duration': `${Math.max(20, draft.gallery.speedSeconds)}s` } as CSSProperties}>
                {[false, true].map((duplicate) => (
                  <div className="photo-ticker-group" aria-hidden={duplicate || undefined} key={String(duplicate)}>
                    {tickerImages.map((image, index) => (
                      <figure className="photo-ticker-item" key={`${duplicate}-${index}-${image.src}`}>
                        <img src={image.src} alt={duplicate ? '' : image.alt} loading="lazy" style={{ objectPosition: image.position }} />
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <main>
        <section className="hero" id="home">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span>01</span> ANT1VOLVE 5 / PERSONAL EVOLUTION PROFILE</p>
              <div className="callsign-wrap">
                <span className="callsign-label">CALLSIGN</span>
                {editMode ? <Input className="inline-callsign" value={draft.player.callsign} onChange={(event) => setDraft({ ...draft, player: { ...draft.player, callsign: event.target.value } })} /> : <h1>{draft.player.callsign}</h1>}
              </div>
              {editMode ? (
                <div className="inline-hero-fields">
                  <Input value={draft.player.role} onChange={(event) => setDraft({ ...draft, player: { ...draft.player, role: event.target.value } })} aria-label="角色定位" />
                  <Textarea value={draft.player.tagline} onChange={(event) => setDraft({ ...draft, player: { ...draft.player, tagline: event.target.value } })} aria-label="个人简介" />
                </div>
              ) : <><p className="player-role">{draft.player.role}</p><p className="player-tagline">{draft.player.tagline}</p></>}
              <div className="hero-actions"><a className="button button-primary" href="#profile">VIEW DOSSIER <span>↘</span></a><a className="button button-ghost" href="#notes">READ NOTES</a></div>
            </div>

            <aside className="player-card" aria-label="选手状态卡">
              {editMode ? <Input className="card-index-edit" value={draft.player.id} onChange={(event) => setDraft({ ...draft, player: { ...draft.player, id: event.target.value } })} /> : <div className="card-index">{draft.player.id}</div>}
              <div className="avatar-frame">
                <div className="crosshair" aria-hidden="true" />
                {draft.player.avatar ? <img className="player-avatar" src={draft.player.avatar} alt={`${draft.player.name} 的照片`} /> : <span>{draft.player.initials}</span>}
              </div>
              <div className="player-card-meta"><span>STATUS</span>{editMode ? <Input value={draft.player.status} onChange={(event) => setDraft({ ...draft, player: { ...draft.player, status: event.target.value } })} /> : <strong><i /> {draft.player.status}</strong>}</div>
              <dl className="quick-stats">
                {Object.entries(draft.stats).map(([label, value]) => (
                  <div key={label}>{editMode ? <><Input value={label} aria-label="数据名称" onChange={(event) => setDraft({ ...draft, stats: renameRecordKey(draft.stats, label, event.target.value) })} /><Input value={value} aria-label="数据值" onChange={(event) => setDraft({ ...draft, stats: { ...draft.stats, [label]: event.target.value } })} /></> : <><dt>{label}</dt><dd>{value}</dd></>}</div>
                ))}
              </dl>
            </aside>
          </div>
          <div className="match-strip"><span>LIVE LOADOUT</span>{editMode ? <Input value={draft.player.focus} onChange={(event) => setDraft({ ...draft, player: { ...draft.player, focus: event.target.value } })} /> : <strong>{draft.player.focus}</strong>}<span className="match-code">SESSION // {new Date().getFullYear()}</span></div>
        </section>

        <section className="content-section profile-section reveal" id="profile">
          <div className="section-heading"><p><span>02</span> OPERATOR DOSSIER</p><h2>PLAYER<br />PROFILE</h2></div>
          <div className="profile-layout">
            <article className="briefing-panel">
              <span className="panel-kicker">BRIEFING // ABOUT</span>
              {editMode ? <Textarea className="inline-heading" value={draft.profile.heading} onChange={(event) => setDraft({ ...draft, profile: { ...draft.profile, heading: event.target.value } })} /> : <h3><Multiline value={draft.profile.heading} /></h3>}
              <div className="profile-bio">
                {draft.profile.bio.map((paragraph, index) => editMode ? (
                  <div className="inline-list-row" key={index}><Textarea value={paragraph} onChange={(event) => setDraft({ ...draft, profile: { ...draft.profile, bio: draft.profile.bio.map((item, itemIndex) => itemIndex === index ? event.target.value : item) } })} /><button type="button" onClick={() => setDraft({ ...draft, profile: { ...draft.profile, bio: draft.profile.bio.filter((_, itemIndex) => itemIndex !== index) } })}>×</button></div>
                ) : <p key={index}>{paragraph}</p>)}
                {editMode && <Button variant="outline" onClick={() => setDraft({ ...draft, profile: { ...draft.profile, bio: [...draft.profile.bio, '新的介绍段落'] } })}>+ 添加段落</Button>}
              </div>
              <div className="signature-line">{editMode ? <Input value={draft.player.name} onChange={(event) => setDraft({ ...draft, player: { ...draft.player, name: event.target.value } })} /> : <span>{draft.player.name}</span>}<small>AUTHORIZED OPERATOR</small></div>
            </article>
            <dl className="dossier-grid" aria-label="个人资料">
              {Object.entries(draft.profile.fields).map(([label, value], index) => (
                <div className={`dossier-item ${editMode ? 'editing' : ''}`} key={label}>
                  <span className="dossier-index">{String(index + 1).padStart(2, '0')}</span>
                  {editMode ? <><Input value={label} onChange={(event) => updateProfileField(label, event.target.value, Array.isArray(value) ? value.join(' / ') : value)} /><Textarea value={Array.isArray(value) ? value.join(' / ') : value} onChange={(event) => updateProfileField(label, label, event.target.value)} /><button type="button" onClick={() => removeProfileField(label)}>REMOVE</button></> : <><dt>{label}</dt><dd>{Array.isArray(value) ? value.join(' / ') : value}</dd></>}
                </div>
              ))}
              {editMode && <button className="dossier-add" type="button" onClick={addProfileField}>+ ADD PROFILE FIELD</button>}
            </dl>
          </div>
        </section>

        <section className="content-section loadout-section reveal" id="loadout">
          <SectionHeading index="03" kicker="TECHNICAL LOADOUT" title="ARSENAL" note="EQUIPPED FOR MODERN DIGITAL OPERATIONS" />
          <div className="loadout-grid">
            {draft.loadout.map((category, categoryIndex) => (
              <article className="loadout-card" key={`${category.code}-${categoryIndex}`}>
                <header>{editMode ? <><Input value={category.name} onChange={(event) => setDraft({ ...draft, loadout: draft.loadout.map((item, index) => index === categoryIndex ? { ...item, name: event.target.value } : item) })} /><Input value={category.code} onChange={(event) => setDraft({ ...draft, loadout: draft.loadout.map((item, index) => index === categoryIndex ? { ...item, code: event.target.value } : item) })} /></> : <><span>{category.name}</span><small>{category.code}</small></>}</header>
                <div className="loadout-list">
                  {category.items.map((skill, skillIndex) => (
                    <div className="loadout-item" key={`${skill.name}-${skillIndex}`}>
                      {editMode ? <div className="inline-skill-row"><Input value={skill.name} onChange={(event) => setDraft({ ...draft, loadout: updateSkill(draft.loadout, categoryIndex, skillIndex, { name: event.target.value }) })} /><Input type="number" min="0" max="100" value={skill.level} onChange={(event) => setDraft({ ...draft, loadout: updateSkill(draft.loadout, categoryIndex, skillIndex, { level: Math.min(100, Math.max(0, Number(event.target.value))) }) })} /><button type="button" aria-label={`删除技能 ${skill.name}`} onClick={() => setDraft({ ...draft, loadout: draft.loadout.map((item, index) => index === categoryIndex ? { ...item, items: item.items.filter((_, itemIndex) => itemIndex !== skillIndex) } : item) })}>×</button></div> : <><div className="loadout-label"><span>{skill.name}</span><strong>{skill.level}%</strong></div><div className="loadout-meter"><i style={{ '--level': `${skill.level}%` } as CSSProperties} /></div></>}
                    </div>
                  ))}
                  {editMode && <Button variant="outline" onClick={() => setDraft({ ...draft, loadout: draft.loadout.map((item, index) => index === categoryIndex ? { ...item, items: [...item.items, { name: 'New skill', level: 50 }] } : item) })}>+ 添加技能</Button>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section operations-section notes-section reveal" id="notes">
          <SectionHeading index="04" kicker="FIELD ARCHIVE" title="NOTES" note="TACTICS, PROJECTS & PERSONAL LOGS" />
          {auth.isAdmin && editMode && <Link className="button button-primary notes-create" href="/notes/new">+ CREATE NEW NOTE</Link>}
          <div className="operations-list notes-list">
            {notes.length === 0 && <p className="notes-empty">暂无已发布笔记。</p>}
            {notes.map((note, index) => (
              <Link className="operation-card note-card" href={`/notes/${note.slug}`} key={note.id}>
                <div className="operation-lead"><span className="operation-number">{String(index + 1).padStart(2, '0')}</span><div><small>FIELD NOTE // {formatDate(note.updatedAt)}</small><h3>{note.title}</h3></div></div>
                <div className="operation-body"><p>{note.summary || '打开笔记查看完整内容。'}</p><div className="operation-tags">{note.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div>
                <div className="operation-actions"><span className="operation-status active">READABLE</span><span>OPEN NOTE ↗</span></div>
              </Link>
            ))}
          </div>
        </section>

        {documents.length > 0 && (
          <section className="content-section documents-section reveal" id="documents">
            <SectionHeading index="05" kicker="PUBLIC ARCHIVE" title="FILES" note="DOCUMENTS & DOWNLOADS" />
            <div className="documents-grid">{documents.map((document) => <a className="document-card" href={`${document.url}?download=1`} key={document.id}><span>DOC</span><div><small>{document.contentType}</small><strong>{document.name}</strong><p>{document.alt}</p></div><i>↗</i></a>)}</div>
          </section>
        )}

        <section className="contact-section reveal" id="contact">
          <div className="contact-grid">
            <div><p className="eyebrow"><span>{documents.length ? '06' : '05'}</span> SECURE COMMUNICATION CHANNEL</p>{editMode ? <Textarea className="inline-contact-heading" value={draft.contact.heading} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, heading: event.target.value } })} /> : <h2><Multiline value={draft.contact.heading} /></h2>}</div>
            <div className="contact-copy">
              {editMode ? <Textarea value={draft.contact.message} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, message: event.target.value } })} /> : <p>{draft.contact.message}</p>}
              <div className="contact-links">
                {draft.contact.links.map((link, index) => editMode ? (
                  <div className="inline-contact-row" key={index}><Input value={link.label} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, links: draft.contact.links.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) } })} /><Input value={link.value} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, links: draft.contact.links.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item) } })} /><Input value={link.url} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, links: draft.contact.links.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item) } })} /></div>
                ) : <a href={link.url} key={link.label}><span>{link.label}</span><strong>{link.value}</strong><i>↗</i></a>)}
              </div>
            </div>
          </div>
          <div className="contact-marquee" aria-hidden="true"><span>REJECT MEANINGLESS COMPETITION</span><i /><span>CHOOSE REAL EVOLUTION</span><i /><span>ANT1VOLVE 5</span></div>
        </section>
      </main>

      <footer className="site-footer"><span>{draft.brand.name}</span><span>© {new Date().getFullYear()} · ALL SYSTEMS OPERATIONAL</span><a href="#home">BACK TO TOP ↑</a></footer>
    </>
  );
}

function InlineMediaPanel({ media, busy, onUpload, onDelete }: { media: MediaAsset[]; busy: boolean; onUpload: (event: SyntheticEvent<HTMLFormElement>) => void; onDelete: (asset: MediaAsset) => void }) {
  return (
    <aside className="inline-media-panel">
      <div className="inline-media-heading"><div><span>MEDIA CONTROL</span><strong>图片会进入顶部滚动栏，文档会进入公开文件区。</strong></div></div>
      <form onSubmit={onUpload}><Input name="file" type="file" required /><Input name="alt" placeholder="图片说明 / 文档描述" /><Button type="submit" disabled={busy}>UPLOAD</Button></form>
      <div className="inline-media-list">{media.map((asset) => <div key={asset.id}>{asset.category === 'image' ? <img src={asset.url} alt={asset.alt} /> : <span>DOC</span>}<p><strong>{asset.name}</strong><small>{asset.alt || asset.contentType}</small></p><button type="button" onClick={() => onDelete(asset)} disabled={busy}>DELETE</button></div>)}</div>
    </aside>
  );
}

function renameRecordKey(record: Record<string, string>, oldKey: string, newKey: string) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => key === oldKey ? [newKey || oldKey, value] : [key, value]));
}

function updateSkill(loadout: SiteContent['loadout'], categoryIndex: number, skillIndex: number, patch: Partial<{ name: string; level: number }>) {
  return loadout.map((category, index) => index === categoryIndex ? { ...category, items: category.items.map((skill, itemIndex) => itemIndex === skillIndex ? { ...skill, ...patch } : skill) } : category);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

function Multiline({ value }: { value: string }) {
  return value.split('\n').map((line, index) => <Fragment key={`${line}-${index}`}>{index > 0 && <br />}{line}</Fragment>);
}

function SectionHeading({ index, kicker, title, note }: { index: string; kicker: string; title: string; note: string }) {
  return <div className="section-heading section-heading-row"><div><p><span>{index}</span> {kicker}</p><h2>{title}</h2></div><p className="section-note">{note}</p></div>;
}
