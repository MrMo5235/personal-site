// oxlint-disable next/no-html-link-for-pages -- The fallback link must bypass client-side routing.
import { isAdminEmail } from '@/lib/admin-auth';
import { chatGPTSignOutPath, requireChatGPTUser } from '../chatgpt-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  if (!isAdminEmail(user.email)) {
    return (
      <main className="access-denied">
        <span>ACCESS DENIED // 403</span>
        <h1>NOT AUTHORIZED</h1>
        <p>当前账号 <strong>{user.email}</strong> 已登录，但不在管理员名单中。</p>
        <p>请让站点所有者把该邮箱加入 ADMIN_EMAILS，然后重新登录。</p>
        <div><a href="/">RETURN TO SITE</a><a href={chatGPTSignOutPath('/')} target="_top">SIGN OUT</a></div>
      </main>
    );
  }

  redirect('/?edit=1');
}
