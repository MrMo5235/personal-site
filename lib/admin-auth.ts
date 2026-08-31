import { env } from 'cloudflare:workers';
import type { ChatGPTUser } from '@/app/chatgpt-auth';
import { getChatGPTUser } from '@/app/chatgpt-auth';

export function isAdminEmail(email: string) {
  const configured = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!configured.length) return email.toLowerCase() === 'seedy@sites.test';
  return configured.includes(email.toLowerCase());
}

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  return user && isAdminEmail(user.email) ? user : null;
}

export async function requireAdminApi() {
  const user = await getAdminUser();
  if (!user) {
    return {
      user: null,
      response: Response.json({ error: 'Administrator access required.' }, { status: 403 }),
    } as const;
  }
  return { user, response: null } as const;
}
