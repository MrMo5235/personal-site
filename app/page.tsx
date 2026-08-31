import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from './chatgpt-auth';
import { SiteClient } from '@/components/site-client';
import { listMedia, listNotes, readSiteContent } from '@/db/runtime';
import { isAdminEmail } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [content, media, notes, user] = await Promise.all([
    readSiteContent(),
    listMedia(),
    listNotes(),
    getChatGPTUser(),
  ]);

  return (
    <SiteClient
      content={content}
      media={media}
      notes={notes}
      auth={{
        signedIn: Boolean(user),
        isAdmin: Boolean(user && isAdminEmail(user.email)),
        displayName: user?.displayName || 'VISITOR',
        signInHref: chatGPTSignInPath('/'),
        signOutHref: chatGPTSignOutPath('/'),
      }}
    />
  );
}
