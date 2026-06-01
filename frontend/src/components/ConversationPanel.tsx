import type { Session, Ticket } from '../types/helpdesk';
import { avatarColor, canSeeInternalNotes, initials, normalizeRole } from './helpers';

export default function ConversationPanel({ ticket, session }: { ticket: Ticket; session: Session }) {
  const normalizedRole = normalizeRole(session.role);
  const visibleMessages = ticket.messages.filter(message => {
    if (!message.internal) return true;
    return canSeeInternalNotes(normalizedRole);
  });

  if (import.meta.env.DEV && normalizedRole === 'user') {
    const leakedInternal = visibleMessages.some(message => message.internal);
    if (leakedInternal) {
      console.error('SECURITY BUG: user can see internal note');
    }
  }

  return (
    <div className="conversation message-list">
      {visibleMessages.map(message => {
        const isCurrentUserMessage = message.author === session.username;
        const isSystemMessage = message.role === 'system';
        const formattedTime = new Date(message.createdAt).toLocaleString('nb-NO');
        if (isSystemMessage) {
          return (
            <div key={message.id} className="message-row message-row--system">
              <div className="message-system-notice">
                <span>System</span>
                <p>{message.body}</p>
                <small>{formattedTime}</small>
              </div>
            </div>
          );
        }
        return (
          <div
            key={message.id}
            className={[
              'message-row',
              isCurrentUserMessage ? 'message-row--outgoing' : 'message-row--incoming',
              message.internal ? 'message-row--internal' : '',
              message.role === 'system' ? 'message-row--system' : ''
            ].join(' ')}
          >
            <div className="message-avatar" style={{ background: avatarColor(message.author) }}>
              {initials(message.author)}
            </div>

            <div className="message-stack">
              <div className="message-meta">
                <span className="message-author">{message.author}</span>
                <span className="message-time">{formattedTime}</span>
              </div>

              <div className={message.internal ? 'message-bubble message-bubble--internal' : 'message-bubble'}>
                {message.internal && <div className="internal-note-label">Internal note</div>}
                <div>{message.body}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
