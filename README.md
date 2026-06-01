# DeskFlow HelpDesk exam app

DeskFlow is a local exam-ready HelpDesk demo with a React/Vite frontend and a small C++ audit logging feature.

The active app flow no longer depends on Active Directory, LDAP, Kerberos, `REMOTE_USER`, Windows Integrated Authentication, or CGI login endpoints. Those approaches were tested earlier, but they are now historical documentation only.

## Active architecture

```text
React frontend -> local exam login -> role-based HelpDesk UI
```

The frontend uses a local demo login module:

- `user1 / user123` -> `user`
- `support1 / support123` -> `support`
- `admin1 / admin123` -> `admin`

The returned role controls the UI:

- `user`: create ticket, see own tickets, public replies only
- `support`: queue, claimed tickets, replies, internal notes, status updates
- `admin`: all tickets, admin panels, replies, internal notes, status updates

Internal notes are still filtered in React before rendering. Normal users do not receive note/forward controls and do not see internal note messages.

## Frontend

Install and build from the root:

```powershell
npm install
npm run build
```

Run locally:

```powershell
npm run dev
```

The root scripts proxy into `frontend/`, so you can run these commands from the repository root.

## C++ audit logging demo

The C++ feature is in `cpp-backend/`.

Files:

- `AuditLogger.h`
- `AuditLogger.cpp`
- `login.cpp`
- `CMakeLists.txt`

`AuditLogger::logLoginAttempt(username, success, role, ipAddress)` writes one password-free line per login attempt.

Local Windows test log:

```text
logs/helpdesk-auth.log
```

Example line:

```text
2026-06-01 13:20:11 | user=support1 | result=success | role=support | ip=local
```

Build:

```powershell
cd cpp-backend
cmake -S . -B build
cmake --build build
```

Run demo after building:

```powershell
.\build\Debug\helpdesk-audit-demo.exe support1 success support local
```

For a single-config CMake generator, the executable may be:

```powershell
.\build\helpdesk-audit-demo.exe support1 success support local
```

On Ubuntu, the production log path can be configured with `HELPDESK_AUTH_LOG=/var/log/helpdesk-auth.log`.

## Historical AD/Kerberos/LDAP work

Earlier versions tested AD, LDAP, Kerberos, Apache CGI, `/cgi-bin/ad-login`, and `/cgi-bin/ad-bootstrap`. Those files and notes are kept as historical evidence of attempted integration, but they are not the active exam login flow.

Do not commit real `.env` files, keytabs, LDAP passwords, or system Apache configuration.

## Internal note permission test

```text
Internal note permission test:
1. Login as admin1
2. Open ticket
3. Add internal note
4. Confirm admin can see internal note
5. Logout/login as user1
6. Open same ticket
7. Confirm user cannot see internal note
8. Confirm user cannot see Note tab
9. Confirm user cannot see Forward tab
10. Confirm user can still send normal public reply
```
