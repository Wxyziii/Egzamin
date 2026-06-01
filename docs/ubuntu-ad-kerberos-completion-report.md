# Ubuntu AD/Kerberos completion report

> Historical note: this document describes the earlier Ubuntu AD/Kerberos setup. The active Windows exam version now uses local exam login and does not require AD, LDAP, Kerberos, keytabs, Apache CGI, or Windows Integrated Authentication.

Date: 2026-06-01

## Summary

The Ubuntu-side HelpDesk deployment was completed where it can be completed from the server. Apache GSSAPI/Kerberos support is installed and enabled, `/etc/krb5.conf` has been replaced with the lab Kerberos configuration, the keytab was verified, the C++ CGI backend and React frontend were rebuilt and redeployed, and Apache was reloaded/restarted successfully.

Update: Kerberos/SSO was later disabled for exam stability. Traditional AD username/password login through `/cgi-bin/ad-login` is now the active flow, role detection still comes from AD groups, and C++ audit logging was added for login attempts.

No passwords, keytabs, LDAP secrets, or copied private system config files were committed.

## System configuration completed

Installed/enabled packages and Apache modules:

```bash
sudo apt update
sudo apt install -y krb5-user libapache2-mod-auth-gssapi
sudo a2enmod cgi
sudo a2enmod auth_gssapi
sudo a2enconf serve-cgi-bin
```

Verified Apache modules:

```text
auth_gssapi_module (shared)
cgi_module (shared)
```

Updated `/etc/krb5.conf` to the lab configuration:

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

The previous `/etc/krb5.conf` was backed up on the server with a timestamped `krb5.conf.bak-codex-*` filename.

## Keytab and LDAP config checks

Set secure permissions:

```bash
sudo chown root:www-data /etc/apache2/helpdesk.keytab
sudo chmod 640 /etc/apache2/helpdesk.keytab
sudo chown root:www-data /etc/helpdesk-ldap.conf
sudo chmod 640 /etc/helpdesk-ldap.conf
```

Verified keytab principal:

```text
HTTP/helpdesk.skole.local@SKOLE.LOCAL
```

Verified keytab authentication:

```text
kinit-ok
Default principal: HTTP/helpdesk.skole.local@SKOLE.LOCAL
krbtgt/SKOLE.LOCAL@SKOLE.LOCAL ticket was issued
```

Verified non-secret LDAP values:

```text
LDAP_URI=ldap://192.168.51.2
BASE_DN=DC=skole,DC=local
BIND_DN=<redacted service DN present>
USER_DOMAIN=skole.local
START_TLS=0
```

## Apache Kerberos config

Historical setup created `/etc/apache2/conf-available/helpdesk-kerberos.conf`:

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

Current active setup: `helpdesk-kerberos` is disabled for exam stability, so `/cgi-bin/ad-bootstrap` is no longer Kerberos-protected. `/cgi-bin/ad-login` is the active manual AD login endpoint.

Apache validation/restart:

```text
apache2ctl configtest: Syntax OK
systemctl is-active apache2: active
```

Apache logs show Apache running with `mod_auth_gssapi/1.6.3`.

## Backend build and deploy

Commands run:

```bash
cd /opt/helpdesk-app/cpp-backend
cmake -S . -B build
cmake --build build
sudo install -m 0755 build/ad-bootstrap /usr/lib/cgi-bin/ad-bootstrap
sudo install -m 0755 build/ad-login /usr/lib/cgi-bin/ad-login
```

Build result:

```text
[100%] Built target ad-login
```

Deployed binary hashes match the fresh build:

```text
ad-bootstrap: 9667581466074181b03c503acc78487f830f759cfa192d29520479ee6493d6de
ad-login:     6ad832eb99e34c8242234d2f09f975da33e31a3ac85e84166d04de695bf003f9
```

## Frontend build and deploy

Commands run:

```bash
cd /opt/helpdesk-app/frontend
npm install
npm run build
sudo rsync -a --delete dist/ /var/www/helpdesk/
sudo chown -R www-data:www-data /var/www/helpdesk
sudo chmod -R 755 /var/www/helpdesk
sudo systemctl reload apache2
```

Build result:

```text
dist/index.html
dist/assets/index-CnsnJBwP.js
dist/assets/index-Dd2X_lBB.css
```

Deployed frontend files:

```text
index.html 745
assets/index-CnsnJBwP.js 186564
assets/index-Dd2X_lBB.css 27013
```

The deployed `/var/www/helpdesk/index.html` hash matches the fresh `frontend/dist/index.html` hash:

```text
ef88d517f7c135f811a711fd0e440be4a7b6e4ce14f53fb3a7e4aa029729bd16
```

## Historical live endpoint tests

Frontend:

```text
GET http://helpdesk.skole.local/
HTTP/1.1 200 OK
```

The live HTML now references the current frontend bundle:

```text
/assets/index-CnsnJBwP.js
```

Manual login endpoint:

```text
GET http://helpdesk.skole.local/cgi-bin/ad-login
HTTP/1.1 200 OK
Content-Type: application/json
{"status":"login_failed","message":"Username and password are required"}
```

At the time of Kerberos testing, bootstrap with plain curl returned:

```text
GET http://helpdesk.skole.local/cgi-bin/ad-bootstrap
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Negotiate
```

That was expected while Kerberos protection was enabled. In the current traditional-login setup, `/cgi-bin/ad-bootstrap` returns JSON saying manual login is required.

Negotiated curl from the server still returned `401 Unauthorized`, even after validating the server keytab. That does not prove the browser flow is broken because this is not the real domain-user client flow. It only shows that the local service-principal/root-cache curl test did not complete a usable user login.

## What works now

- Apache has `cgi_module` and `auth_gssapi_module` enabled.
- `/etc/krb5.conf` points to realm `SKOLE.LOCAL` and KDC/admin server `192.168.51.2`.
- `/etc/apache2/helpdesk.keytab` exists, has secure permissions, and contains `HTTP/helpdesk.skole.local@SKOLE.LOCAL`.
- `kinit` with the Apache keytab succeeds.
- `/etc/helpdesk-ldap.conf` exists with secure `root:www-data` ownership and `640` permissions.
- LDAP non-secret values match the expected lab values.
- Kerberos/GSSAPI packages and keytab validation worked during setup.
- Apache config test passes and Apache is active.
- C++ CGI backend builds and is deployed.
- Frontend builds and is deployed.
- `/cgi-bin/ad-login` remains reachable without Kerberos.
- Current active flow uses traditional AD login through `/cgi-bin/ad-login`; `/cgi-bin/ad-bootstrap` is a compatibility JSON endpoint.

## What could not be fully verified

- Automatic login as `SKOLE\marcel` was not fully verified and was later disabled for exam stability.
- Manual login as `marcel` still requires real AD password testing by the user.
- The final active test should be traditional AD login through `/cgi-bin/ad-login`, not Kerberos SSO.

## Required manual verification

1. Open `http://helpdesk.skole.local`.
2. Log in with AD user `marcel`.
3. Confirm `/cgi-bin/ad-login` returns role `support`.
4. Confirm the frontend shows the support UI.
5. Confirm `/var/log/helpdesk-auth.log` gets `user=marcel | result=success | role=support`.

Do not claim successful AD login is fully verified until the real AD password test passes.
