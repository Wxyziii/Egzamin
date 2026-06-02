import { useMemo, useState } from 'react';
import type { Ticket } from '../types/helpdesk';
import { avatarColor, initials, relativeTime, statusClasses } from './helpers';

type Props = {
  title: string;
  tickets: Ticket[];
  selectedTicketId?: string;
  onSelect: (ticketId: string) => void;
};

export default function TicketList({ title, tickets, selectedTicketId, onSelect }: Props) {
  const [filter, setFilter] = useState<'All' | 'Open' | 'Waiting' | 'Resolved'>('All');
  const visibleTickets = useMemo(() => {
    if (filter === 'All') return tickets;
    return tickets.filter(ticket => ticket.status === filter);
  }, [filter, tickets]);
  const filterTabs = ['All', 'Open', 'Waiting', 'Resolved'] as const;

  return (
    <div className="ticket-list-panel">
      <div className="panel-header">
        <div className="panel-title">{title}</div>
        <span className="badge badge-tag">{visibleTickets.length}</span>
      </div>
      <div className="filter-tabs">
        {filterTabs.map(item => (
          <button key={item} className={`filter-tab ${filter === item ? 'active' : ''}`} type="button" onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="ticket-scroll">
        {visibleTickets.length === 0 && <div className="empty-state">Ingen saker i denne visningen.</div>}
        {visibleTickets.map(ticket => (
          <button key={ticket.id} className={`ticket-item ${ticket.id === selectedTicketId ? 'selected' : ''}`} type="button" onClick={() => onSelect(ticket.id)}>
            <div className="ticket-top">
              <div className="ticket-avatar" style={{ background: avatarColor(ticket.createdBy) }}>{initials(ticket.createdBy)}</div>
              <div className="ticket-meta">
                <div className="ticket-name">{ticket.createdBy}</div>
                <div className="ticket-subject">{ticket.title}</div>
              </div>
              <div className="ticket-time">{relativeTime(ticket.createdAt)}</div>
            </div>
            <div className="ticket-preview">{ticket.description}</div>
            <div className="ticket-footer">
              <span className={`badge ${statusClasses[ticket.status]}`}>{ticket.status}</span>
              <span className={`badge ${ticket.priority === 'Urgent' ? 'badge-urgent' : 'badge-tag'}`}>{ticket.priority}</span>
              <span className="badge badge-tag">{ticket.category}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
