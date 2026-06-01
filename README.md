# DeskFlow HelpDesk exam project

DeskFlow is an exam-ready HelpDesk system with a React/Vite frontend and a C++ CGI backend that resolves roles from Active Directory through LDAP.

The original static `helpdesk.html` mockup is still present as a visual reference, but the runnable frontend is now in `frontend/`.

## Architecture

- `frontend/` - React + Vite + TypeScript app, built as static files for Apache
- `cpp-backend/` - C++ CGI endpoints for LDAP role lookup and AD login
- Apache on Ubuntu hosts the frontend and exposes `/cgi-bin/ad-bootstrap` and `/cgi-bin/ad-login`
- Windows Server AD DS/DNS/DHCP runs at `192.168.51.2`
- Ubuntu HelpDesk server runs at `192.168.51.3`

Security boundary:

1. Browser opens the React app.
2. React shows `Sjekker rolle mot Active Directory...`.
3. React calls `/cgi-bin/ad-bootstrap`.
4. C++ reads the authenticated user if Apache provides one.
5. C++ checks AD groups with LDAP.
6. If automatic lookup fails, React shows manual AD login.
7. Manual login posts to `/cgi-bin/ad-login`.
8. C++ validates the password with LDAP bind and maps AD groups to HelpDesk roles.
9. React renders dashboards only after backend role JSON is returned.

The frontend never lets a user choose admin/support/user manually.

## AD groups

- `GG_HelpDesk_Admin` -> `admin`
- `GG_HelpDesk_Support` -> `support`
- `GG_HelpDesk_User` -> `user`

The live-coding role mapping is in:

```text
cpp-backend/RoleResolver.cpp
```

Look for:

```cpp
// EXAM LIVE CODING AREA:
```

## Local Windows frontend development

From the project root:

```bash
npm run install:frontend
npm run dev
```

Or from the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173/
```

Local dev uses a clean mock mode because Windows/Vite does not normally have Apache CGI endpoints.

Mock users:

- `admin1 / test` -> admin
- `support1 / test` -> support
- `user1 / test` -> user

Mock mode is only active in Vite development. Production builds call the real C++ CGI endpoints:

- `/cgi-bin/ad-bootstrap`
- `/cgi-bin/ad-login`

To force real endpoints during Vite development:

```bash
set VITE_USE_MOCK_AUTH=false
npm run dev
```

## Frontend build for Apache

```bash
cd frontend
npm install
npm run build
```

The static build is created in:

```text
frontend/dist/
```

Deploy frontend to Apache:

```bash
sudo cp -r frontend/dist/* /var/www/html/
```

## C++ backend dependencies on Ubuntu

```bash
sudo apt update
sudo apt install apache2 g++ cmake make libldap2-dev ldap-utils
```

## Configure LDAP

Copy the example config and edit the real password on the Ubuntu server:

```bash
sudo cp cpp-backend/config.example /etc/helpdesk-ldap.conf
sudo nano /etc/helpdesk-ldap.conf
sudo chmod 600 /etc/helpdesk-ldap.conf
```

Example:

```text
LDAP_URI=ldap://192.168.51.2
BASE_DN=DC=eksamen,DC=local
BIND_DN=CN=svc_helpdesk_ldap,OU=Service Accounts,DC=eksamen,DC=local
BIND_PASSWORD=change-me
USER_DOMAIN=eksamen.local
START_TLS=false
```

Do not commit the real `BIND_PASSWORD`.

## Test AD connectivity

```bash
ldapsearch -x \
  -H ldap://192.168.51.2 \
  -D "CN=svc_helpdesk_ldap,OU=Service Accounts,DC=eksamen,DC=local" \
  -W \
  -b "DC=eksamen,DC=local" \
  "(sAMAccountName=support1)" memberOf
```

The output should include one of the `GG_HelpDesk_*` groups.

## Build C++ backend

```bash
cd cpp-backend
cmake -S . -B build
cmake --build build
```

This creates:

- `build/ad-bootstrap`
- `build/ad-login`

## Deploy C++ CGI to Apache

```bash
sudo a2enmod cgi
sudo systemctl restart apache2
sudo cp cpp-backend/build/ad-bootstrap /usr/lib/cgi-bin/ad-bootstrap
sudo cp cpp-backend/build/ad-login /usr/lib/cgi-bin/ad-login
sudo chmod +x /usr/lib/cgi-bin/ad-bootstrap
sudo chmod +x /usr/lib/cgi-bin/ad-login
```

## Test backend endpoints

Automatic role check:

```text
http://192.168.51.3/cgi-bin/ad-bootstrap
```

Expected automatic success:

```json
{
  "status": "auto_login_ok",
  "username": "support1",
  "role": "support",
  "matchedGroup": "GG_HelpDesk_Support",
  "source": "Active Directory",
  "checkedBy": "C++ LDAP Role Resolver"
}
```

Manual login:

```bash
curl -i \
  -H "Content-Type: application/json" \
  -d '{"username":"support1","password":"AD_PASSWORD_HERE"}' \
  http://192.168.51.3/cgi-bin/ad-login
```

## React state behavior

The React app keeps tickets in central state and persists demo data in `localStorage`.

Implemented mutations:

- `createTicket`
- `claimTicket`
- `sendMessage`
- `changeTicketStatus`
- `addNotification`
- `selectTicket`

For exam/demo use, it also syncs updates between tabs with:

- `BroadcastChannel`
- browser `storage` event

This is clearly commented in `frontend/src/state/helpdeskStore.ts` as demo-only realtime simulation.

## Exam test checklist

- Login as `user1 / test` locally
- Create a ticket
- Open My tickets
- Send a chat message
- Login as `support1 / test`
- Claim the ticket
- Confirm system message appears: `<support username> har tatt saken din. Du kan sende melding til support.`
- Change status to `Waiting`, `In Progress`, and `Resolved`
- Open knowledge base and confirm role navigation remains
- Login as `admin1 / test`
- View all tickets, users, statistics, and system status
- Run `npm run build`
- Deploy `frontend/dist/*` to Apache
- Build and deploy C++ CGI endpoints
- Test `/cgi-bin/ad-bootstrap`
- Test `/cgi-bin/ad-login`

Internal note permission test:

1. Login as `admin1`
2. Open ticket
3. Add internal note
4. Confirm admin can see internal note
5. Logout/login as `user1`
6. Open same ticket
7. Confirm user cannot see internal note
8. Confirm user cannot see Note tab
9. Confirm user cannot see Forward tab
10. Confirm user can still send normal public reply

## What to code live in front of the sensor

Good live-coding areas:

- `cpp-backend/RoleResolver.cpp`
  - AD group to role mapping
  - `matchedGroup`
  - safe fallback behavior
- `frontend/src/state/helpdeskStore.ts`
  - claim ticket mutation
  - system notification
  - localStorage persistence
- `frontend/src/api/authApi.ts`
  - explain mock mode vs real C++ CGI endpoints

Keep the main security explanation simple:

- frontend asks backend who the user is
- backend checks AD through LDAP
- frontend renders only what backend role JSON allows
- if AD fails, no elevated access is granted
