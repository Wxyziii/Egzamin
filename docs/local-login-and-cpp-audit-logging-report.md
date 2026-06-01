# Local login and C++ audit logging report

## What was changed

The active HelpDesk app now uses local exam login instead of Active Directory, LDAP, Kerberos, `REMOTE_USER`, Windows Integrated Authentication, or CGI login endpoints.

The React frontend no longer calls:

- `/cgi-bin/ad-bootstrap`
- `/cgi-bin/ad-login`

The app shows the login form first and authenticates against local demo users in `frontend/src/auth/localAuth.ts`.

## Why AD/Kerberos/LDAP was removed

AD/Kerberos/LDAP was tested earlier, but it depends on domain services, LDAP configuration, keytabs, browser negotiation, and server-side Apache setup. That is too fragile for the Windows PC exam environment.

The exam version uses a stable local login so the HelpDesk functionality can always be demonstrated.

## New login users

| Username | Password | Role |
| --- | --- | --- |
| `user1` | `user123` | `user` |
| `support1` | `support123` | `support` |
| `admin1` | `admin123` | `admin` |

Wrong credentials return:

```json
{
  "status": "login_failed",
  "message": "Ugyldig brukernavn eller passord"
}
```

Successful login returns:

```json
{
  "status": "ok",
  "username": "support1",
  "role": "support"
}
```

## How the frontend decides UI by role

`frontend/src/App.tsx` receives the local login result, normalizes the role, and stores it in `session`.

The UI uses `session.role` to decide which dashboard and controls are visible:

- `user`: user dashboard, own tickets, public replies
- `support`: support queue, claim ticket, status changes, internal notes
- `admin`: all tickets, admin panels, status changes, internal notes

Internal notes are filtered in `ConversationPanel.tsx` before rendering. `ReplyBox.tsx` only shows `Reply`, `Note`, and `Forward` for support/admin.

## C++ AuditLogger explanation

The C++ feature demonstrates backend development without requiring AD/LDAP.

`AuditLogger::logLoginAttempt(username, success, role, ipAddress)` writes a single log line for each login attempt. It includes:

- timestamp
- username
- success or failed result
- role
- IP address

It never logs passwords.

Local log path:

```text
logs/helpdesk-auth.log
```

Production Ubuntu path can be configured as:

```text
/var/log/helpdesk-auth.log
```

## C++ files created or updated

- `cpp-backend/AuditLogger.h`
- `cpp-backend/AuditLogger.cpp`
- `cpp-backend/login.cpp`
- `cpp-backend/CMakeLists.txt`

## Build frontend

```powershell
npm install
npm run build
npm run dev
```

## Build C++

```powershell
cd cpp-backend
cmake -S . -B build
cmake --build build
```

## Test login

1. Run `npm run dev`.
2. Open the Vite URL.
3. Log in with `user1 / user123`.
4. Confirm user UI appears.
5. Log in with `support1 / support123`.
6. Confirm support UI appears.
7. Log in with `admin1 / admin123`.
8. Confirm admin UI appears.
9. Try a wrong password and confirm the clean error message.

## Test audit logging

From `cpp-backend` after building:

```powershell
.\build\Debug\helpdesk-audit-demo.exe support1 success support local
.\build\Debug\helpdesk-audit-demo.exe user1 failed none local
```

Then inspect:

```powershell
Get-Content .\logs\helpdesk-auth.log
```

If the generator does not create `Debug`, run:

```powershell
.\build\helpdesk-audit-demo.exe support1 success support local
```

## What I can show during the exam

- Local role-based login
- Three different dashboards for user/support/admin
- Internal notes hidden from normal users
- C++ `AuditLogger` source code
- CMake build
- Generated audit log lines
- Explanation of why AD/Kerberos/LDAP was removed from the active exam flow

## Eksamen forklaring

I denne versjonen bruker jeg lokal innlogging i stedet for Active Directory. Grunnen er at AD/Kerberos/LDAP ble for ustabilt i labmiljøet, og jeg ville ha en løsning som fungerer sikkert under eksamen.

Brukeren logger inn med en testbruker. Systemet returnerer en rolle: user, support eller admin. Rollen bestemmer hvilket grensesnitt brukeren får se.

Jeg har også lagt til C++ audit logging. AuditLogger skriver innloggingsforsøk til en loggfil. Loggen viser tidspunkt, brukernavn, om innloggingen var vellykket eller feilet, rollen brukeren fikk, og IP-adresse. Dette er nyttig for drift, feilsøking og sikkerhet.

Dette gir meg noe konkret å vise i utviklingsdelen: Jeg kan forklare C++-koden, vise hvordan logging fungerer, bygge med CMake og demonstrere loggen.
