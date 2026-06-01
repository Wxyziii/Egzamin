# C++ LDAP CGI backend

This folder builds two Apache CGI executables:

- `ad-bootstrap` - automatic role check using Apache-provided user identity
- `ad-login` - manual AD username/password login with LDAP bind

Both endpoints return JSON consumed by `app.js`.

## Build

```bash
sudo apt update
sudo apt install g++ cmake make libldap2-dev ldap-utils
cmake -S . -B build
cmake --build build
```

## Configure

Copy `config.example` to `/etc/helpdesk-ldap.conf` and set the real service account password there.

```bash
sudo cp config.example /etc/helpdesk-ldap.conf
sudo nano /etc/helpdesk-ldap.conf
sudo chmod 600 /etc/helpdesk-ldap.conf
```

The program can also read these environment variables:

- `HELPDESK_LDAP_CONFIG`
- `HELPDESK_LDAP_URI`
- `HELPDESK_BASE_DN`
- `HELPDESK_BIND_DN`
- `HELPDESK_BIND_PASSWORD`
- `HELPDESK_USER_DOMAIN`
- `HELPDESK_START_TLS`

## LDAP behavior

1. Connects to `LDAP_URI`.
2. Binds with service account from config.
3. Searches by `sAMAccountName`.
4. Reads `memberOf`.
5. Maps these AD groups:
   - `GG_HelpDesk_Admin` -> `admin`
   - `GG_HelpDesk_Support` -> `support`
   - `GG_HelpDesk_User` -> `user`

Manual login additionally binds as the found user DN with the submitted password before returning a role.

## Apache deployment

```bash
sudo a2enmod cgi
sudo systemctl restart apache2
sudo cp build/ad-bootstrap /usr/lib/cgi-bin/ad-bootstrap
sudo cp build/ad-login /usr/lib/cgi-bin/ad-login
sudo chmod +x /usr/lib/cgi-bin/ad-bootstrap
sudo chmod +x /usr/lib/cgi-bin/ad-login
```

## AD connectivity test

```bash
ldapsearch -x \
  -H ldap://192.168.51.2 \
  -D "CN=svc_helpdesk_ldap,OU=Service Accounts,DC=eksamen,DC=local" \
  -W \
  -b "DC=eksamen,DC=local" \
  "(sAMAccountName=support1)" memberOf
```
