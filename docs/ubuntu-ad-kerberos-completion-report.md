# Ubuntu AD/Kerberos completion report

Date: 2026-06-01

## Summary

The Ubuntu-side HelpDesk deployment was completed where it can be completed from the server. Apache GSSAPI/Kerberos support is installed and enabled, `/etc/krb5.conf` has been replaced with the lab Kerberos configuration, the keytab was verified, the C++ CGI backend and React frontend were rebuilt and redeployed, and Apache was reloaded/restarted successfully.

Automatic login is configured on the server, but it is not fully end-to-end verified until a domain-joined Windows client logged in as `SKOLE\marcel` tests the browser flow.

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

Created and enabled `/etc/apache2/conf-available/helpdesk-kerberos.conf`:

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

Only `/cgi-bin/ad-bootstrap` is protected by Kerberos. `/cgi-bin/ad-login` remains public so manual AD login still works as fallback.

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

## Live endpoint tests

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

Kerberos bootstrap endpoint with plain curl:

```text
GET http://helpdesk.skole.local/cgi-bin/ad-bootstrap
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Negotiate
```

This is expected for plain curl because `/cgi-bin/ad-bootstrap` now requires Kerberos.

Negotiated curl from the server still returned `401 Unauthorized`, even after validating the server keytab. That does not prove the browser flow is broken because this is not the real domain-user client flow. It only shows that the local service-principal/root-cache curl test did not complete a usable user login.

## What works now

- Apache has `cgi_module` and `auth_gssapi_module` enabled.
- `/etc/krb5.conf` points to realm `SKOLE.LOCAL` and KDC/admin server `192.168.51.2`.
- `/etc/apache2/helpdesk.keytab` exists, has secure permissions, and contains `HTTP/helpdesk.skole.local@SKOLE.LOCAL`.
- `kinit` with the Apache keytab succeeds.
- `/etc/helpdesk-ldap.conf` exists with secure `root:www-data` ownership and `640` permissions.
- LDAP non-secret values match the expected lab values.
- `/etc/apache2/conf-available/helpdesk-kerberos.conf` protects only `/cgi-bin/ad-bootstrap`.
- Apache config test passes and Apache is active.
- C++ CGI backend builds and is deployed.
- Frontend builds and is deployed.
- `/cgi-bin/ad-login` remains reachable without Kerberos.
- `/cgi-bin/ad-bootstrap` now challenges with Kerberos instead of returning public JSON.

## What could not be fully verified

- Automatic login as `SKOLE\marcel` was not fully verified because that requires a domain-joined Windows client/browser session.
- Manual login as `marcel` was not password-tested because no AD user password was used or documented.
- The local `curl --negotiate` test did not complete a successful `ad-bootstrap` login and returned `401`; the final required test is still the Windows domain-client browser flow.

## Required Windows domain-client verification

1. Log in to a Windows domain client as `SKOLE\marcel`.
2. Open `http://helpdesk.skole.local` in a browser configured for Integrated Windows Authentication.
3. Confirm the browser can negotiate Kerberos for `/cgi-bin/ad-bootstrap`.
4. Confirm the returned session maps `marcel` to role `support`.
5. Confirm the frontend shows the support UI.
6. Test `/cgi-bin/ad-login` from the HelpDesk manual login screen as fallback and confirm role `support`.

Do not claim automatic login is fully verified until these client-side checks pass.
