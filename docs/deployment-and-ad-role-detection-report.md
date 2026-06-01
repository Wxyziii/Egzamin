# Deployment and AD role detection report

> Historical note: this document describes the earlier AD/Kerberos/LDAP attempt. The active exam version now uses local exam login and does not depend on AD, LDAP, Kerberos, `REMOTE_USER`, Windows Integrated Authentication, `/cgi-bin/ad-login`, or `/cgi-bin/ad-bootstrap`.

## Overview

This HelpDesk exam project has a Vite/React frontend served by Apache from `/var/www/helpdesk` and a C++ CGI backend deployed in `/usr/lib/cgi-bin`. Kerberos/SSO was tested earlier, but it is now disabled for exam stability. The active login method is traditional AD username/password login through `/cgi-bin/ad-login`, and role detection still comes from AD groups.

## Network/IP overview

| Component | Value |
| --- | --- |
| AD domain | `skole.local` |
| Kerberos realm | `SKOLE.LOCAL` |
| Windows Server / AD / DNS | `192.168.51.2` |
| Ubuntu helpdesk server | `192.168.51.3` |
| Website | `http://helpdesk.skole.local` |
| Frontend deploy path | `/var/www/helpdesk` |
| CGI deploy path | `/usr/lib/cgi-bin/` |
| LDAP config | `/etc/helpdesk-ldap.conf` |
| Apache Kerberos keytab | `/etc/apache2/helpdesk.keytab` |

## Repository structure

- Frontend: `frontend/`
- C++ CGI backend: `cpp-backend/`
- Documentation: `docs/`
- Older/static files at repository root: `index.html`, `app.js`, `style.css`, `helpdesk.html`, `test.html`

## AD groups and role mapping

| AD group | HelpDesk role |
| --- | --- |
| `GG_HelpDesk_Admin` | `admin` |
| `GG_HelpDesk_Support` | `support` |
| `GG_HelpDesk_User` | `user` |

The test AD user is `marcel`, and the expected role is `support` through membership in `GG_HelpDesk_Support`.

## LDAP backend explanation

The C++ backend reads LDAP settings from `/etc/helpdesk-ldap.conf` or from `HELPDESK_*` environment variables. The expected deployed values are:

```text
LDAP_URI=ldap://192.168.51.2
BASE_DN=DC=skole,DC=local
BIND_DN=<svc_helpdesk_ldap distinguished name>
BIND_PASSWORD=<LDAP_BIND_PASSWORD>
USER_DOMAIN=skole.local
START_TLS=0
```

`ad-login` accepts a username and password from the frontend, finds the AD user, validates the password with LDAP bind, reads `memberOf`, and maps group membership to a HelpDesk role. Secrets must stay only in `/etc/helpdesk-ldap.conf` or a secure equivalent, never in Git.

## Kerberos automatic login status

Kerberos/SSO was tested during setup, but it is not the active main login method anymore. The Apache `helpdesk-kerberos` config is disabled, and the frontend does not call `/cgi-bin/ad-bootstrap` on page load.

`ad-bootstrap` remains deployed only as a harmless compatibility endpoint. It returns JSON telling the client to use manual AD login.

Historical Kerberos config protected only `/cgi-bin/ad-bootstrap`:

```apache
<Location "/cgi-bin/ad-bootstrap">
    AuthType GSSAPI
    AuthName "Helpdesk Kerberos Login"
    GssapiCredStore keytab:/etc/apache2/helpdesk.keytab
    GssapiLocalName On
    GssapiSSLonly Off
    Require valid-user
</Location>
```

The keytab should contain this service principal:

```text
HTTP/helpdesk.skole.local@SKOLE.LOCAL
```

## Files deployed on Ubuntu

