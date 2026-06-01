# Live-coding guide: C++ audit logging

Dette er en enkel guide jeg kan bruke foran sensor.

## Hva jeg skal kode

Jeg skal vise en liten C++ backend-funksjon som logger innloggingsforsøk. Den skal ikke lagre passord. Den skal bare skrive tidspunkt, brukernavn, resultat, rolle og IP-adresse.

## Filer jeg redigerer

- `cpp-backend/AuditLogger.h`
- `cpp-backend/AuditLogger.cpp`
- `cpp-backend/CMakeLists.txt`

## AuditLogger.h

Denne filen beskriver funksjonen resten av programmet kan bruke.

Eksempel jeg kan forklare:

```cpp
void logLoginAttempt(const std::string& username,
                     bool success,
                     const std::string& role,
                     const std::string& ipAddress);
```

## AuditLogger.cpp

Denne filen inneholder selve loggingen.

Den gjør fire viktige ting:

1. Lager tidsstempel.
2. Rydder bort linjeskift og `|` fra tekst som skal logges.
3. Oppretter `logs`-mappen hvis den mangler.
4. Skriver en linje til `logs/helpdesk-auth.log`.

Eksempel på logglinje:

```text
2026-06-01 13:20:11 | user=support1 | result=success | role=support | ip=local
```

## CMakeLists.txt

Denne filen forteller CMake hvordan programmet bygges.

Viktig del:

```cmake
add_executable(helpdesk-audit-demo
    login.cpp
    AuditLogger.cpp
)
```

## Build command

```powershell
cd cpp-backend
cmake -S . -B build
cmake --build build
```

## Test command

Vanlig Windows CMake-build:

```powershell
.\build\Debug\helpdesk-audit-demo.exe support1 success support local
.\build\Debug\helpdesk-audit-demo.exe user1 failed none local
Get-Content .\logs\helpdesk-auth.log
```

Hvis programmet ligger direkte i `build`:

```powershell
.\build\helpdesk-audit-demo.exe support1 success support local
```

## Forklaring jeg kan si høyt

"Jeg har lagt inn lokal innlogging i React for at eksamensdemoen skal være stabil. I tillegg har jeg laget en C++ AuditLogger som simulerer en backend-funksjon. Den kan brukes av en ekte login-backend senere. Loggeren skriver hvem som prøvde å logge inn, om forsøket var vellykket, hvilken rolle brukeren fikk, og IP-adresse. Den logger aldri passord. Jeg bygger koden med CMake og kan vise loggfilen etterpå."

## Hvorfor dette er nyttig

- Viser C++ backend-kode.
- Viser enkel sikkerhetstenkning.
- Viser filhåndtering.
- Viser CMake-build.
- Gir noe konkret å live-code foran sensor.
