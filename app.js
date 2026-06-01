const API = {
  bootstrap: '/cgi-bin/ad-bootstrap',
  login: '/cgi-bin/ad-login'
};

const roleViews = {
  user: [
    ['create', 'Create ticket'],
    ['myTickets', 'My tickets']
  ],
  support: [
    ['queue', 'Ticket queue'],
    ['claimed', 'My claimed tickets'],
    ['status', 'Change ticket status']
  ],
  admin: [
    ['allTickets', 'All tickets'],
    ['users', 'Users'],
    ['statistics', 'Statistics'],
    ['system', 'System status']
  ]
};

const statusClasses = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  Waiting: 'badge-pending',
  Resolved: 'badge-resolved'
};

const state = {
  session: null,
  currentView: null,
  selectedTicketId: null,
  notifications: [],
  tickets: loadTickets()
};

const kbArticles = [
  {
    title: 'Passord og kontolasing',
    body: 'Brukere skal alltid verifiseres mot AD for passordrelaterte saker. Support kan endre status og svare i saken.'
  },
  {
    title: 'Nettverk pa klient',
    body: 'Sjekk IP-adresse, DNS, DHCP lease og om klienten nar 192.168.51.2 og 192.168.51.3.'
  },
  {
    title: 'HelpDesk roller',
    body: 'Rollen kommer fra GG_HelpDesk_Admin, GG_HelpDesk_Support eller GG_HelpDesk_User i Active Directory.'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-state').addEventListener('submit', handleManualLogin);
  document.getElementById('retry-auth').addEventListener('click', bootstrapAuth);
  document.getElementById('new-ticket-button').addEventListener('click', () => navigate('create'));
  document.getElementById('ticket-search').addEventListener('input', renderCurrentView);
  bootstrapAuth();
});

