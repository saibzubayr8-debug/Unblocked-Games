import { CloakProfile } from '../types/game';

export const CLOAK_PROFILES: CloakProfile[] = [
  {
    id: 'default',
    name: 'Nova Unblocked (Default)',
    title: 'Nova Unblocked Games',
    favicon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><polygon points='6 2 18 2 18 6 6 6'/><rect x='3' y='6' width='18' height='12' rx='3'/><circle cx='8' cy='12' r='2' fill='%23ffffff'/><rect x='14' y='11' width='4' height='2' rx='1' fill='%23ffffff'/><rect x='15' y='10' width='2' height='4' rx='1' fill='%23ffffff'/></svg>`,
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    title: 'Classes - Google Classroom',
    favicon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path fill='%230F9D58' d='M44 4H4C1.8 4 0 5.8 0 8v32c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4z'/><path fill='%23F4B400' d='M24 14c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm-12 24c0-4 8-6.2 12-6.2s12 2.2 12 6.2v2H12v-2z'/></svg>`,
  },
  {
    id: 'docs',
    name: 'Google Docs',
    title: 'English Essay Draft - Google Docs',
    favicon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path fill='%234285F4' d='M30 4H10C7.8 4 6 5.8 6 8v32c0 2.2 1.8 4 4 4h28c2.2 0 4-1.8 4-4V16L30 4z'/><path fill='%23A1C2FA' d='M30 4v12h12L30 4z'/><path fill='%23ffffff' d='M14 22h20v2H14zm0 6h20v2H14zm0 6h14v2H14z'/></svg>`,
  },
  {
    id: 'drive',
    name: 'Google Drive',
    title: 'My Drive - Google Drive',
    favicon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path fill='%23FFC107' d='M17 6h14l15 26h-14z'/><path fill='%234CAF50' d='M9.5 38.5 2 26 16.5 6l7.5 12.5z'/><path fill='%232196F3' d='M32 44H2l7.5-12.5h31z'/></svg>`,
  },
  {
    id: 'desmos',
    name: 'Desmos Calculator',
    title: 'Desmos | Graphing Calculator',
    favicon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%23007E46'/><path fill='%23ffffff' d='M12 24c4-10 8-10 12 0s8 10 12 0' stroke='%23ffffff' stroke-width='4' fill='none'/></svg>`,
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    title: 'Photosynthesis - Wikipedia',
    favicon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' rx='24' fill='%23ffffff'/><text x='50%25' y='65%25' font-size='28' font-weight='bold' text-anchor='middle' fill='%23000000' font-family='serif'>W</text></svg>`,
  },
  {
    id: 'canvas',
    name: 'Canvas LMS',
    title: 'Dashboard - Canvas',
    favicon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><circle cx='24' cy='24' r='20' fill='%23E6242B'/><circle cx='24' cy='24' r='10' fill='%23ffffff'/></svg>`,
  },
];

export function applyCloak(profileId: string) {
  const profile = CLOAK_PROFILES.find((p) => p.id === profileId) || CLOAK_PROFILES[0];
  
  // Set title
  document.title = profile.title;
  
  // Set favicon
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = profile.favicon;

  localStorage.setItem('nova_cloak_profile', profile.id);
}

export function getSavedCloak(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem('nova_cloak_profile') || 'default';
}
