# Traditional AD login and audit logging report

> Historical note: this document describes an earlier traditional AD login attempt. The active exam version now uses local exam login and keeps AD/Kerberos/LDAP work only as historical evidence.

Date: 2026-06-01

## Why Kerberos/automatic login was disabled

Kerberos/SSO was installed and tested on the Ubuntu side, but it was disabled for exam stability. The browser/domain-client flow still needs a correctly joined Windows client and browser negotiation settings. Traditional AD login is more predictable for the exam because the user enters AD username and password directly in HelpDesk.

Disabled Apache Kerberos config:

```bash
sudo a2disconf helpdesk-kerberos || true
sudo apache2ctl configtest
sudo systemctl restart apache2
```

The keytab was not deleted and was not committed. The old `/cgi-bin/ad-bootstrap` endpoint remains deployed, but it now returns JSON saying manual login is required.

## Active login flow

The active endpoint is:

```text
/cgi-bin/ad-login
```

Flow:

1. User opens `http://helpdesk.skole.local`.
2. Frontend shows the AD login form immediately.
3. User enters AD username and password.
4. Frontend sends `POST /cgi-bin/ad-login`.
5. C++ backend authenticates against Active Directory through LDAP.
6. C++ backend reads `memberOf`.
7. C++ backend maps AD group to role.
8. Frontend renders user, support, or admin UI from the backend response.

The frontend does not choose or hardcode the role. It also does not use `localStorage` as the source of truth for identity or role.

## AD group to role mapping

| AD group | HelpDesk role |
| --- | --- |
| `GG_HelpDesk_Admin` | `admin` |
| `GG_HelpDesk_Support` | `support` |
| `GG_HelpDesk_User` | `user` |

The test user is `marcel`, and the expected role is `support`.

## C++ audit logging

Added:

```text
cpp-backend/AuditLogger.h
cpp-backend/AuditLogger.cpp
```

`AuditLogger::logLoginAttempt(username, success, role, ipAddress)` appends one line per login attempt to:

```text
/var/log/helpdesk-auth.log
```

Each line includes:

- timestamp
- username
- result: `success` or `failed`
- role: `user`, `support`, `admin`, or `none`
- client IP from `REMOTE_ADDR`

Example format:

```text
2026-06-01 11:50:29 | user=fake_audit_user | result=failed | role=none | ip=192.168.51.3
```

The audit logger does not log passwords, LDAP bind passwords, keytabs, or session tokens. If the log file cannot be opened, the logger fails silently so login handling still returns JSON.

## Ubuntu log file setup

Commands run:

```bash
sudo touch /var/log/helpdesk-auth.log
sudo chown www-data:www-data /var/log/helpdesk-auth.log
sudo chmod 664 /var/log/helpdesk-auth.log
```

Verified:

```text
-rw-rw-r-- 1 www-data www-data /var/log/helpdesk-auth.log
```

## Code changes

Frontend:

- Removed automatic `bootstrapAuth()` call from app startup.
- Removed production frontend dependency on `/cgi-bin/ad-bootstrap`.
- Login form appears first.
- Login uses only `POST /cgi-bin/ad-login`.
- Non-JSON CGI/Apache responses are handled as clean `ad_error` responses instead of crashing with `Unexpected token '<'`.

C++ backend:

- `main_bootstrap.cpp` now returns manual-login-required JSON.
- `main_login.cpp` logs failed and successful login attempts.
- `CMakeLists.txt` builds `ad-login` with `AuditLogger.cpp`.

## Commands used for build, deploy, and test

```bash
pwd
git status
find . -maxdepth 3 -type f | sort
rg -n "ad-bootstrap|bootstrap|auto login|automatic login|kerberos|REMOTE_USER|negotiate" frontend/src cpp-backend docs README.md
sudo a2disconf helpdesk-kerberos || true
sudo apache2ctl configtest
sudo systemctl restart apache2
sudo touch /var/log/helpdesk-auth.log
sudo chown www-data:www-data /var/log/helpdesk-auth.log
sudo chmod 664 /var/log/helpdesk-auth.log
cd /opt/helpdesk-app/cpp-backend
cmake -S . -B build
cmake --build build
sudo install -m 0755 build/ad-login /usr/lib/cgi-bin/ad-login
sudo install -m 0755 build/ad-bootstrap /usr/lib/cgi-bin/ad-bootstrap
cd /opt/helpdesk-app/frontend
npm install
npm run build
sudo rsync -a --delete dist/ /var/www/helpdesk/
sudo chown -R www-data:www-data /var/www/helpdesk
sudo chmod -R 755 /var/www/helpdesk
sudo systemctl restart apache2
curl -i http://helpdesk.skole.local/
curl -i http://helpdesk.skole.local/cgi-bin/ad-login
curl -i http://helpdesk.skole.local/cgi-bin/ad-bootstrap
curl -i -X POST http://helpdesk.skole.local/cgi-bin/ad-login -H 'Content-Type: application/json' --data '{"username":"fake_audit_user","password":"<WRONG_PASSWORD>"}'
sudo tail -n 20 /var/log/helpdesk-auth.log
```

