import type { SiteContent } from './types';

export const defaultContent: SiteContent = {
  meta: {
    title: 'ANT1VOLVE 5 // True Evolution Profile',
    description: '拒绝无意义的竞争，选择真正的进化。',
  },
  brand: {
    name: 'ANT1VOLVE 5',
    mark: 'AV5',
    division: 'ANTI-INVOLUTION // TRUE EVOLUTION',
  },
  navigation: [
    { label: 'HOME', target: 'home' },
    { label: 'DOSSIER', target: 'profile' },
    { label: 'LOADOUT', target: 'loadout' },
    { label: 'MISSIONS', target: 'operations' },
    { label: 'COMMS', target: 'contact' },
  ],
  gallery: {
    speedSeconds: 58,
    images: [
      { src: '/og.png', alt: 'ANT1VOLVE 5 品牌视觉', position: '18% center' },
      { src: '/og.png', alt: 'ANT1VOLVE 5 反内卷宣言', position: '50% center' },
      { src: '/og.png', alt: 'ANT1VOLVE 5 个人主页', position: '82% center' },
    ],
  },
  player: {
    id: 'AV5-01',
    name: 'Your Name',
    callsign: 'PLAYER',
    role: 'Full-Stack Developer',
    tagline: '拒绝无意义的竞争，选择真正的进化。',
    focus: 'ANTI-INVOLUTION // CONTINUOUS EVOLUTION',
    initials: 'YN',
    avatar: '',
    status: 'EVOLVING // ONLINE',
  },
  stats: {
    XP: '04+ YRS',
    PROJECTS: '24',
    UPTIME: '99.9%',
  },
  profile: {
    heading: '不止写代码，\n也在构建体验。',
    bio: [
      '我是一名专注于产品体验与工程质量的开发者，喜欢把模糊的想法推进成真正能够使用的产品。',
      '在战术之外保持冷静，在细节之中寻找优势。持续学习、持续交付，也持续对作品负责。',
    ],
    fields: {
      'REAL NAME / 姓名': 'Your Name',
      'LOCATION / 所在地': 'Your City, Country',
      'EDUCATION / 教育': 'Your University',
      'EXPERIENCE / 经验': '4+ Years',
      'ROLE / 定位': 'Full-Stack / IGL',
      'LANGUAGES / 语言': ['中文', 'English'],
    },
  },
  loadout: [
    {
      name: 'PRIMARY // LANGUAGES',
      code: 'A-01',
      items: [
        { name: 'JavaScript', level: 95 },
        { name: 'TypeScript', level: 90 },
        { name: 'Python', level: 85 },
        { name: 'Go', level: 80 },
      ],
    },
    {
      name: 'SECONDARY // FRAMEWORKS',
      code: 'A-02',
      items: [
        { name: 'React / Next.js', level: 92 },
        { name: 'Node.js', level: 88 },
        { name: 'Vue.js', level: 76 },
        { name: 'FastAPI', level: 72 },
      ],
    },
    {
      name: 'UTILITY // SYSTEMS',
      code: 'A-03',
      items: [
        { name: 'Git / Linux', level: 92 },
        { name: 'Docker', level: 84 },
        { name: 'PostgreSQL', level: 82 },
        { name: 'AWS / Cloud', level: 74 },
      ],
    },
  ],
  operations: [
    {
      code: 'OP-001',
      name: 'PROJECT ALPHA',
      type: 'BACKEND INFRASTRUCTURE',
      status: 'COMPLETED',
      description: '高性能 API 网关，围绕可靠性、可观测性和高并发请求处理构建。',
      stack: ['Go', 'gRPC', 'Redis'],
      source: '#',
      demo: '#',
    },
    {
      code: 'OP-002',
      name: 'PROJECT BETA',
      type: 'REAL-TIME PLATFORM',
      status: 'COMPLETED',
      description: '支持实时协作和冲突处理的 Web 平台，兼顾操作反馈与多人协同体验。',
      stack: ['TypeScript', 'React', 'WebSocket'],
      source: '#',
      demo: '#',
    },
    {
      code: 'OP-003',
      name: 'PROJECT GAMMA',
      type: 'SECURITY & MONITORING',
      status: 'ACTIVE',
      description: '实时安全监控面板，通过异常检测和事件聚合帮助团队更快定位风险。',
      stack: ['Python', 'FastAPI', 'ML'],
      source: '#',
      demo: '#',
    },
  ],
  contact: {
    heading: "LET'S\nQUEUE UP.",
    message: '不追逐无意义的竞争，把时间留给真正的成长、创造与合作。如果你认同这种节奏，建立通信。',
    links: [
      { label: 'GITHUB', value: '@yourname', url: 'https://github.com/' },
      { label: 'EMAIL', value: 'your@email.com', url: 'mailto:your@email.com' },
      { label: 'LINKEDIN', value: 'CONNECT', url: 'https://linkedin.com/' },
    ],
  },
};

export function isSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SiteContent>;
  return Boolean(
    candidate.meta?.title &&
      candidate.brand?.name &&
      candidate.player?.callsign &&
      candidate.profile?.fields &&
      Array.isArray(candidate.loadout) &&
      Array.isArray(candidate.operations) &&
      candidate.contact?.links,
  );
}
