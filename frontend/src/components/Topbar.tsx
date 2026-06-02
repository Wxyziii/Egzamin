import type { ViewKey } from '../types/helpdesk';

export default function Topbar({
  title,
  authSource,
  query,
  onQueryChange,
  onCreate,
  canExportBackup = false,
  onExportBackup
}: {
  title: string;
  authSource: string;
  query: string;
  onQueryChange: (query: string) => void;
  onCreate: () => void;
  canExportBackup?: boolean;
  onExportBackup?: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div className="auth-source">{authSource}</div>
      </div>
      <div className="search-wrap">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>
        <input className="search-input" value={query} onChange={event => onQueryChange(event.target.value)} type="search" placeholder="Sok i saker" />
      </div>
      {canExportBackup && (
        <button className="btn btn-ghost" type="button" onClick={onExportBackup}>Export backup</button>
      )}
      <button className="icon-btn" type="button" title="Varsler"><svg viewBox="0 0 16 16"><path d="M8 14a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2ZM13 11H3l1.2-1.6V6a3.8 3.8 0 0 1 7.6 0v3.4L13 11Z"/></svg><span className="notif-dot" /></button>
      <button className="btn btn-primary" type="button" onClick={onCreate}>Ny sak</button>
    </header>
  );
}

export const viewTitles: Record<ViewKey, string> = {
  create: 'Create ticket',
  myTickets: 'My tickets',
  queue: 'Ticket queue',
  claimed: 'My claimed tickets',
  status: 'Change ticket status',
  allTickets: 'All tickets',
  users: 'Users',
  statistics: 'Statistics',
  system: 'System status',
  knowledge: 'Kunnskapsbase',
  messages: 'Chat/meldinger'
};
