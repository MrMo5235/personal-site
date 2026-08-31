import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PLAYER // Tactical Profile',
  description: '电竞战队风格的个人选手主页',
  openGraph: {
    title: 'PHANTOM X // TACTICAL PROFILE',
    description: '个人能力、项目与联络方式的战术档案。',
    type: 'website',
    images: ['/og.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PHANTOM X // TACTICAL PROFILE',
    description: '个人能力、项目与联络方式的战术档案。',
    images: ['/og.jpg'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
