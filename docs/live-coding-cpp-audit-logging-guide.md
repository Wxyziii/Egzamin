# Live-coding guide: C++ audit logging

## Hva problemet er

Jeg vil kunne se hvem som prøver å logge inn i HelpDesk. Hvis noen skriver feil passord, eller hvis en bruker logger inn riktig, skal systemet skrive en enkel linje i en loggfil. Dette hjelper med feilsøking og sikkerhet.

## Filer som brukes

```text
cpp-backend/AuditLogger.h
cpp-backend/AuditLogger.cpp
cpp-backend/main_login.cpp
cpp-backend/CMakeLists.txt
```

Loggfilen ligger her:

```text
/var/log/helpdesk-auth.log
```

## Hva AuditLogger.h gjør

`AuditLogger.h` er header-filen. Den forteller resten av C++-programmet at funksjonen finnes:

```cpp
AuditLogger::logLoginAttempt(username, success, role, ipAddress);
```

Den sier hvilke verdier funksjonen trenger:

* brukernavn
* om innloggingen var vellykket
* rolle
* IP-adresse

## Hva AuditLogger.cpp gjør

`AuditLogger.cpp` inneholder selve koden som skriver til loggfilen.

Den:

* lager tidspunkt
* åpner `/var/log/helpdesk-auth.log`
* skriver en linje med `user`, `result`, `role` og `ip`
* logger ikke passord
* feiler stille hvis loggfilen ikke kan åpnes

Eksempel:

```text
2026-06-01 11:50:29 | user=fake_audit_user | result=failed | role=none | ip=192.168.51.3
```

## Hvor ad-login kaller loggeren

I `main_login.cpp` blir loggeren kalt når:

* brukernavn eller passord mangler
* AD-login feiler
* AD-login virker, men ingen HelpDesk-gruppe matcher
* AD-login lykkes og en rolle blir funnet

Ved suksess logger den rollen, for eksempel `support`.
Ved feil logger den `role=none`.

## Hvordan bygge med CMake

Fra serveren:

```bash
cd /opt/helpdesk-app/cpp-backend
cmake -S . -B build
cmake --build build
```

`CMakeLists.txt` må ha `AuditLogger.cpp` med i `ad-login`:

```cmake
add_executable(ad-login main_login.cpp AuditLogger.cpp ${COMMON_SOURCES})
```

## Hvordan deploye ad-login

```bash
sudo install -m 0755 build/ad-login /usr/lib/cgi-bin/ad-login
sudo apache2ctl configtest
sudo systemctl restart apache2
```

## Hvordan teste

Lag loggfilen hvis den ikke finnes:

```bash
sudo touch /var/log/helpdesk-auth.log
sudo chown www-data:www-data /var/log/helpdesk-auth.log
sudo chmod 664 /var/log/helpdesk-auth.log
```

Test med feil innlogging:

```bash
curl -i -X POST http://helpdesk.skole.local/cgi-bin/ad-login \
  -H 'Content-Type: application/json' \
  --data '{"username":"fake_audit_user","password":"<WRONG_PASSWORD>"}'
```

Se loggen:

```bash
sudo tail -n 20 /var/log/helpdesk-auth.log
```

Forventet:

```text
user=fake_audit_user | result=failed | role=none
```

Når ekte AD-passord testes med `marcel`, forventer jeg:

```text
user=marcel | result=success | role=support
```

## Kort forklaring til sensor

Jeg har lagt til audit logging i C++-backenden. Når noen prøver å logge inn via `/cgi-bin/ad-login`, skriver backenden en linje til `/var/log/helpdesk-auth.log`. Den logger tidspunkt, brukernavn, resultat, rolle og IP-adresse. Den logger aldri passord. Dette gjør det lettere å vise både sikkerhet, backend-kode og testing i prosjektet.
