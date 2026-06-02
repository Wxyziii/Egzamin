import type { Session, Ticket } from '../types/helpdesk';
import { avatarColor, canSeeInternalNotes, getSlaStatus, initials, normalizeRole, priorityClass, slaBadgeClass, statusClasses } from './helpers';

export default function RightInfoPanel({ ticket, session, ticketCountForOwner }: { ticket: Ticket; session: Session; ticketCountForOwner: number }) {
  const normalizedRole = normalizeRole(session.role);
  const canSeeInternal = canSeeInternalNotes(normalizedRole);
  const slaStatus = getSlaStatus(ticket);
  const visibleActivity = (ticket.activity ?? [])
    .filter(item => canSeeInternal || !item.internal)
    .slice(-5)
    .reverse();
  return (
    <aside className="detail-sidebar">
      <div>
        <div className="ds-section-title">Ticket Info</div>
        <div className="ds-field"><div className="ds-label">Status</div><span className={`badge ${statusClasses[ticket.status]}`}>{ticket.status}</span></div>
        <div className="ds-field">
          <div className="ds-label">Priority</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span className={`priority-dot ${priorityClass(ticket.priority)}`} />
            <span className="ds-value">{ticket.priority}</span>
          </div>
        </div>
        <div className="ds-field"><div className="ds-label">Channel</div><div className="ds-value">Web portal</div></div>
        <div className="ds-field">
          <div className="ds-label">SLA</div>
          <span className={`badge ${slaBadgeClass(slaStatus)}`}>{slaStatus}</span>
          <div className="ds-value" style={{ marginTop: 6 }}>Due {new Date(ticket.dueAt).toLocaleString('nb-NO')}</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: slaStatus === 'Overdue' ? '100%' : slaStatus === 'Due soon' ? '82%' : '42%',
                background: slaStatus === 'Overdue' ? 'var(--red)' : slaStatus === 'Due soon' ? 'var(--amber)' : 'var(--green)'
              }}
            />
          </div>
        </div>
      </div>
      <div className="sep" />
      <div>
        <div className="ds-section-title">Assignee</div>
        <div className="assignee-row">
          <div className="agent-avatar" style={{ width: 26, height: 26, background: avatarColor(ticket.assignedTo ?? 'unassigned') }}>{initials(ticket.assignedTo ?? 'UA')}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{ticket.assignedTo ?? 'Unassigned'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{ticket.assignedTo ? 'Online now' : 'Waiting in queue'}</div>
          </div>
          <svg viewBox="0 0 14 14"><path d="M5 3l4 4-4 4"/></svg>
        </div>
      </div>
      <div className="sep" />
      <div>
        <div className="ds-section-title">Customer</div>
        <div className="ds-field"><div className="ds-label">Name</div><div className="ds-value link">{ticket.createdBy}</div></div>
        <div className="ds-field"><div className="ds-label">Created</div><div className="ds-value">{new Date(ticket.createdAt).toLocaleString('nb-NO')}</div></div>
        <div className="ds-field"><div className="ds-label">Tickets</div><div className="ds-value">{ticketCountForOwner} total</div></div>
      </div>
      <div className="sep" />
      <div>
        <div className="ds-section-title">Tags</div>
        <div className="tag-list">
          <span className="tag-item">{ticket.category.toLowerCase()}</span>
          <span className="tag-item">{ticket.priority.toLowerCase()}</span>
          <span className="tag-item">deskflow</span>
        </div>
      </div>
      <div className="sep" />
      <div>
        <div className="ds-section-title">Activity</div>
        <div className="timeline">
          {visibleActivity.map((item, index) => (
            <div className="timeline-item" key={item.id}>
              <div className={`timeline-dot ${index === 0 ? 'accent' : ''}`}>
                <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" /></svg>
              </div>
              {index < visibleActivity.length - 1 && <div className="timeline-line" />}
              <div className="timeline-text">
                <div className="timeline-action"><strong>{item.actor}</strong> · {item.text}</div>
                <div className="timeline-time">{new Date(item.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
