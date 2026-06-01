import type { Notification, Session } from '../types/helpdesk';

export default function NotificationBanner({ notifications, session }: { notifications: Notification[]; session: Session }) {
  const visible = notifications.filter(item => item.recipient === session.username).slice(0, 2);
  if (!visible.length) return null;
  return (
    <section className="notification-area" aria-live="polite">
      {visible.map(item => <div className="notice" key={item.id}>{item.text}</div>)}
    </section>
  );
}