| File/path | Purpose | Verified |
| --- | --- | --- |
| `/var/www/helpdesk/index.html` | Production frontend entrypoint | Yes |
| `/var/www/helpdesk/assets/` | Production frontend assets | Yes |
| `/usr/lib/cgi-bin/ad-bootstrap` | Automatic AD role CGI endpoint | Yes |
| `/usr/lib/cgi-bin/ad-login` | Manual AD login CGI endpoint | Yes |
| `/etc/helpdesk-ldap.conf` | LDAP service account config | Not readable by shell user; must be verified by admin |
| `/etc/apache2/helpdesk.keytab` | Apache Kerberos keytab | Exists; content requires privileged read |
| `/etc/apache2/conf-available/helpdesk-kerberos.conf` | Kerberos protection for `ad-bootstrap` | Missing in accessible checks |

## Commands used for build/deploy/test

```bash
git pull --ff-only origin main
pwd
git status --short --branch
node -v
npm -v
apache2ctl -M | grep -E "cgi|gssapi"
ls -la /usr/lib/cgi-bin/
ls -la /etc/apache2/helpdesk.keytab
sudo klist -k /etc/apache2/helpdesk.keytab
npm install
npm run build
cmake -S . -B build
cmake --build build
sha256sum cpp-backend/build/ad-bootstrap cpp-backend/build/ad-login /usr/lib/cgi-bin/ad-bootstrap /usr/lib/cgi-bin/ad-login
sha256sum frontend/dist/index.html /var/www/helpdesk/index.html
apache2ctl configtest
curl -i http://helpdesk.skole.local/
curl -i http://helpdesk.skole.local/cgi-bin/ad-bootstrap
curl -i http://helpdesk.skole.local/cgi-bin/ad-login
```

The following privileged setup/deploy commands were attempted, but this shell session did not have passwordless sudo. They must be run by an administrator on the Ubuntu server:

```bash
sudo apt update
sudo apt install -y krb5-user libapache2-mod-auth-gssapi
sudo a2enmod cgi
sudo a2enmod auth_gssapi
sudo a2enconf serve-cgi-bin
sudo install -m 0755 cpp-backend/build/ad-bootstrap /usr/lib/cgi-bin/ad-bootstrap
sudo install -m 0755 cpp-backend/build/ad-login /usr/lib/cgi-bin/ad-login
sudo rsync -a --delete frontend/dist/ /var/www/helpdesk/
sudo chown -R www-data:www-data /var/www/helpdesk
sudo chmod -R 755 /var/www/helpdesk
sudo apache2ctl configtest
sudo systemctl restart apache2
```

The sudo failure was:

```text
sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
sudo: a password is required
```

## Required Kerberos configuration

`/etc/krb5.conf` currently has `default_realm = SKOLE.LOCAL`, but the accessible check did not show the required `SKOLE.LOCAL` KDC/admin server mapping or `skole.local` domain mapping. An administrator should update `/etc/krb5.conf` to include:

```ini
[libdefaults]
default_realm = SKOLE.LOCAL
dns_lookup_realm = false
dns_lookup_kdc = false
rdns = false

[realms]
SKOLE.LOCAL = {
    kdc = 192.168.51.2
    admin_server = 192.168.51.2
}

[domain_realm]
.skole.local = SKOLE.LOCAL
skole.local = SKOLE.LOCAL
```

## Test results

