import { useMemo, useState } from 'react';
import { manualLogin } from './api/authApi';
import AdminDashboard from './components/AdminDashboard';
import KnowledgeBase from './components/KnowledgeBase';
import ManualLogin from './components/ManualLogin';
import NotificationBanner from './components/NotificationBanner';
import Sidebar from './components/Sidebar';
import SupportDashboard from './components/SupportDashboard';
import Topbar, { viewTitles } from './components/Topbar';
import UserDashboard from './components/UserDashboard';
import { normalizeRole, visibleTicketsForView } from './components/helpers';
import { useHelpdeskStore } from './state/helpdeskStore';
import type { Session, ViewKey } from './types/helpdesk';

type AuthState = 'manual' | 'ready';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('manual');
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState('');
  const [currentView, setCurrentView] = useState<ViewKey>('queue');
  const [query, setQuery] = useState('');
  const store = useHelpdeskStore(session);

  async function handleLogin(username: string, password: string) {
    try {
      const result = await manualLogin(username, password);
      if (result.status === 'ok') {
        const nextSession = sessionFromResult(result);
        setSession(nextSession);
        setCurrentView(defaultView(nextSession.role));
        setAuthState('ready');
        setAuthError('');
        return;
      }
      setAuthState('manual');
      setAuthError('message' in result ? result.message : 'Innlogging feilet.');
    } catch {
      setAuthState('manual');
      setAuthError('Kunne ikke logge inn. Prov igjen.');
    }
  }

  const visibleTickets = useMemo(() => {
    if (!session) return [];
    return visibleTicketsForView(store.state.tickets, session.role, session.username, currentView, query);
  }, [currentView, query, session, store.state.tickets]);

  const selectedTicket = useMemo(() => {
    const fromVisible = visibleTickets.find(ticket => ticket.id === store.state.selectedTicketId);
    return fromVisible ?? visibleTickets[0] ?? store.selectedTicket;
  }, [store.selectedTicket, store.state.selectedTicketId, visibleTickets]);

  const counts = useMemo(() => ({
    create: '+',
    myTickets: session ? store.state.tickets.filter(ticket => ticket.createdBy === session.username).length : 0,
    queue: store.state.tickets.filter(ticket => ticket.status !== 'Resolved').length,
    claimed: session ? store.state.tickets.filter(ticket => ticket.assignedTo === session.username).length : 0,
    status: store.state.tickets.filter(ticket => ticket.status !== 'Resolved').length,
    allTickets: store.state.tickets.length,
    users: '3',
    statistics: '%',
    system: 'OK'
  }), [session, store.state.tickets]);

  function exportBackup() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deskflow-backup-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (authState === 'manual') return <ManualLogin error={authError} onLogin={handleLogin} />;
  if (!session) return null;

  const sharedDashboardProps = {
    title: viewTitles[currentView],
    tickets: visibleTickets,
    selectedTicket,
    session,
    allTickets: store.state.tickets,
    onSelect: store.selectTicket,
    onClaim: store.claimTicket,
    onSendMessage: store.sendMessage,
    onStatusChange: store.changeTicketStatus,
    onPriorityChange: store.changeTicketPriority
  };

  return (
    <div className="app-shell">
      <Sidebar session={session} currentView={currentView} counts={counts} onNavigate={setCurrentView} />
      <main className="main">
        <Topbar
          title={viewTitles[currentView]}
          authSource={`${session.source} - ${session.checkedBy}`}
          query={query}
          onQueryChange={setQuery}
          onCreate={() => setCurrentView('create')}
          canExportBackup={normalizeRole(session.role) !== 'user'}
          onExportBackup={exportBackup}
        />
        <NotificationBanner notifications={store.state.notifications} session={session} />
        <section className="content-area">
          {currentView === 'knowledge' && <KnowledgeBase session={session} />}
          {currentView === 'create' && (
            <UserDashboard
              tickets={store.state.tickets.filter(ticket => ticket.createdBy === session.username)}
              onCreate={store.createTicket}
              onOpenTicket={(ticketId) => {
                store.selectTicket(ticketId);
                setCurrentView('myTickets');
              }}
            />
          )}
          {['myTickets', 'messages'].includes(currentView) && <SupportDashboard {...sharedDashboardProps} title={viewTitles[currentView]} />}
          {['queue', 'claimed', 'status'].includes(currentView) && <SupportDashboard {...sharedDashboardProps} />}
          {currentView === 'allTickets' && <AdminDashboard {...sharedDashboardProps} />}
          {['users', 'statistics', 'system'].includes(currentView) && <AdminPanels view={currentView} tickets={store.state.tickets} />}
        </section>
      </main>
    </div>
  );
}

function sessionFromResult(result: Extract<Awaited<ReturnType<typeof manualLogin>>, { status: 'ok' }>): Session {
  return {
    username: result.username,
    role: normalizeRole(result.role),
    matchedGroup: result.matchedGroup,
    source: result.source,
    checkedBy: result.checkedBy
  };
}

function defaultView(role: Session['role']): ViewKey {
  if (role === 'user') return 'create';
  if (role === 'support') return 'queue';
  return 'allTickets';
}

function AdminPanels({ view, tickets }: { view: ViewKey; tickets: Array<{ status: string }> }) {
  const open = tickets.filter(ticket => ticket.status !== 'Resolved').length;
  const resolved = tickets.filter(ticket => ticket.status === 'Resolved').length;
  if (view === 'users') {
    return (
      <div className="dashboard">
        <div className="card"><h2>Demo-brukere</h2><p>Eksamen-versjonen bruker lokal innlogging for stabilitet. Rollen kommer fra innloggingsresultatet.</p></div>
        <div className="cards">
          <div className="card"><span className="stat-value">admin1</span><span className="stat-label">admin / admin123</span></div>
          <div className="card"><span className="stat-value">support1</span><span className="stat-label">support / support123</span></div>
          <div className="card"><span className="stat-value">user1</span><span className="stat-label">user / user123</span></div>
        </div>
      </div>
    );
  }
  if (view === 'system') {
    return (
      <div className="dashboard">
        <div className="cards">
          <div className="card"><span className="stat-value">Local</span><span className="stat-label">Stable exam login</span></div>
          <div className="card"><span className="stat-value">React</span><span className="stat-label">Role-based HelpDesk UI</span></div>
          <div className="card"><span className="stat-value">C++</span><span className="stat-label">AuditLogger demo backend feature</span></div>
        </div>
      </div>
    );
  }
  return (
    <div className="dashboard">
      <div className="cards">
        <div className="card"><span className="stat-value">{tickets.length}</span><span className="stat-label">Total tickets</span></div>
        <div className="card"><span className="stat-value">{open}</span><span className="stat-label">Open tickets</span></div>
        <div className="card"><span className="stat-value">{resolved}</span><span className="stat-label">Resolved tickets</span></div>
      </div>
    </div>
  );
}
