import type { Priority, Session, Ticket, TicketStatus } from '../types/helpdesk';
import TicketDetail from './TicketDetail';
import TicketList from './TicketList';

export default function SupportDashboard({
  title,
  tickets,
  selectedTicket,
  session,
  allTickets,
  onSelect,
  onClaim,
  onSendMessage,
  onStatusChange,
  onPriorityChange
}: {
  title: string;
  tickets: Ticket[];
  selectedTicket?: Ticket;
  session: Session;
  allTickets: Ticket[];
  onSelect: (ticketId: string) => void;
  onClaim: (ticketId: string) => void;
  onSendMessage: (ticketId: string, body: string, internal: boolean) => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
  onPriorityChange: (ticketId: string, priority: Priority) => void;
}) {
  return (
    <>
      <TicketList title={title} tickets={tickets} selectedTicketId={selectedTicket?.id} onSelect={onSelect} />
      <TicketDetail ticket={selectedTicket} session={session} tickets={allTickets} onClaim={onClaim} onSendMessage={onSendMessage} onStatusChange={onStatusChange} onPriorityChange={onPriorityChange} />
    </>
  );
}
