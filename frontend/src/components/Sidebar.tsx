import type { Role, Session, ViewKey } from '../types/helpdesk';
import { initials } from './helpers';

const roleViews: Record<Role, Array<[ViewKey, string]>> = {
  user: [['create', 'Create ticket'], ['myTickets', 'My tickets']],
  support: [['queue', 'Ticket queue'], ['claimed', 'My claimed tickets'], ['status', 'Change ticket status']],
  admin: [['allTickets', 'All tickets'], ['users', 'Users'], ['statistics', 'Statistics'], ['system', 'System status']]
};

type Props = {
  session: Session;
  currentView: ViewKey;
  counts: Record<string, string | number>;
  onNavigate: (view: ViewKey) => void;
};

export default function Sidebar({ session, currentView, counts, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><svg viewBox="0 0 24 24"><path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v5A3.5 3.5 0 0 1 15.5 16H12l-4 3v-3A3.5 3.5 0 0 1 5 12.5z"/></svg></div>
        <div><div className="logo-name">DeskFlow</div><div className="logo-tag">Support Platform</div></div>
      </div>
      <nav>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Arbeidsflate</div>
          {roleViews[session.role].map(([view, label]) => (
            <button key={view} className={`nav-item ${currentView === view ? 'active' : ''}`} type="button" onClick={() => onNavigate(view)}>
              <span className={`priority-dot ${view === 'queue' || view === 'allTickets' ? 'p-urgent' : view === 'claimed' || view === 'myTickets' ? 'p-medium' : 'p-low'}`} />
              <span>{label}</span>
              <span className="nav-badge muted">{counts[view] ?? ''}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-section">
          <div className="sidebar-section-label">Felles</div>
          <button className={`nav-item ${currentView === 'knowledge' ? 'active' : ''}`} type="button" onClick={() => onNavigate('knowledge')}>
            <span className="priority-dot p-low" />Kunnskapsbase<span className="nav-badge muted">3</span>
          </button>
          <button className={`nav-item ${currentView === 'messages' ? 'active' : ''}`} type="button" onClick={() => onNavigate('messages')}>
            <span className="priority-dot p-medium" />Chat/meldinger
          </button>
        </div>
      </nav>
      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="user-card-avatar">{initials(session.username)}</div>
          <div className="user-card-info">
            <div className="user-card-name">{session.username}</div>
            <div className="user-card-role">{session.role} via {session.matchedGroup}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
