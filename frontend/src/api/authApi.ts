import type { AuthResponse, Role } from '../types/helpdesk';

const BOOTSTRAP_URL = '/cgi-bin/ad-bootstrap';
const LOGIN_URL = '/cgi-bin/ad-login';

const mockUsers: Record<string, { password: string; role: Role; matchedGroup: string }> = {
  admin1: { password: 'test', role: 'admin', matchedGroup: 'GG_HelpDesk_Admin' },
  support1: { password: 'test', role: 'support', matchedGroup: 'GG_HelpDesk_Support' },
  user1: { password: 'test', role: 'user', matchedGroup: 'GG_HelpDesk_User' }
};

const useMockAuth = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

export async function bootstrapAuth(): Promise<AuthResponse> {
  if (useMockAuth) {
    // Local Windows/Vite development only. Production Apache builds call the real C++ CGI endpoint.
    return {
      status: 'manual_login_required',
      message: 'Could not find AD role automatically'
    };
  }

  const response = await fetch(BOOTSTRAP_URL, { headers: { Accept: 'application/json' } });
  return response.json();
}

export async function manualLogin(username: string, password: string): Promise<AuthResponse> {
  if (useMockAuth) {
    // Mock login is only for local development when /cgi-bin endpoints are not available.
    // It still returns the same shape as the C++ backend and the UI never lets users choose a role.
    const user = mockUsers[username];
    if (!user || user.password !== password) {
      return { status: 'login_failed', message: 'Invalid AD username or password' };
    }
    return {
      status: 'manual_login_ok',
      username,
      role: user.role,
      matchedGroup: user.matchedGroup,
      source: 'Mock Active Directory',
      checkedBy: 'Mock C++ LDAP Role Resolver'
    };
  }

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}