async function bootstrapAuth() {
  showAuthPanel('loading-state');
  try {
    const response = await fetch(API.bootstrap, { headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (data.status === 'auto_login_ok') {
      startApp(data);
      return;
    }
    if (data.status === 'manual_login_required') {
      showAuthPanel('login-state');
      return;
    }
    showAdError(data.message || 'Could not contact Active Directory');
  } catch (error) {
    showAuthPanel('login-state');
    document.getElementById('login-error').textContent =
      'Automatisk sjekk kunne ikke fullfores. Logg inn manuelt med AD-bruker.';
  }
}

async function handleManualLogin(event) {
  event.preventDefault();
  const error = document.getElementById('login-error');
  error.textContent = '';

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) {
    error.textContent = 'Skriv inn brukernavn og passord.';
    return;
  }

  try {
    const response = await fetch(API.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.status === 'manual_login_ok') {
      startApp(data);
      return;
    }
    error.textContent = data.message || 'Innlogging feilet. Kontroller AD-bruker og gruppemedlemskap.';
  } catch (err) {
    error.textContent = 'Kunne ikke kontakte C++ LDAP backend.';
  }
}

function showAuthPanel(panelId) {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  for (const panel of ['loading-state', 'login-state', 'ad-error-state']) {
    document.getElementById(panel).classList.toggle('hidden', panel !== panelId);
  }
}

function showAdError(message) {
  document.getElementById('ad-error-message').textContent = message;
  showAuthPanel('ad-error-state');
}

function startApp(session) {
  state.session = session;
  state.currentView = defaultViewForRole(session.role);
  state.selectedTicketId = firstVisibleTicket()?.id || null;
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('user-name').textContent = session.username;
  document.getElementById('user-role').textContent = `${session.role} via ${session.matchedGroup}`;
  document.getElementById('user-avatar').textContent = initials(session.username);
  document.getElementById('auth-source').textContent = `${session.source} - ${session.checkedBy}`;
  renderNav();
  renderCurrentView();
}

function defaultViewForRole(role) {
  if (role === 'user') return 'create';
  if (role === 'support') return 'queue';
  return 'allTickets';
}

function renderNav() {
  const nav = document.getElementById('role-nav');
  nav.innerHTML = '';
  for (const [view, label] of roleViews[state.session.role]) {
    nav.appendChild(navButton(view, label));
  }
  for (const item of document.querySelectorAll('.nav-item')) {
    item.addEventListener('click', () => navigate(item.dataset.view));
  }
  updateActiveNav();
}

function navButton(view, label) {
  const button = document.createElement('button');
  button.className = 'nav-item';
  button.dataset.view = view;
  button.type = 'button';
  const badges = {
    queue: openTickets().length,
    claimed: state.tickets.filter(t => t.assignedTo === state.session.username).length,
    allTickets: state.tickets.length,
    myTickets: myTickets().length,
    status: state.tickets.filter(t => t.status !== 'Resolved').length,
    create: '+',
    users: 'AD',
    statistics: '%',
    system: 'OK'
  };
  const icon = view === 'queue' || view === 'allTickets' ? '<span class="priority-dot p-urgent"></span>' :
    view === 'claimed' || view === 'myTickets' ? '<span class="priority-dot p-medium"></span>' :
    view === 'status' || view === 'system' ? '<span class="priority-dot p-high"></span>' :
    '<span class="priority-dot p-low"></span>';
  button.innerHTML = `${icon}<span>${escapeHtml(label)}</span><span class="nav-badge muted">${escapeHtml(badges[view] ?? '')}</span>`;
  return button;
}

function navigate(view) {
  state.currentView = view;
  if (!state.selectedTicketId) state.selectedTicketId = firstVisibleTicket()?.id || null;
  renderCurrentView();
}

function renderCurrentView() {
  if (!state.session) return;
  updateActiveNav();
  renderNotifications();
  const title = viewTitle(state.currentView);
  document.getElementById('page-title').textContent = title;

  if (state.currentView === 'create') return renderCreateTicket();
  if (state.currentView === 'knowledge') return renderKnowledgeBase();
  if (state.currentView === 'messages') return renderTicketWorkspace('Chat/meldinger', visibleTickets());
  if (['queue', 'claimed', 'allTickets', 'myTickets', 'status'].includes(state.currentView)) {
    return renderTicketWorkspace(title, visibleTickets());
  }
  if (state.currentView === 'users') return renderUsers();
  if (state.currentView === 'statistics') return renderStatistics();
  if (state.currentView === 'system') return renderSystemStatus();
}

function updateActiveNav() {
  for (const item of document.querySelectorAll('.nav-item')) {
    item.classList.toggle('active', item.dataset.view === state.currentView);
  }
}

function viewTitle(view) {
  const labels = {
    create: 'Create ticket',
    myTickets: 'My tickets',
    queue: 'Ticket queue',
    claimed: 'My claimed tickets',
    status: 'Change ticket status',
    allTickets: 'All tickets',
    users: 'Users',
    statistics: 'Statistics',
    system: 'System status',
    knowledge: 'Kunnskapsbase',
    messages: 'Chat/meldinger'
  };
  return labels[view] || 'HelpDesk';
}

function renderCreateTicket() {
  document.getElementById('main-view').innerHTML = `
    <div class="dashboard">
      <div class="two-column">
        <form id="create-ticket-form" class="card form-grid">
          <h2>Opprett ny sak</h2>
          <label>Tittel <input class="field" name="title" required></label>
          <label>Kategori
            <select class="select" name="category">
              <option>Account</option>
              <option>Network</option>
              <option>Hardware</option>
              <option>Software</option>
              <option>Other</option>
            </select>
          </label>
          <label>Prioritet
            <select class="select" name="priority">
              <option>Low</option>
              <option selected>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </label>
          <label>Beskrivelse <textarea class="textarea" name="description" required></textarea></label>
          <button class="btn btn-primary" type="submit">Send sak</button>
        </form>
        <div class="card">
          <h2>Mine siste saker</h2>
          <div class="kb-list">${ticketCards(myTickets().slice(0, 4))}</div>
        </div>
      </div>
    </div>`;

  document.getElementById('create-ticket-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ticket = {
      id: nextTicketId(),
      title: form.get('title').trim(),
      description: form.get('description').trim(),
      category: form.get('category'),
      priority: form.get('priority'),
      status: 'Open',
      createdBy: state.session.username,
      assignedTo: '',
      messages: [{
        from: state.session.username,
        body: form.get('description').trim(),
        at: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };
    state.tickets.unshift(ticket);
    saveTickets();
    state.selectedTicketId = ticket.id;
    navigate('myTickets');
  });
}

function renderTicketWorkspace(title, tickets) {
  const selected = tickets.find(t => t.id === state.selectedTicketId) || tickets[0];
  state.selectedTicketId = selected?.id || null;
  document.getElementById('main-view').innerHTML = `
    <div class="ticket-list-panel">
      <div class="panel-header">
        <div class="panel-title">${escapeHtml(title)}</div>
        <span class="badge badge-tag">${tickets.length}</span>
      </div>
      <div class="filter-tabs">
        <button class="filter-tab active" type="button">All</button>
        <button class="filter-tab" type="button">Open</button>
        <button class="filter-tab" type="button">Waiting</button>
        <button class="filter-tab" type="button">Resolved</button>
      </div>
      <div class="ticket-scroll">${tickets.map(ticketListItem).join('') || emptyState('Ingen saker i denne visningen.')}</div>
    </div>
    ${selected ? ticketDetail(selected) : '<div class="dashboard"><div class="card">Ingen sak valgt.</div></div>'}`;

  for (const item of document.querySelectorAll('[data-ticket-id]')) {
    item.addEventListener('click', () => {
      state.selectedTicketId = item.dataset.ticketId;
      renderCurrentView();
    });
  }
  const claimButton = document.getElementById('claim-ticket');
  if (claimButton) claimButton.addEventListener('click', () => claimTicket(selected.id));
  const statusSelect = document.getElementById('ticket-status');
  if (statusSelect) statusSelect.addEventListener('change', event => updateTicketStatus(selected.id, event.target.value));
  const resolveButton = document.querySelector('[data-resolve-ticket]');
  if (resolveButton) resolveButton.addEventListener('click', () => updateTicketStatus(selected.id, 'Resolved'));
  const replyForm = document.getElementById('reply-form');
  if (replyForm) replyForm.addEventListener('submit', event => addMessage(event, selected.id));
  for (const tab of document.querySelectorAll('.reply-tab')) {
    tab.addEventListener('click', event => {
      event.preventDefault();
      tab.closest('.reply-tabs').querySelectorAll('.reply-tab').forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      const input = document.querySelector('.reply-input');
      if (input) input.placeholder = tab.textContent === 'Note' ? 'Add an internal note...' : tab.textContent === 'Forward' ? 'Forward to an email address...' : 'Write a reply...';
    });
  }
}

function ticketListItem(ticket) {
  const selected = ticket.id === state.selectedTicketId ? ' selected' : '';
  return `
    <div class="ticket-item${selected}" data-ticket-id="${ticket.id}">
      <div class="ticket-top">
        <div class="ticket-avatar" style="background:${avatarColor(ticket.createdBy)}">${initials(ticket.createdBy)}</div>
        <div class="ticket-meta">
          <div class="ticket-name">${escapeHtml(ticket.createdBy)}</div>
          <div class="ticket-subject">${escapeHtml(ticket.title)}</div>
        </div>
        <div class="ticket-time">${relativeTime(ticket.createdAt)}</div>
      </div>
      <div class="ticket-preview">${escapeHtml(ticket.description)}</div>
      <div class="ticket-footer">
        <span class="badge ${statusClasses[ticket.status] || 'badge-open'}">${escapeHtml(ticket.status)}</span>
        <span class="badge ${ticket.priority === 'Urgent' ? 'badge-urgent' : 'badge-tag'}">${escapeHtml(ticket.priority)}</span>
        <span class="badge badge-tag">${escapeHtml(ticket.category)}</span>
      </div>
    </div>`;
}

function ticketDetail(ticket) {
  const canWork = state.session.role === 'support' || state.session.role === 'admin';
  const mine = ticket.createdBy === state.session.username;
  const canChat = canWork || mine;
  const priorityClassName = priorityClass(ticket.priority);
  return `
    <article class="ticket-detail">
      ${statsStrip()}
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-ticket-id">#${escapeHtml(ticket.id)}</div>
          <div class="detail-title">${escapeHtml(ticket.title)}</div>
          <div class="detail-meta">
            <span class="badge ${ticket.priority === 'Urgent' ? 'badge-urgent' : statusClasses[ticket.status] || 'badge-open'}">${escapeHtml(ticket.priority)} · ${escapeHtml(ticket.status)}</span>
            <span class="detail-meta-item">
              <svg viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5"/><path d="M6.5 4v3L8 8.5"/></svg>
              Opened ${relativeTime(ticket.createdAt)} ago
            </span>
            <span class="detail-meta-item">
              <svg viewBox="0 0 13 13"><circle cx="6.5" cy="5" r="2.5"/><path d="M2 12c0-2.5 2-4.5 4.5-4.5S11 9.5 11 12"/></svg>
              ${escapeHtml(ticket.createdBy)}
            </span>
            <span class="detail-meta-item">
              <svg viewBox="0 0 13 13"><rect x="1.5" y="2.5" width="10" height="8" rx="1"/><path d="M4.5 1v3M8.5 1v3M1.5 7h10"/></svg>
              ${escapeHtml(ticket.category)}
            </span>
          </div>
        </div>
        <div class="detail-actions">
          ${canWork ? `<select id="ticket-status" class="status-select">
            ${['Open', 'In Progress', 'Waiting', 'Resolved'].map(s => `<option ${s === ticket.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button id="claim-ticket" class="btn btn-ghost" type="button">Claim</button>
          <button class="btn btn-ghost" type="button" data-resolve-ticket="${ticket.id}">
            <svg viewBox="0 0 16 16"><path d="M2 14l2-6L12 2l2 2-8 8-6 2z"/></svg>
            Resolve
          </button>` : ''}
        </div>
      </div>
      <div class="detail-body">
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;">
          <div class="conversation">
            ${ticket.messages.map(messageHtml).join('')}
          </div>
          ${canChat ? replyBox() : ''}
        </div>
        <aside class="detail-sidebar">
          <div>
            <div class="ds-section-title">Ticket Info</div>
            <div class="ds-field">
              <div class="ds-label">Status</div>
              <span class="badge ${statusClasses[ticket.status] || 'badge-open'}">${escapeHtml(ticket.status)}</span>
            </div>
            <div class="ds-field">
              <div class="ds-label">Priority</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                <span class="priority-dot ${priorityClassName}"></span>
                <span class="ds-value">${escapeHtml(ticket.priority)}</span>
              </div>
            </div>
            <div class="ds-field">
              <div class="ds-label">Channel</div>
              <div class="ds-value">Web portal</div>
            </div>
            <div class="ds-field">
              <div class="ds-label">SLA</div>
              <div class="ds-value" style="color:var(--red);">${ticket.status === 'Resolved' ? 'Completed' : 'Active case'}</div>
              <div class="progress-bar"><div class="progress-fill" style="width:${ticket.status === 'Resolved' ? '100' : '62'}%;background:${ticket.status === 'Resolved' ? 'var(--green)' : 'var(--red)'};"></div></div>
            </div>
          </div>
          <div class="sep"></div>
          <div>
            <div class="ds-section-title">Assignee</div>
            <div class="assignee-row">
              <div class="agent-avatar" style="width:26px;height:26px;background:${avatarColor(ticket.assignedTo || 'unassigned')};font-size:10px;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:600;">${initials(ticket.assignedTo || 'UA')}</div>
              <div>
                <div style="font-size:13px;font-weight:500;">${escapeHtml(ticket.assignedTo || 'Unassigned')}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">${ticket.assignedTo ? 'Online now' : 'Waiting in queue'}</div>
              </div>
              <svg viewBox="0 0 14 14"><path d="M5 3l4 4-4 4"/></svg>
            </div>
          </div>
          <div class="sep"></div>
          <div>
            <div class="ds-section-title">Customer</div>
            <div class="ds-field"><div class="ds-label">Name</div><div class="ds-value link">${escapeHtml(ticket.createdBy)}</div></div>
            <div class="ds-field"><div class="ds-label">Created</div><div class="ds-value">${new Date(ticket.createdAt).toLocaleString('nb-NO')}</div></div>
            <div class="ds-field"><div class="ds-label">Tickets</div><div class="ds-value">${state.tickets.filter(t => t.createdBy === ticket.createdBy).length} total</div></div>
          </div>
          <div class="sep"></div>
          <div>
            <div class="ds-section-title">Tags</div>
            <div class="tag-list">
              <span class="tag-item">${escapeHtml(ticket.category.toLowerCase())}</span>
              <span class="tag-item">${escapeHtml(ticket.priority.toLowerCase())}</span>
              <span class="tag-item">ad-helpdesk</span>
            </div>
          </div>
          <div class="sep"></div>
          <div>
            <div class="ds-section-title">Activity</div>
            ${activityTimeline(ticket)}
          </div>
        </aside>
      </div>
    </article>`;
}

function messageHtml(message) {
  const mine = message.from === state.session.username ? ' agent' : '';
  const note = message.from === 'System';
  return `
    <div class="message${mine}">
      <div class="msg-avatar" style="background:${avatarColor(message.from)}">${initials(message.from)}</div>
      <div class="msg-content">
        <div class="msg-header">
          <span class="msg-name">${escapeHtml(message.from)}</span>
          <span class="msg-time">${new Date(message.at).toLocaleString('nb-NO')}</span>
        </div>
        ${note ? `<div class="msg-note"><div class="note-label">System</div>${escapeHtml(message.body)}</div>` : `<div class="msg-bubble">${escapeHtml(message.body)}</div>`}
      </div>
    </div>`;
}

function statsStrip() {
  const openToday = state.tickets.filter(t => t.status !== 'Resolved').length;
  const resolvedToday = state.tickets.filter(t => t.status === 'Resolved').length;
  const claimed = state.tickets.filter(t => t.assignedTo).length;
  return `
    <div class="stats-strip">
      <div class="stat-item">
        <span class="stat-label">Open today</span>
        <span class="stat-value">${openToday}</span>
        <span class="stat-change stat-up">${state.session.role}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Avg. response</span>
        <span class="stat-value">4.2m</span>
        <span class="stat-change stat-up">AD verified</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Claimed</span>
        <span class="stat-value">${claimed}</span>
        <span class="stat-change stat-up">Live queue</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Resolved today</span>
        <span class="stat-value">${resolvedToday}</span>
        <span class="stat-change stat-up">localStorage</span>
      </div>
    </div>`;
}

function priorityClass(priority) {
  if (priority === 'Urgent') return 'p-urgent';
  if (priority === 'High') return 'p-high';
  if (priority === 'Medium') return 'p-medium';
  return 'p-low';
}

function activityTimeline(ticket) {
  const assignedText = ticket.assignedTo ? `Assigned to <strong>${escapeHtml(ticket.assignedTo)}</strong>` : 'Waiting for support claim';
  const lastMessage = ticket.messages[ticket.messages.length - 1];
  return `
    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-dot accent"><svg viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3"/></svg></div>
        <div class="timeline-line"></div>
        <div class="timeline-text">
          <div class="timeline-action"><strong>${escapeHtml(lastMessage?.from || ticket.createdBy)}</strong> updated ticket</div>
          <div class="timeline-time">${lastMessage ? new Date(lastMessage.at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot"><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3"/></svg></div>
        <div class="timeline-line"></div>
        <div class="timeline-text">
          <div class="timeline-action">${assignedText}</div>
          <div class="timeline-time">${ticket.assignedTo ? 'Claimed' : 'Queue'}</div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-dot"><svg viewBox="0 0 10 10"><path d="M3 2h4M5 2v6M2 8h6"/></svg></div>
        <div class="timeline-text">
          <div class="timeline-action">Ticket created by <strong>${escapeHtml(ticket.createdBy)}</strong></div>
          <div class="timeline-time">${new Date(ticket.createdAt).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>`;
}

function replyBox() {
  return `
    <form id="reply-form" class="reply-area">
      <div class="reply-tabs">
        <button class="reply-tab active" type="button">Reply</button>
        <button class="reply-tab" type="button">Note</button>
        <button class="reply-tab" type="button">Forward</button>
      </div>
      <textarea class="reply-input" name="message" placeholder="Write a reply..." required></textarea>
      <div class="reply-footer">
        <div class="reply-toolbar">
          <button class="toolbar-btn" type="button" title="Bold"><svg viewBox="0 0 15 15"><path d="M4 2.5h4a3 3 0 0 1 0 6H4zm0 6h4.5a3.5 3.5 0 0 1 0 7H4z"/></svg></button>
          <button class="toolbar-btn" type="button" title="Italic"><svg viewBox="0 0 15 15"><path d="M6 2.5h4M5 12.5h4M8 2.5 6.5 12.5"/></svg></button>
          <button class="toolbar-btn" type="button" title="Link"><svg viewBox="0 0 15 15"><path d="M6 9a3 3 0 0 1 0-4.2L7.8 3A3 3 0 1 1 12 7.2L10.2 9M9 6a3 3 0 0 1 0 4.2L7.2 12A3 3 0 1 1 3 7.8L4.8 6"/></svg></button>
          <button class="toolbar-btn" type="button" title="Attach"><svg viewBox="0 0 15 15"><path d="M13 7.5 7.2 13.3a3.7 3.7 0 0 1-5.2-5.2L7.8 2.3A2.5 2.5 0 1 1 11.3 5.8L5.5 11.6a1.2 1.2 0 0 1-1.7-1.7L9.5 4.2"/></svg></button>
        </div>
        <button class="btn btn-ghost" type="button">Save Draft</button>
        <button class="btn btn-primary" type="submit">Send</button>
      </div>
    </form>`;
}

function addMessage(event, ticketId) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const body = form.get('message').trim();
  if (!body) return;
  const ticket = state.tickets.find(t => t.id === ticketId);
  ticket.messages.push({ from: state.session.username, body, at: new Date().toISOString() });
  saveTickets();
  renderCurrentView();
}

function claimTicket(ticketId) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  ticket.assignedTo = state.session.username;
  ticket.status = 'In Progress';
  const note = `${state.session.username} har tatt saken din. Du kan sende melding til support.`;
  ticket.messages.push({ from: 'System', body: note, at: new Date().toISOString() });
  if (ticket.createdBy !== state.session.username) {
    state.notifications.unshift({ ticketId, text: note });
  }
  saveTickets();
  renderCurrentView();
}

function updateTicketStatus(ticketId, status) {
  const ticket = state.tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  ticket.status = status;
  saveTickets();
  renderCurrentView();
}

function renderKnowledgeBase() {
  document.getElementById('main-view').innerHTML = `
    <div class="dashboard">
      <div class="cards">
        <div class="card"><span class="stat-value">${kbArticles.length}</span><span class="stat-label">Artikler</span></div>
        <div class="card"><span class="stat-value">${state.session.role}</span><span class="stat-label">Menyen beholdes for rollen</span></div>
      </div>
      <div class="kb-list">${kbArticles.map(article => `
        <article class="kb-item">
          <div class="kb-title">${escapeHtml(article.title)}</div>
          <div class="kb-body">${escapeHtml(article.body)}</div>
        </article>`).join('')}
      </div>
      ${state.session.role === 'admin' ? '<div class="card" style="margin-top:16px;"><h2>Knowledge base admin</h2><p>Admin kan legge til, redigere og publisere artikler her.</p></div>' : ''}
    </div>`;
}

function renderUsers() {
  document.getElementById('main-view').innerHTML = `
    <div class="dashboard">
      <div class="card">
        <h2>AD-brukere</h2>
        <p>Produksjonsversjonen kan hente dette fra AD. Roller skal fortsatt komme fra AD-grupper, ikke fra frontend.</p>
      </div>
      <div class="cards">
        <div class="card"><span class="stat-value">GG_HelpDesk_Admin</span><span class="stat-label">Admin role group</span></div>
        <div class="card"><span class="stat-value">GG_HelpDesk_Support</span><span class="stat-label">Support role group</span></div>
        <div class="card"><span class="stat-value">GG_HelpDesk_User</span><span class="stat-label">User role group</span></div>
      </div>
    </div>`;
}

function renderStatistics() {
  const open = state.tickets.filter(t => t.status !== 'Resolved').length;
  const resolved = state.tickets.filter(t => t.status === 'Resolved').length;
  document.getElementById('main-view').innerHTML = `
    <div class="dashboard">
      <div class="cards">
        <div class="card"><span class="stat-value">${state.tickets.length}</span><span class="stat-label">Total tickets</span></div>
        <div class="card"><span class="stat-value">${open}</span><span class="stat-label">Open tickets</span></div>
        <div class="card"><span class="stat-value">${resolved}</span><span class="stat-label">Resolved tickets</span></div>
      </div>
    </div>`;
}

function renderSystemStatus() {
  document.getElementById('main-view').innerHTML = `
    <div class="dashboard">
      <div class="cards">
        <div class="card"><span class="stat-value">192.168.51.2</span><span class="stat-label">Windows Server AD DS/DNS/DHCP</span></div>
        <div class="card"><span class="stat-value">192.168.51.3</span><span class="stat-label">Ubuntu Apache HelpDesk</span></div>
        <div class="card"><span class="stat-value">LDAP</span><span class="stat-label">Checked by C++ CGI backend</span></div>
      </div>
    </div>`;
}

function visibleTickets() {
  const query = document.getElementById('ticket-search')?.value.toLowerCase().trim() || '';
  let tickets = state.tickets;
  if (state.session.role === 'user' || state.currentView === 'myTickets') {
    tickets = myTickets();
  } else if (state.currentView === 'claimed') {
    tickets = tickets.filter(t => t.assignedTo === state.session.username);
  } else if (state.currentView === 'queue') {
    tickets = tickets.filter(t => t.status !== 'Resolved');
  }
  if (query) {
    tickets = tickets.filter(t =>
      [t.id, t.title, t.description, t.category, t.priority, t.status, t.createdBy, t.assignedTo]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }
  return tickets;
}

function firstVisibleTicket() {
  return visibleTickets()[0] || state.tickets[0];
}

function myTickets() {
  return state.tickets.filter(t => t.createdBy === state.session?.username);
}

function openTickets() {
  return state.tickets.filter(t => t.status !== 'Resolved');
}

function ticketCards(tickets) {
  if (!tickets.length) return emptyState('Ingen saker opprettet enna.');
  return tickets.map(t => `
    <div class="kb-item">
      <div class="kb-title">#${escapeHtml(t.id)} ${escapeHtml(t.title)}</div>
      <div class="kb-body">${escapeHtml(t.status)} - ${escapeHtml(t.category)}</div>
    </div>`).join('');
}

function emptyState(text) {
  return `<div class="card">${escapeHtml(text)}</div>`;
}

function renderNotifications() {
  const area = document.getElementById('notification-area');
  area.innerHTML = state.notifications.map(n => `<div class="notice">${escapeHtml(n.text)}</div>`).join('');
}

function loadTickets() {
  const stored = localStorage.getItem('helpdeskTickets');
  if (stored) {
    try { return JSON.parse(stored); } catch (_) {}
  }
  return [
    {
      id: 'TK-2041',
      title: 'Kan ikke logge inn etter passordbytte',
      description: 'Kontoen min er last etter at jeg byttet passord. Jeg trenger tilgang for a levere rapport.',
      category: 'Account',
      priority: 'Urgent',
      status: 'Open',
      createdBy: 'user1',
      assignedTo: '',
      messages: [
        { from: 'user1', body: 'Kontoen min er last etter passordbytte. Kan dere hjelpe?', at: new Date(Date.now() - 1000 * 60 * 20).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    },
    {
      id: 'TK-2042',
      title: 'Printer pa kontoret svarer ikke',
      description: 'Printeren i andre etasje tar ikke imot jobber fra Windows-klienter.',
      category: 'Hardware',
      priority: 'Medium',
      status: 'Waiting',
      createdBy: 'kari',
      assignedTo: 'support1',
      messages: [
        { from: 'kari', body: 'Printeren viser online, men ingen utskrifter kommer.', at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
        { from: 'support1', body: 'Jeg sjekker print queue og driver pa serveren.', at: new Date(Date.now() - 1000 * 60 * 70).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    }
  ];
}

function saveTickets() {
  localStorage.setItem('helpdeskTickets', JSON.stringify(state.tickets));
}

function nextTicketId() {
  const max = state.tickets
    .map(t => Number(String(t.id).replace(/\D/g, '')))
    .filter(Boolean)
    .reduce((a, b) => Math.max(a, b), 2040);
  return `TK-${max + 1}`;
}

function initials(name) {
  return String(name || 'AD')
    .replace(/.*\\/, '')
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'AD';
}

function avatarColor(value) {
  const colors = ['#2D5BE3', '#0F6E56', '#92520A', '#B92A2A', '#5B3FB5', '#1E7A4A'];
  const sum = String(value).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

function relativeTime(dateValue) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(dateValue).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