| Check | Result |
| --- | --- |
| `npm install` in `frontend/` | Passed |
| `npm run build` in `frontend/` | Passed; output is `frontend/dist/` |
| `cmake -S . -B build` in `cpp-backend/` | Passed |
| `cmake --build build` in `cpp-backend/` | Passed |
| `build/ad-bootstrap` exists and executable | Passed |
| `build/ad-login` exists and executable | Passed |
| Deployed CGI files exist and executable | Passed |
| Built CGI files match deployed CGI files by SHA-256 | Passed |
| Built frontend matches deployed frontend by file list and `index.html` SHA-256 | Initially passed before the frontend JSON error-handling source change; redeploy now requires admin write access to `/var/www/helpdesk` |
| Apache serves `http://helpdesk.skole.local/` | Passed |
| `GET /cgi-bin/ad-bootstrap` is not 404 | Passed; returned JSON `manual_login_required` without Kerberos browser context |
| `GET /cgi-bin/ad-login` is not 404 | Passed; returned JSON `login_failed` because no credentials were submitted |
| Current frontend bundle references `/cgi-bin/ad-login` only | Passed |
| `apache2ctl configtest` | Passed |
| `node -v` / `npm -v` | Passed; Node `v20.20.2`, npm `10.8.2` |
| `auth_gssapi` installed/enabled | Failed in accessible checks; package/module was not listed |
| `/etc/apache2/conf-available/helpdesk-kerberos.conf` exists | Failed in accessible checks; file was not present |
| `sudo klist -k /etc/apache2/helpdesk.keytab` | Not verified; sudo password required |
| `sudo kinit -k -t /etc/apache2/helpdesk.keytab HTTP/helpdesk.skole.local@SKOLE.LOCAL` | Not verified; sudo password required |
| LDAP config values and service account bind | Requires admin verification because `/etc/helpdesk-ldap.conf` is not readable by shell user |
| `/etc/helpdesk-ldap.conf` ownership/permissions | Existing file is `root:www-data` and mode `640`; contents were not printed |
| Manual login as `marcel` | Requires password-based manual verification; no password was printed or stored |
| Kerberos browser login as `SKOLE\marcel` | Requires Windows domain client verification |

## What works now

- The frontend builds successfully.
- The C++ CGI backend builds successfully.
- The deployed frontend matched the local production build before the final frontend source hardening change.
- The deployed CGI binaries match the latest local C++ build.
- Apache serves the HelpDesk page from `http://helpdesk.skole.local`.
- Both CGI endpoints are reachable and return JSON instead of 404.
- The frontend calls the active `/cgi-bin/ad-login` endpoint and no longer calls `/cgi-bin/ad-bootstrap` on page load.
- The frontend source now handles non-JSON Apache/CGI error pages cleanly instead of throwing a JSON parsing error. Run the admin deploy command above to publish this final frontend bundle.
- `/etc/helpdesk-ldap.conf` exists with `root:www-data` ownership and `640` permissions.
- `/etc/apache2/helpdesk.keytab` exists with `root:www-data` ownership and `640` permissions.

## What still requires manual verification from Windows domain client

1. Log in to a domain-joined Windows client as `SKOLE\marcel`.
2. Open `http://helpdesk.skole.local` in a browser configured for Integrated Windows Authentication.
3. Confirm the browser can access `/cgi-bin/ad-bootstrap` with Kerberos and no password prompt.
4. Confirm the returned JSON maps `marcel` to `support`.
5. Confirm the frontend shows the support UI.
6. Test manual login with `marcel` as fallback and confirm it returns `manual_login_ok` with role `support`.

## Required manual setup still missing

The accessible server checks did not show `auth_gssapi` or `/etc/apache2/conf-available/helpdesk-kerberos.conf`. Because sudo requires a password in this shell, an administrator should run:

```bash
sudo apt install libapache2-mod-auth-gssapi
sudo a2enmod auth_gssapi
sudo tee /etc/apache2/conf-available/helpdesk-kerberos.conf >/dev/null <<'APACHE'
<Location "/cgi-bin/ad-bootstrap">
    AuthType GSSAPI
    AuthName "Helpdesk Kerberos Login"
    GssapiCredStore keytab:/etc/apache2/helpdesk.keytab
    GssapiLocalName On
    GssapiSSLonly Off
    Require valid-user
</Location>
APACHE
sudo a2enconf helpdesk-kerberos
sudo apache2ctl configtest
sudo systemctl restart apache2
```

Then verify the keytab and service principal as an administrator:

```bash
sudo klist -k /etc/apache2/helpdesk.keytab
sudo chown root:www-data /etc/apache2/helpdesk.keytab
sudo chmod 640 /etc/apache2/helpdesk.keytab
sudo kinit -k -t /etc/apache2/helpdesk.keytab HTTP/helpdesk.skole.local@SKOLE.LOCAL
klist
```

Do not commit the keytab or LDAP config.

