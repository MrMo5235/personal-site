'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { GalleryImage, MediaAsset, SiteContent } from '@/content/types';

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
  auth,
}: {
  content: SiteContent;
  media: MediaAsset[];
  auth: AuthView;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clock, setClock] = useState('--:--:--');

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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.08 },
    );
    document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const galleryImages = useMemo(() => {
    const uploaded = media
      .filter((item) => item.category === 'image')
      .map<GalleryImage>((item) => ({ src: item.url, alt: item.alt || item.name }));
    return uploaded.length ? uploaded : content.gallery.images;
  }, [content.gallery.images, media]);

  const tickerImages = useMemo(() => {
    const repeated: GalleryImage[] = [];
    if (!galleryImages.length) return repeated;
    while (repeated.length < Math.max(8, galleryImages.length)) repeated.push(...galleryImages);
    return repeated.slice(0, Math.max(8, galleryImages.length));
  }, [galleryImages]);

  const documents = media.filter((item) => item.category === 'document');

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#home" aria-label="返回首页">
          <span className="brand-mark">{content.brand.mark}</span>
          <span className="brand-copy">
            <strong>{content.brand.name}</strong>
            <small>{content.brand.division}</small>
          </span>
        </a>

        <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="主要导航">
          {content.navigation.map((item) => (
            <a key={item.target} href={`#${item.target}`} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
          {documents.length > 0 && (
            <a href="#documents" onClick={() => setMenuOpen(false)}>
              FILES
            </a>
          )}
        </nav>

        <div className="header-actions">
          <div className="system-status">
            <span className="status-dot" />
            <span>PLAYER ONLINE</span>
            <time>{clock}</time>
          </div>
          {auth.isAdmin ? (
            <a className="identity-switch admin" href="/admin">
              <small>IDENTITY</small>
              <strong>ADMIN / CONTROL</strong>
            </a>
          ) : auth.signedIn ? (
            <a className="identity-switch" href={auth.signOutHref} target="_top">
              <small>SIGNED IN</small>
              <strong>{auth.displayName} / LOGOUT</strong>
            </a>
          ) : (
            <a className="identity-switch" href={auth.signInHref} target="_top">
              <small>IDENTITY</small>
              <strong>VISITOR / LOGIN</strong>
            </a>
          )}
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-label="切换导航"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {tickerImages.length > 0 && (
        <section className="photo-ticker" aria-label="照片展示滚动栏">
          <div className="photo-ticker-shell">
            <div className="photo-ticker-label" aria-hidden="true">
              <span className="status-dot" />
              <strong>MEDIA FEED</strong>
              <small>LIVE ARCHIVE</small>
            </div>
            <div className="photo-ticker-viewport">
              <div
                className="photo-ticker-track"
                style={{ '--ticker-duration': `${Math.max(20, content.gallery.speedSeconds)}s` } as React.CSSProperties}
              >
                {[false, true].map((duplicate) => (
                  <div
                    className="photo-ticker-group"
                    aria-hidden={duplicate || undefined}
                    key={String(duplicate)}
                  >
                    {tickerImages.map((image, index) => (
                      <figure className="photo-ticker-item" key={`${duplicate}-${index}-${image.src}`}>
                        <img
                          src={image.src}
                          alt={duplicate ? '' : image.alt}
                          loading="lazy"
                          style={{ objectPosition: image.position }}
                        />
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
              <p className="eyebrow"><span>01</span> ACTIVE ROSTER / PLAYER PROFILE</p>
              <div className="callsign-wrap">
                <span className="callsign-label">CALLSIGN</span>
                <h1>{content.player.callsign}</h1>
              </div>
              <p className="player-role">{content.player.role}</p>
              <p className="player-tagline">{content.player.tagline}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#profile">VIEW DOSSIER <span>↘</span></a>
                <a className="button button-ghost" href="#contact">OPEN COMMS</a>
              </div>
            </div>

            <aside className="player-card" aria-label="选手状态卡">
              <div className="card-index">{content.player.id}</div>
              <div className="avatar-frame">
                <div className="crosshair" aria-hidden="true" />
                {content.player.avatar ? (
                  <img className="player-avatar" src={content.player.avatar} alt={`${content.player.name} 的照片`} />
                ) : (
                  <span>{content.player.initials}</span>
                )}
              </div>
              <div className="player-card-meta">
                <span>STATUS</span>
                <strong><i /> {content.player.status}</strong>
              </div>
              <dl className="quick-stats">
                {Object.entries(content.stats).map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </aside>
          </div>
          <div className="match-strip">
            <span>LIVE LOADOUT</span>
            <strong>{content.player.focus}</strong>
            <span className="match-code">SESSION // {new Date().getFullYear()}</span>
          </div>
        </section>

        <section className="content-section profile-section reveal" id="profile">
          <div className="section-heading">
            <p><span>02</span> OPERATOR DOSSIER</p>
            <h2>PLAYER<br />PROFILE</h2>
          </div>
          <div className="profile-layout">
            <article className="briefing-panel">
              <span className="panel-kicker">BRIEFING // ABOUT</span>
              <h3><Multiline value={content.profile.heading} /></h3>
              <div className="profile-bio">
                {content.profile.bio.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
              <div className="signature-line">
                <span>{content.player.name}</span>
                <small>AUTHORIZED OPERATOR</small>
              </div>
            </article>
            <dl className="dossier-grid" aria-label="个人资料">
              {Object.entries(content.profile.fields).map(([label, value], index) => (
                <div className="dossier-item" key={label}>
                  <span className="dossier-index">{String(index + 1).padStart(2, '0')}</span>
                  <dt>{label}</dt>
                  <dd>{Array.isArray(value) ? value.join(' / ') : value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="content-section loadout-section reveal" id="loadout">
          <SectionHeading index="03" kicker="TECHNICAL LOADOUT" title="ARSENAL" note="EQUIPPED FOR MODERN DIGITAL OPERATIONS" />
          <div className="loadout-grid">
            {content.loadout.map((category) => (
              <article className="loadout-card" key={category.code}>
                <header><span>{category.name}</span><small>{category.code}</small></header>
                <div className="loadout-list">
                  {category.items.map((skill) => (
                    <div className="loadout-item" key={skill.name}>
                      <div className="loadout-label"><span>{skill.name}</span><strong>{skill.level}%</strong></div>
                      <div className="loadout-meter"><i style={{ '--level': `${skill.level}%` } as React.CSSProperties} /></div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section operations-section reveal" id="operations">
          <SectionHeading index="04" kicker="COMPLETED OPERATIONS" title="MISSIONS" note="SELECTED WORK FIELD REPORTS" />
          <div className="operations-list">
            {content.operations.map((operation, index) => (
              <article className="operation-card" key={operation.code}>
                <div className="operation-lead">
                  <span className="operation-number">{String(index + 1).padStart(2, '0')}</span>
                  <div><small>{operation.code} // {operation.type}</small><h3>{operation.name}</h3></div>
                </div>
                <div className="operation-body">
                  <p>{operation.description}</p>
                  <div className="operation-tags">{operation.stack.map((tech) => <span key={tech}>{tech}</span>)}</div>
                </div>
                <div className="operation-actions">
                  <span className={`operation-status ${operation.status.toLowerCase()}`}>{operation.status}</span>
                  {operation.source && <a href={operation.source}>SOURCE ↗</a>}
                  {operation.demo && <a href={operation.demo}>LIVE VIEW ↗</a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        {documents.length > 0 && (
          <section className="content-section documents-section reveal" id="documents">
            <SectionHeading index="05" kicker="PUBLIC ARCHIVE" title="FILES" note="DOCUMENTS & DOWNLOADS" />
            <div className="documents-grid">
              {documents.map((document) => (
                <a className="document-card" href={`${document.url}?download=1`} key={document.id}>
                  <span>DOC</span>
                  <div><small>{document.contentType}</small><strong>{document.name}</strong><p>{document.alt}</p></div>
                  <i>↓</i>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="contact-section reveal" id="contact">
          <div className="contact-grid">
            <div>
              <p className="eyebrow"><span>{documents.length ? '06' : '05'}</span> SECURE COMMUNICATION CHANNEL</p>
              <h2><Multiline value={content.contact.heading} /></h2>
            </div>
            <div className="contact-copy">
              <p>{content.contact.message}</p>
              <div className="contact-links">
                {content.contact.links.map((link) => (
                  <a href={link.url} key={link.label}>
                    <span>{link.label}</span><strong>{link.value}</strong><i>↗</i>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="contact-marquee" aria-hidden="true">
            <span>AVAILABLE FOR NEW MISSIONS</span><i /><span>AVAILABLE FOR NEW MISSIONS</span><i /><span>AVAILABLE FOR NEW MISSIONS</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>{content.brand.name}</span>
        <span>© {new Date().getFullYear()} // ALL SYSTEMS OPERATIONAL</span>
        <a href="#home">BACK TO TOP ↑</a>
      </footer>
    </>
  );
}

function Multiline({ value }: { value: string }) {
  return value.split('\n').map((line, index) => (
    <Fragment key={`${line}-${index}`}>{index > 0 && <br />}{line}</Fragment>
  ));
}

function SectionHeading({
  index,
  kicker,
  title,
  note,
}: {
  index: string;
  kicker: string;
  title: string;
  note: string;
}) {
  return (
    <div className="section-heading section-heading-row">
      <div><p><span>{index}</span> {kicker}</p><h2>{title}</h2></div>
      <p className="section-note">{note}</p>
    </div>
  );
}
