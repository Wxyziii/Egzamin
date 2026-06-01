import type { HelpdeskState, Ticket } from '../types/helpdesk';

const now = Date.now();

export const seedTickets: Ticket[] = [
  {
    id: 'TK-2041',
    title: 'Kan ikke logge inn etter passordbytte',
    description: 'Kontoen min er last etter at jeg byttet passord. Jeg trenger tilgang for a levere rapport.',
    category: 'Account',
    priority: 'Urgent',
    status: 'Open',
    createdBy: 'user1',
    messages: [
      {
        id: 'MSG-1',
        author: 'user1',
        role: 'user',
        body: 'Kontoen min er last etter passordbytte. Kan dere hjelpe?',
        createdAt: new Date(now - 20 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 20 * 60 * 1000).toISOString()
  },
  {
    id: 'TK-2042',
    title: 'Printer pa kontoret svarer ikke',
    description: 'Printeren i andre etasje tar ikke imot jobber fra Windows-klienter.',
    category: 'Hardware',
    priority: 'Medium',
    status: 'Waiting',
    createdBy: 'kari',
    assignedTo: 'support1',
    messages: [
      {
        id: 'MSG-2',
        author: 'kari',
        role: 'user',
        body: 'Printeren viser online, men ingen utskrifter kommer.',
        createdAt: new Date(now - 90 * 60 * 1000).toISOString()
      },
      {
        id: 'MSG-3',
        author: 'support1',
        role: 'support',
        body: 'Jeg sjekker print queue og driver pa serveren.',
        createdAt: new Date(now - 70 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(now - 90 * 60 * 1000).toISOString(),
    updatedAt: new Date(now - 70 * 60 * 1000).toISOString()
  }
];

export const seedState: HelpdeskState = {
  tickets: seedTickets,
  notifications: [],
  selectedTicketId: seedTickets[0]?.id
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  category: 'Konto og passord' | 'Nettverk' | 'Printer' | 'HelpDesk' | 'Sikkerhet';
  description: string;
  visibility: 'Alle' | 'Support' | 'Admin';
  readTime: string;
  updatedAt: string;
  updatedBy: string;
  status: 'Publisert' | 'Utkast';
  steps: string[];
  related: string[];
};

export const knowledgeBaseArticles: KnowledgeArticle[] = [
  {
    id: 'kb-password',
    title: 'Passord og kontolasing',
    category: 'Konto og passord',
    description: 'Feilsoking nar bruker ikke kommer inn etter passordbytte eller konto er last i AD.',
    visibility: 'Alle',
    readTime: '4 min',
    updatedAt: '2026-05-28',
    updatedBy: 'support1',
    status: 'Publisert',
    steps: [
      'Sjekk om brukeren er last i AD',
      'Verifiser identitet',
      'Nullstill passord ved behov',
      'Be bruker teste innlogging'
    ],
    related: ['HelpDesk roller', 'Backup av HelpDesk']
  },
  {
    id: 'kb-network',
    title: 'Nettverk pa klient',
    category: 'Nettverk',
    description: 'Standard sjekkliste for klienter som ikke nar interne tjenester eller HelpDesk.',
    visibility: 'Alle',
    readTime: '5 min',
    updatedAt: '2026-05-25',
    updatedBy: 'admin1',
    status: 'Publisert',
    steps: [
      'Sjekk IP-adresse',
      'Sjekk DNS',
      'Sjekk gateway',
      'Test ping mot 192.168.51.1 og 192.168.51.3'
    ],
    related: ['Backup av HelpDesk']
  },
  {
    id: 'kb-printer',
    title: 'Printer svarer ikke',
    category: 'Printer',
    description: 'Brukes nar printer er online, men utskrifter ikke kommer frem til enheten.',
    visibility: 'Support',
    readTime: '3 min',
    updatedAt: '2026-05-22',
    updatedBy: 'support1',
    status: 'Publisert',
    steps: [
      'Sjekk print queue',
      'Sjekk at printer er online',
      'Restart print spooler',
      'Test utskrift fra klient'
    ],
    related: ['Nettverk pa klient']
  },
  {
    id: 'kb-roles',
    title: 'HelpDesk roller',
    category: 'HelpDesk',
    description: 'Forklarer hvordan C++ backend mapper AD-grupper til rollebasert UI.',
    visibility: 'Alle',
    readTime: '2 min',
    updatedAt: '2026-05-30',
    updatedBy: 'admin1',
    status: 'Publisert',
    steps: [
      'Roller kommer fra AD-grupper',
      'GG_HelpDesk_Admin gir admin',
      'GG_HelpDesk_Support gir support',
      'GG_HelpDesk_User gir user'
    ],
    related: ['Passord og kontolasing']
  },
  {
    id: 'kb-backup',
    title: 'Backup av HelpDesk',
    category: 'Sikkerhet',
    description: 'Rutine for a kontrollere backup og restore av HelpDesk-filene.',
    visibility: 'Admin',
    readTime: '6 min',
    updatedAt: '2026-05-20',
    updatedBy: 'admin1',
    status: 'Utkast',
    steps: [
      'BackupPC tar backup av HelpDesk-filer',
      'Sjekk siste backup',
      'Test restore ved behov'
    ],
    related: ['HelpDesk roller', 'Nettverk pa klient']
  }
];