The final frontend build after the JSON error-handling change produced `frontend/dist/assets/index-CnsnJBwP.js`. Publishing it needs an administrator because `/var/www/helpdesk` is not writable by the shell user used for this report:

```bash
sudo rsync -a --delete frontend/dist/ /var/www/helpdesk/
sudo chown -R www-data:www-data /var/www/helpdesk
sudo chmod -R 755 /var/www/helpdesk
sudo systemctl reload apache2
```

## Troubleshooting

### 404 on `/cgi-bin/ad-login` or `/cgi-bin/ad-bootstrap`

- Confirm CGI is enabled: `sudo a2enmod cgi`
- Confirm CGI config is enabled: `sudo a2enconf serve-cgi-bin`
- Confirm files exist in `/usr/lib/cgi-bin/`
- Confirm files are executable: `sudo chmod +x /usr/lib/cgi-bin/ad-bootstrap /usr/lib/cgi-bin/ad-login`
- Restart Apache and retest with `curl -i`

### Could not contact Active Directory

- Confirm `LDAP_URI=ldap://192.168.51.2`
- Confirm the Ubuntu server can reach AD/DNS at `192.168.51.2`
- Confirm `/etc/helpdesk-ldap.conf` is readable by the Apache CGI process, but not world-readable
- Confirm `BIND_DN`, `BASE_DN`, `USER_DOMAIN`, and `START_TLS` values match the domain
- Test LDAP with `ldapsearch -x -H ldap://192.168.51.2 -D "<BIND_DN>" -W -b "DC=skole,DC=local" "(sAMAccountName=marcel)" memberOf`

### Kerberos/automatic login not working

- Confirm `/etc/krb5.conf` has `default_realm = SKOLE.LOCAL` and a KDC for `192.168.51.2`
- Confirm `libapache2-mod-auth-gssapi` is installed and enabled
- Confirm `/etc/apache2/helpdesk.keytab` exists and contains `HTTP/helpdesk.skole.local@SKOLE.LOCAL`
- Confirm `/etc/apache2/conf-available/helpdesk-kerberos.conf` protects only `/cgi-bin/ad-bootstrap`
- Run `sudo apache2ctl configtest` and restart Apache
- Test from a domain-joined Windows client logged in as `SKOLE\marcel`

### Wrong AD role returned

- Confirm the AD user is a direct or nested member of the expected group
- Confirm the group names exactly match `GG_HelpDesk_Admin`, `GG_HelpDesk_Support`, or `GG_HelpDesk_User`
- Confirm the backend reads `memberOf`
- If a user is in multiple HelpDesk groups, confirm the intended precedence in `RoleResolver.cpp`

### Frontend JSON parsing errors from HTML error pages

- Confirm the current frontend bundle has been deployed from `frontend/dist/`.
- The frontend source checks `Content-Type` before parsing CGI responses as JSON.
- If the browser still shows `Unexpected token '<'`, redeploy the current frontend build and retest.
- Use `curl -i` against both CGI endpoints and confirm Apache returns `Content-Type: application/json` for backend responses.

## Eksamen forklaring

Active Directory lagrer brukere og grupper for domenet. Brukeren `marcel` finnes i AD, og gruppene bestemmer hvilken rolle brukeren skal få i HelpDesk.

C++ CGI-backenden spør AD gjennom LDAP. Den finner brukeren, leser gruppene fra `memberOf`, og oversetter AD-gruppen til rollen `admin`, `support` eller `user`.

Apache og Kerberos kan gi automatisk innlogging. Da sender Apache brukernavnet til CGI-programmet som `REMOTE_USER`, slik at brukeren slipper å skrive passord i HelpDesk.

Manuell innlogging virker som fallback. Hvis automatisk innlogging ikke fungerer, kan brukeren skrive AD-brukernavn og passord, og backenden sjekker dette mot LDAP.

Frontenden bruker rollen som kommer tilbake fra backenden. Rollen bestemmer om brukeren ser vanlig brukergrensesnitt, support-grensesnitt eller admin-grensesnitt.
