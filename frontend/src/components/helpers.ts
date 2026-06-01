import type { Priority, Role, Ticket, TicketStatus } from '../types/helpdesk';

export const statusClasses: Record<TicketStatus, string> = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  Waiting: 'badge-pending',
  Resolved: 'badge-resolved'
};

export function initials(value: string) {
  return value
    .replace(/.*\\/, '')
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'AD';
}

export function avatarColor(value: string) {
  const colors = ['#2D5BE3', '#0F6E56', '#92520A', '#B92A2A', '#5B3FB5', '#1E7A4A'];
  return colors[value.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % colors.length];
}

export function relativeTime(dateValue: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(dateValue).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function priorityClass(priority: Priority) {
  if (priority === 'Urgent') return 'p-urgent';
  if (priority === 'High') return 'p-high';
  if (priority === 'Medium') return 'p-medium';
  return 'p-low';
}

export function normalizeRole(role: string): Role {
  if (role === 'GG_HelpDesk_Admin' || role === 'admin') return 'admin';
  if (role === 'GG_HelpDesk_Support' || role === 'support') return 'support';
  return 'user';
}

export function canSeeInternalNotes(role: string) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'support' || normalizedRole === 'admin';
}

export function canCreateInternalNotes(role: string) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'support' || normalizedRole === 'admin';
}

export function visibleTicketsForView(tickets: Ticket[], role: string, username: string, view: string, query: string) {
  let filtered = tickets;
  if (role === 'user' || view === 'myTickets') {
    filtered = tickets.filter(ticket => ticket.createdBy === username);
  } else if (view === 'claimed') {
    filtered = tickets.filter(ticket => ticket.assignedTo === username);
  } else if (view === 'queue' || view === 'status') {
    filtered = tickets.filter(ticket => ticket.status !== 'Resolved');
  }

  const normalized = query.trim().toLowerCase();
  if (!normalized) return filtered;
  return filtered.filter(ticket =>
    [ticket.id, ticket.title, ticket.description, ticket.category, ticket.priority, ticket.status, ticket.createdBy, ticket.assignedTo ?? '']
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
}
