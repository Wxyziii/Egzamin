import { FormEvent, useState } from 'react';

type Props = {
  error?: string;
  onLogin: (username: string, password: string) => Promise<void>;
};

export default function ManualLogin({ error, onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await onLogin(username.trim(), password);
    setBusy(false);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="logo-row">
          <div className="logo-icon"><svg viewBox="0 0 24 24"><path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v5A3.5 3.5 0 0 1 15.5 16H12l-4 3v-3A3.5 3.5 0 0 1 5 12.5z"/></svg></div>
          <div><div className="logo-name">DeskFlow</div><div className="logo-tag">AD HelpDesk</div></div>
        </div>
        <form className="state-panel" onSubmit={submit}>
          <h1>Logg inn med AD-bruker</h1>
          <p>Automatisk rolleoppslag fant ingen gyldig rolle. Rollen hentes fortsatt fra AD-grupper.</p>
          <label>Brukernavn <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required /></label>
          <label>Passord <input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Sjekker...' : 'Logg inn'}</button>
        </form>
      </div>
    </div>
  );
}
