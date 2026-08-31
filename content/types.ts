export type GalleryImage = {
  src: string;
  alt: string;
  position?: string;
};

export type SkillItem = { name: string; level: number };

export type SiteContent = {
  meta: { title: string; description: string };
  brand: { name: string; mark: string; division: string };
  navigation: Array<{ label: string; target: string }>;
  gallery: { speedSeconds: number; images: GalleryImage[] };
  player: {
    id: string;
    name: string;
    callsign: string;
    role: string;
    tagline: string;
    focus: string;
    initials: string;
    avatar: string;
    status: string;
  };
  stats: Record<string, string>;
  profile: {
    heading: string;
    bio: string[];
    fields: Record<string, string | string[]>;
  };
  loadout: Array<{ name: string; code: string; items: SkillItem[] }>;
  operations: Array<{
    code: string;
    name: string;
    type: string;
    status: string;
    description: string;
    stack: string[];
    source: string;
    demo: string;
  }>;
  contact: {
    heading: string;
    message: string;
    links: Array<{ label: string; value: string; url: string }>;
  };
};

export type MediaAsset = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  category: 'image' | 'document';
  placement: 'gallery' | 'avatar' | 'document';
  alt: string;
  sortOrder: number;
  createdAt: string;
  url: string;
};

export type Note = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

export type NoteSummary = Omit<Note, 'content' | 'updatedBy'>;
