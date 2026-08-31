import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://profile.andyyyy5.chatgpt.site'),
  title: 'ANT1VOLVE 5 // True Evolution Profile',
  description: '拒绝无意义的竞争，选择真正的进化。',
  openGraph: {
    title: 'ANT1VOLVE 5 // TRUE EVOLUTION',
    description: '拒绝无意义的竞争，选择真正的进化。',
    type: 'website',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANT1VOLVE 5 // TRUE EVOLUTION',
    description: '拒绝无意义的竞争，选择真正的进化。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
