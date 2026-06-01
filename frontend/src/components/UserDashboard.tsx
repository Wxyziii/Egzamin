import { FormEvent, useState } from 'react';
import type { NewTicketInput, Priority, Ticket } from '../types/helpdesk';

export default function UserDashboard({
  tickets,
  onCreate,
  onOpenTicket
}: {
  tickets: Ticket[];
  onCreate: (input: NewTicketInput) => void;
  onOpenTicket: (ticketId: string) => void;
}) {
  const [form, setForm] = useState<NewTicketInput>({ title: '', description: '', category: 'Account', priority: 'Medium' });

  function submit(event: FormEvent) {
    event.preventDefault();
    onCreate(form);
    setForm({ title: '', description: '', category: 'Account', priority: 'Medium' });
  }

  return (
    <div className="dashboard">
      <div className="two-column">
        <form className="card form-grid" onSubmit={submit}>
          <h2>Opprett ny sak</h2>
          <label>Tittel <input className="field" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required /></label>
          <label>Kategori <select className="select" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}><option>Account</option><option>Network</option><option>Hardware</option><option>Software</option><option>Other</option></select></label>
          <label>Prioritet <select className="select" value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
          <label>Beskrivelse <textarea className="textarea" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} required /></label>
          <button className="btn btn-primary" type="submit">Send sak</button>
        </form>
        <div className="card">
          <h2>Mine siste saker</h2>
          <div className="kb-list">
            {tickets.map(ticket => (
              <button className="kb-item kb-button" key={ticket.id} type="button" onClick={() => onOpenTicket(ticket.id)}>
                <div className="kb-title">#{ticket.id} {ticket.title}</div>
                <div className="kb-body">{ticket.status} · {ticket.category}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
