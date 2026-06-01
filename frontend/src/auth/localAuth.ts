import type { AuthResponse, Role } from '../types/helpdesk';

const demoUsers: Record<string, { password: string; role: Role }> = {
  user1: { password: 'user123', role: 'user' },
  support1: { password: 'support123', role: 'support' },
  admin1: { password: 'admin123', role: 'admin' }
};

function matchedGroup(role: Role) {
  if (role === 'admin') return 'Local_Admin';
  if (role === 'support') return 'Local_Support';
  return 'Local_User';
}

export async function localLogin(username: string, password: string): Promise<AuthResponse> {
  const normalizedUsername = username.trim();
  const user = demoUsers[normalizedUsername];

  if (!user || user.password !== password) {
    return {
      status: 'login_failed',
      message: 'Ugyldig brukernavn eller passord'
    };
  }

  return {
    status: 'ok',
    username: normalizedUsername,
    role: user.role,
    matchedGroup: matchedGroup(user.role),
    source: 'Local exam login',
    checkedBy: 'Demo role mapping'
  };
}
