import type { Priority, Session, Ticket, TicketStatus } from '../types/helpdesk';
import TicketDetail from './TicketDetail';
import TicketList from './TicketList';

export default function AdminDashboard(props: {
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
      <TicketList title={props.title} tickets={props.tickets} selectedTicketId={props.selectedTicket?.id} onSelect={props.onSelect} />
      <TicketDetail ticket={props.selectedTicket} session={props.session} tickets={props.allTickets} onClaim={props.onClaim} onSendMessage={props.onSendMessage} onStatusChange={props.onStatusChange} onPriorityChange={props.onPriorityChange} />
    </>
  );
}
