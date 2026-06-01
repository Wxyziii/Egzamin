import type { Session, Ticket } from '../types/helpdesk';
import { avatarColor, canSeeInternalNotes, initials, normalizeRole, priorityClass, statusClasses } from './helpers';

export default function RightInfoPanel({ ticket, session, ticketCountForOwner }: { ticket: Ticket; session: Session; ticketCountForOwner: number }) {
  const normalizedRole = normalizeRole(session.role);
  const canSeeInternal = canSeeInternalNotes(normalizedRole);
  const lastVisibleMessage = canSeeInternal
    ? ticket.messages[ticket.messages.length - 1]
    : [...ticket.messages].reverse().find(message => !message.internal);
  const hiddenInternalLatest = !canSeeInternal && ticket.messages[ticket.messages.length - 1]?.internal;
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
          <div className="ds-value" style={{ color: ticket.status === 'Resolved' ? 'var(--green)' : 'var(--red)' }}>{ticket.status === 'Resolved' ? 'Completed' : 'Active case'}</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: ticket.status === 'Resolved' ? '100%' : '62%', background: ticket.status === 'Resolved' ? 'var(--green)' : 'var(--red)' }} /></div>
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
          <span className="tag-item">ad-helpdesk</span>
        </div>
      </div>
      <div className="sep" />
      <div>
        <div className="ds-section-title">Activity</div>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot accent"><svg viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3"/></svg></div>
            <div className="timeline-line" />
            <div className="timeline-text">
              <div className="timeline-action">
                {hiddenInternalLatest ? 'Support updated the ticket' : <><strong>{lastVisibleMessage?.author ?? ticket.createdBy}</strong> updated ticket</>}
              </div>
              <div className="timeline-time">{lastVisibleMessage ? new Date(lastVisibleMessage.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3"/></svg></div>
            <div className="timeline-line" />
            <div className="timeline-text"><div className="timeline-action">{ticket.assignedTo ? <>Assigned to <strong>{ticket.assignedTo}</strong></> : 'Waiting for support claim'}</div><div className="timeline-time">{ticket.assignedTo ? 'Claimed' : 'Queue'}</div></div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"><svg viewBox="0 0 10 10"><path d="M3 2h4M5 2v6M2 8h6"/></svg></div>
            <div className="timeline-text"><div className="timeline-action">Ticket created by <strong>{ticket.createdBy}</strong></div><div className="timeline-time">{new Date(ticket.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</div></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
