export default function LoadingScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="logo-row">
          <div className="logo-icon"><svg viewBox="0 0 24 24"><path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v5A3.5 3.5 0 0 1 15.5 16H12l-4 3v-3A3.5 3.5 0 0 1 5 12.5z"/></svg></div>
          <div><div className="logo-name">DeskFlow</div><div className="logo-tag">HelpDesk eksamen</div></div>
        </div>
        <div className="state-panel">
          <div className="loader" />
          <h1>Laster HelpDesk...</h1>
          <p>Starter lokalt eksamensoppsett.</p>
        </div>
      </div>
    </div>
  );
}
