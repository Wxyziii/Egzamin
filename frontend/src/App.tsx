import { useEffect, useMemo, useState } from 'react';
import { bootstrapAuth, manualLogin } from './api/authApi';
import AdminDashboard from './components/AdminDashboard';
import KnowledgeBase from './components/KnowledgeBase';
import LoadingScreen from './components/LoadingScreen';
import ManualLogin from './components/ManualLogin';
import NotificationBanner from './components/NotificationBanner';
import Sidebar from './components/Sidebar';
import SupportDashboard from './components/SupportDashboard';
import Topbar, { viewTitles } from './components/Topbar';
import UserDashboard from './components/UserDashboard';
import { normalizeRole, visibleTicketsForView } from './components/helpers';
import { useHelpdeskStore } from './state/helpdeskStore';
import type { Session, ViewKey } from './types/helpdesk';

type AuthState = 'loading' | 'manual' | 'ready' | 'error';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState('');
  const [currentView, setCurrentView] = useState<ViewKey>('queue');
  const [query, setQuery] = useState('');
  const store = useHelpdeskStore(session);

  useEffect(() => {
    // Security boundary: React does not decide roles. It only renders after C++/AD backend JSON says who the user is.
    bootstrapAuth()
      .then(result => {
        if (result.status === 'auto_login_ok') {
          const nextSession = sessionFromResult(result);
          setSession(nextSession);
          setCurrentView(defaultView(nextSession.role));
          setAuthState('ready');
        } else if (result.status === 'manual_login_required') {
          setAuthState('manual');
        } else if (result.status === 'ad_error' || result.status === 'login_failed') {
          setAuthError(result.message);
          setAuthState('error');
        }
      })
      .catch(() => {
        setAuthError('Automatisk sjekk kunne ikke fullfores. Logg inn manuelt med AD-bruker.');
        setAuthState('manual');
      });
  }, []);

  async function handleLogin(username: string, password: string) {
    const result = await manualLogin(username, password);
    if (result.status === 'manual_login_ok') {
      const nextSession = sessionFromResult(result);
      setSession(nextSession);
      setCurrentView(defaultView(nextSession.role));
      setAuthState('ready');
      setAuthError('');
      return;
    }
    setAuthError('message' in result ? result.message : 'Innlogging feilet.');
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
    users: 'AD',
    statistics: '%',
    system: 'OK'
  }), [session, store.state.tickets]);

  if (authState === 'loading') return <LoadingScreen />;
  if (authState === 'manual') return <ManualLogin error={authError} onLogin={handleLogin} />;
  if (authState === 'error') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="state-panel">
            <h1>Active Directory er ikke tilgjengelig</h1>
            <p>{authError || 'Kun brukere med verifisert AD-rolle kan apne HelpDesk.'}</p>
            <button className="btn btn-ghost" type="button" onClick={() => window.location.reload()}>Prov igjen</button>
          </div>
        </div>
      </div>
    );
  }
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

function sessionFromResult(result: Extract<Awaited<ReturnType<typeof bootstrapAuth>>, { status: 'auto_login_ok' | 'manual_login_ok' }>): Session {
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
        <div className="card"><h2>AD-brukere</h2><p>Produksjonsversjonen kan hente dette fra AD. Roller skal fortsatt komme fra AD-grupper, ikke fra frontend.</p></div>
        <div className="cards">
          <div className="card"><span className="stat-value">GG_HelpDesk_Admin</span><span className="stat-label">Admin role group</span></div>
          <div className="card"><span className="stat-value">GG_HelpDesk_Support</span><span className="stat-label">Support role group</span></div>
          <div className="card"><span className="stat-value">GG_HelpDesk_User</span><span className="stat-label">User role group</span></div>
        </div>
      </div>
    );
  }
  if (view === 'system') {
    return (
      <div className="dashboard">
        <div className="cards">
          <div className="card"><span className="stat-value">192.168.51.2</span><span className="stat-label">Windows Server AD DS/DNS/DHCP</span></div>
          <div className="card"><span className="stat-value">192.168.51.3</span><span className="stat-label">Ubuntu Apache HelpDesk</span></div>
          <div className="card"><span className="stat-value">LDAP</span><span className="stat-label">Checked by C++ CGI backend</span></div>
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
