// oxlint-disable next/no-html-link-for-pages -- The fallback link must bypass client-side routing.
import type { Metadata } from 'next';
import { NotePageClient } from '@/components/note-page-client';
import { getNoteBySlug } from '@/db/runtime';
import { isAdminEmail } from '@/lib/admin-auth';
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'new') return { title: 'New Note // ANT1VOLVE 5' };
  const note = await getNoteBySlug(slug);
  if (!note) return { title: 'Note Not Found // ANT1VOLVE 5' };
  return {
    title: `${note.title} // ANT1VOLVE 5`,
    description: note.summary,
    openGraph: { title: note.title, description: note.summary, type: 'article', images: [] },
    twitter: { title: note.title, description: note.summary, images: [] },
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getChatGPTUser();
  const isAdmin = Boolean(user && isAdminEmail(user.email));
  const note = slug === 'new' ? null : await getNoteBySlug(slug, isAdmin);

  if (slug !== 'new' && !note) {
    return (
      <main className="note-access">
        <span>404 // ARCHIVE MISS</span>
        <h1>NOTE NOT FOUND</h1>
        <p>这篇笔记不存在、尚未发布，或者已经被移除。</p>
        <a className="button button-primary" href="/#notes">返回笔记列表</a>
      </main>
    );
  }

  const returnTo = `/notes/${slug}`;
  return (
    <NotePageClient
      note={note}
      auth={{
        signedIn: Boolean(user),
        isAdmin,
        displayName: user?.displayName || 'VISITOR',
        signInHref: chatGPTSignInPath(returnTo),
        signOutHref: chatGPTSignOutPath(returnTo),
      }}
    />
  );
}