## Test results

| Test | Result |
| --- | --- |
| `npm install` | Passed |
| `npm run build` | Passed |
| `cmake -S . -B build` | Passed |
| `cmake --build build` | Passed |
| `sudo apache2ctl configtest` | Passed, `Syntax OK` |
| Frontend deployment | Passed; live HTML references `/assets/index-C9uJ3DT5.js` |
| Bundle search for `ad-bootstrap` | Passed; deployed frontend bundle only references `ad-login` |
| `GET /cgi-bin/ad-login` | Passed; returns JSON `Username and password are required` |
| `GET /cgi-bin/ad-bootstrap` | Passed; returns JSON `Automatic login is disabled. Use manual AD login.` |
| Failed fake login audit entry | Passed; `fake_audit_user` logged with `result=failed` and `role=none` |

## What works now

- Traditional AD login is the active flow.
- Kerberos Apache protection is disabled.
- The frontend shows the login form first.
- The frontend only calls `/cgi-bin/ad-login` for authentication.
- The backend still maps roles from AD groups.
- `ad-bootstrap` no longer triggers Kerberos `401` in normal curl tests.
- Audit logging writes failed login attempts to `/var/log/helpdesk-auth.log`.

## What still needs manual testing

- Successful login with real AD user `marcel` was not tested because no real AD password was entered.
- The user should test from the browser with `marcel` and confirm role `support`.
- After successful login, `/var/log/helpdesk-auth.log` should contain a line like:

```text
user=marcel | result=success | role=support
```

Do not claim successful AD login is fully verified until that real username/password test passes.

## Troubleshooting

### Could not contact Active Directory

- Confirm `/etc/helpdesk-ldap.conf` exists and is readable by Apache.
- Confirm `LDAP_URI=ldap://192.168.51.2`.
- Confirm `BASE_DN=DC=skole,DC=local`.
- Confirm the Ubuntu server can reach `192.168.51.2`.
- Check Apache logs for CGI/LDAP errors.

### Wrong role returned

- Confirm the user is in exactly the expected HelpDesk AD group.
- Confirm group names match `GG_HelpDesk_Admin`, `GG_HelpDesk_Support`, or `GG_HelpDesk_User`.
- Check `cpp-backend/RoleResolver.cpp`.
- Rebuild and redeploy `ad-login` after role mapping changes.

### 404 on `/cgi-bin/ad-login`

- Confirm `sudo a2enmod cgi`.
- Confirm `sudo a2enconf serve-cgi-bin`.
- Confirm `/usr/lib/cgi-bin/ad-login` exists.
- Confirm it is executable.
- Restart Apache.

### JSON parse error from Apache HTML

- Confirm the frontend bundle is the current build.
- Confirm `/cgi-bin/ad-login` returns `Content-Type: application/json`.
- If Apache returns an HTML error page, inspect `/var/log/apache2/error.log`.
- The frontend now checks `Content-Type` before parsing JSON and should show a clean error message.

### Login works but audit log is empty

- Confirm `/var/log/helpdesk-auth.log` exists.
- Confirm ownership is `www-data:www-data`.
- Confirm mode is `664`.
- Confirm the deployed binary is the newly built `ad-login`.
- Retest with a failed login and run `sudo tail -n 20 /var/log/helpdesk-auth.log`.

### Permission denied on `/var/log/helpdesk-auth.log`

Run:

```bash
sudo chown www-data:www-data /var/log/helpdesk-auth.log
sudo chmod 664 /var/log/helpdesk-auth.log
sudo systemctl restart apache2
```

## Eksamen forklaring

I denne løsningen bruker jeg tradisjonell AD-innlogging. Brukeren skriver inn AD-brukernavn og passord i HelpDesk. C++ CGI-backenden sjekker brukeren mot Active Directory via LDAP. Når brukeren er godkjent, leser backenden hvilke AD-grupper brukeren er medlem av.

AD-gruppene bestemmer rollen automatisk:

* GG_HelpDesk_User gir vanlig brukerrolle
* GG_HelpDesk_Support gir supportrolle
* GG_HelpDesk_Admin gir adminrolle

Jeg har også lagt til audit logging i C++. Det betyr at systemet logger innloggingsforsøk til /var/log/helpdesk-auth.log. Loggen viser tidspunkt, brukernavn, om innloggingen var vellykket eller feilet, hvilken rolle brukeren fikk, og IP-adressen til klienten. Dette er nyttig for drift, feilsøking og sikkerhet.

Dette gir meg noe konkret å vise i utviklingsdelen: Jeg kan forklare C++-koden, vise hvordan loggingen fungerer, og teste det ved å logge inn med riktig og feil passord.
