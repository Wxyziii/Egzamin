import { FormEvent, useEffect, useState } from 'react';
import type { Role } from '../types/helpdesk';
import { canCreateInternalNotes, normalizeRole } from './helpers';

export default function ReplyBox({
  role,
  onSend
}: {
  role: Role;
  onSend: (body: string, internal: boolean) => void;
}) {
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'Reply' | 'Note' | 'Forward'>('Reply');
  const normalizedRole = normalizeRole(role);
  const tabs: Array<'Reply' | 'Note' | 'Forward'> = canCreateInternalNotes(normalizedRole)
    ? ['Reply', 'Note', 'Forward']
    : ['Reply'];
  const internal = mode === 'Note' && canCreateInternalNotes(normalizedRole);

  useEffect(() => {
    if (!canCreateInternalNotes(normalizedRole) && mode !== 'Reply') {
      setMode('Reply');
    }
  }, [normalizedRole, mode]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    const isInternal = mode === 'Note' && canCreateInternalNotes(normalizedRole);
    onSend(body.trim(), isInternal);
    setBody('');
  }

  return (
    <form className="reply-area" onSubmit={submit}>
      <div className="reply-tabs">
        {tabs.map(item => (
          <button key={item} className={`reply-tab ${mode === item ? 'active' : ''}`} type="button" onClick={() => setMode(item)}>{item}</button>
        ))}
      </div>
      <textarea className="reply-input" value={body} onChange={event => setBody(event.target.value)} placeholder={internal ? 'Add an internal note...' : 'Write a reply...'} />
      <div className="reply-footer">
        <div className="reply-toolbar">
          <button className="toolbar-btn" type="button" title="Bold"><svg viewBox="0 0 15 15"><path d="M4 2.5h4a3 3 0 0 1 0 6H4zm0 6h4.5a3.5 3.5 0 0 1 0 7H4z"/></svg></button>
          <button className="toolbar-btn" type="button" title="Italic"><svg viewBox="0 0 15 15"><path d="M6 2.5h4M5 12.5h4M8 2.5 6.5 12.5"/></svg></button>
          <button className="toolbar-btn" type="button" title="Attach"><svg viewBox="0 0 15 15"><path d="M13 7.5 7.2 13.3a3.7 3.7 0 0 1-5.2-5.2L7.8 2.3A2.5 2.5 0 1 1 11.3 5.8L5.5 11.6a1.2 1.2 0 0 1-1.7-1.7L9.5 4.2"/></svg></button>
        </div>
        <button className="btn btn-ghost" type="button">Save Draft</button>
        <button className="btn btn-primary" type="submit">{normalizedRole === 'user' ? 'Send melding' : 'Send Reply'}</button>
      </div>
    </form>
  );
}
