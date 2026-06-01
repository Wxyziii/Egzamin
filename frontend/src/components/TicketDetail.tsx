import type { Session, Ticket, TicketStatus } from '../types/helpdesk';
import ConversationPanel from './ConversationPanel';
import ReplyBox from './ReplyBox';
import RightInfoPanel from './RightInfoPanel';
import { knowledgeBaseArticles } from '../data/seedData';
import type { Priority } from '../types/helpdesk';
import { canSeeInternalNotes, normalizeRole, relativeTime, statusClasses } from './helpers';

type Props = {
  ticket?: Ticket;
  session: Session;
  tickets: Ticket[];
  onClaim: (ticketId: string) => void;
  onSendMessage: (ticketId: string, body: string, internal: boolean) => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
  onPriorityChange: (ticketId: string, priority: Priority) => void;
};

export default function TicketDetail({ ticket, session, tickets, onClaim, onSendMessage, onStatusChange, onPriorityChange }: Props) {
  if (!ticket) {
    return <div className="dashboard"><div className="card">Ingen sak valgt.</div></div>;
  }

  const normalizedRole = normalizeRole(session.role);
  const canWork = normalizedRole === 'support' || normalizedRole === 'admin';
  const canSeeInternal = canSeeInternalNotes(normalizedRole);
  const canChat = canWork || ticket.createdBy === session.username;
  const visibleMessageCount = ticket.messages.filter(message => !message.internal || canSeeInternal).length;
  const open = tickets.filter(item => item.status !== 'Resolved').length;
  const resolved = tickets.filter(item => item.status === 'Resolved').length;
  const claimed = tickets.filter(item => item.assignedTo).length;
  const relatedArticles = knowledgeBaseArticles
    .filter(article => article.category.toLowerCase().includes(ticket.category.toLowerCase()) || ticket.category.toLowerCase().includes(article.category.toLowerCase().split(' ')[0]))
    .slice(0, 2);
  const contextArticles = relatedArticles.length ? relatedArticles : knowledgeBaseArticles.slice(0, 2);

  return (
    <article className="ticket-detail">
      <div className="stats-strip">
        <div className="stat-item"><span className="stat-label">Open today</span><span className="stat-value">{open}</span><span className="stat-change stat-up">{session.role}</span></div>
        <div className="stat-item"><span className="stat-label">Avg. response</span><span className="stat-value">4.2m</span><span className="stat-change stat-up">AD verified</span></div>
        <div className="stat-item"><span className="stat-label">Claimed</span><span className="stat-value">{claimed}</span><span className="stat-change stat-up">Live queue</span></div>
        <div className="stat-item"><span className="stat-label">Resolved today</span><span className="stat-value">{resolved}</span><span className="stat-change stat-up">localStorage</span></div>
      </div>
      <div className="detail-header">
        <div className="detail-header-info">
          <div className="detail-ticket-id">#{ticket.id}</div>
          <div className="detail-title">{ticket.title}</div>
          <div className="detail-meta">
            <span className={`badge ${ticket.priority === 'Urgent' ? 'badge-urgent' : statusClasses[ticket.status]}`}>{ticket.priority} · {ticket.status}</span>
            <span className="detail-meta-item"><svg viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5"/><path d="M6.5 4v3L8 8.5"/></svg>Opened {relativeTime(ticket.createdAt)} ago</span>
            <span className="detail-meta-item"><svg viewBox="0 0 13 13"><circle cx="6.5" cy="5" r="2.5"/><path d="M2 12c0-2.5 2-4.5 4.5-4.5S11 9.5 11 12"/></svg>{ticket.createdBy}</span>
            <span className="detail-meta-item"><svg viewBox="0 0 13 13"><rect x="1.5" y="2.5" width="10" height="8" rx="1"/><path d="M4.5 1v3M8.5 1v3M1.5 7h10"/></svg>{ticket.category}</span>
          </div>
        </div>
        {canWork && (
          <div className="detail-actions">
            <select className="status-select" value={ticket.status} onChange={event => onStatusChange(ticket.id, event.target.value as TicketStatus)}>
              <option>Open</option>
              <option>In Progress</option>
              <option>Waiting</option>
              <option>Resolved</option>
            </select>
            <button className="btn btn-ghost" type="button" onClick={() => onClaim(ticket.id)}>Claim</button>
            <button className="btn btn-ghost" type="button" onClick={() => onStatusChange(ticket.id, 'Resolved')}><svg viewBox="0 0 16 16"><path d="M2 14l2-6L12 2l2 2-8 8-6 2z"/></svg>Resolve</button>
          </div>
        )}
      </div>
      <div className="detail-body">
        <div className="conversation-column">
          <div className="ticket-workspace-grid">
            <section className="conversation-card">
              <div className="conversation-card-header">
                <div>
                  <div className="section-title">Samtale</div>
                  <h3>{visibleMessageCount} meldinger i saken</h3>
                </div>
                <span className={`badge ${statusClasses[ticket.status]}`}>{ticket.status}</span>
              </div>
              <ConversationPanel ticket={ticket} session={session} />
              {canChat && <ReplyBox role={session.role} onSend={(body, internal) => onSendMessage(ticket.id, body, internal)} />}
            </section>

            <aside className="workspace-context">
              {normalizedRole === 'user' ? (
                <div className="context-card">
                  <div className="section-title">Ticket progress</div>
                  <ProgressSteps status={ticket.status} assigned={Boolean(ticket.assignedTo)} />
                </div>
              ) : (
                <div className="context-card">
                  <div className="section-title">Quick actions</div>
                  <div className="quick-action-grid">
                    <button className="btn btn-primary" type="button" onClick={() => onClaim(ticket.id)}>Claim ticket</button>
                    <button className="btn btn-ghost" type="button" onClick={() => navigator.clipboard?.writeText(ticket.id)}>Copy ticket ID</button>
                    <select className="status-select" value={ticket.status} onChange={event => onStatusChange(ticket.id, event.target.value as TicketStatus)}>
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Waiting</option>
                      <option>Resolved</option>
                    </select>
                    <select className="status-select" value={ticket.priority} onChange={event => onPriorityChange(ticket.id, event.target.value as Priority)}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="context-card next-step-card">
                <div className="section-title">Next step</div>
                <strong>{nextStep(ticket.status, canWork)}</strong>
                <p>{canWork ? 'Skriv et konkret svar, sett status og bruk intern note hvis sensor skal se supportflyt.' : 'Folg med pa meldinger fra support og svar i chatten nar du far sporsmal.'}</p>
              </div>

              {canSeeInternal && (
                <div className="context-card internal-notes-card">
                  <div className="section-title">Internal notes</div>
                  {ticket.messages.filter(message => message.internal).length ? (
                    ticket.messages.filter(message => message.internal).slice(-2).map(message => (
                      <div className="mini-note" key={message.id}>{message.body}</div>
                    ))
                  ) : (
                    <p>Ingen interne notater enda. Bruk Note-fanen i svarboksen.</p>
                  )}
                </div>
              )}

              <div className="context-card">
                <div className="section-title">Suggested articles</div>
                <div className="suggested-list">
                  {contextArticles.map(article => (
                    <div className="suggested-article" key={article.id}>
                      <strong>{article.title}</strong>
                      <span>{article.category} · {article.readTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
        <RightInfoPanel ticket={ticket} session={session} ticketCountForOwner={tickets.filter(item => item.createdBy === ticket.createdBy).length} />
      </div>
    </article>
  );
}

function ProgressSteps({ status, assigned }: { status: TicketStatus; assigned: boolean }) {
  const steps = [
    ['Saken er mottatt', true],
    ['Venter pa support', assigned || status !== 'Open'],
    ['Support jobber med saken', status === 'In Progress' || status === 'Waiting' || status === 'Resolved'],
    ['Lost', status === 'Resolved']
  ] as const;

  return (
    <div className="progress-steps">
      {steps.map(([label, done]) => (
        <div className={`progress-step ${done ? 'done' : ''}`} key={label}>
          <span />
          <p>{label}</p>
        </div>
      ))}
    </div>
  );
}

function nextStep(status: TicketStatus, canWork: boolean) {
  if (status === 'Resolved') return 'Bekreft losning og lukk saken';
  if (canWork) return status === 'Open' ? 'Claim saken og svar bruker' : 'Oppdater bruker og sett riktig status';
  return status === 'Open' ? 'Venter pa support' : 'Svar support i chatten';
}
