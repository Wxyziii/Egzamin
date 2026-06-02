# Eksamen forklaring: sammenligning med Pureservice

## Kort forklaring

Jeg har sammenlignet HelpDesk-systemet mitt med Pureservice, som er en profesjonell norsk servicedesk- og ITSM-plattform.

Pureservice brukes av virksomheter for å håndtere henvendelser, brukerstøtte, saker, køer, selvbetjening, kunnskapsbase, rapporter, SLA, assets og endringshåndtering.

Mitt system er mye mindre. Det er et eksamensprosjekt, ikke et ferdig profesjonelt produkt. Men det bygger på mange av de samme prinsippene.

## Hvorfor jeg sammenligner med Pureservice

Jeg valgte Pureservice som referanse fordi det viser hvordan et ekte helpdesk-system kan se ut i praksis.

Ved å sammenligne mitt system med Pureservice kan jeg vise:

- hva jeg har klart å implementere
- hvilke deler som ligner på profesjonelle servicedesk-systemer
- hvilke deler som fortsatt mangler
- hva som er realistisk i et skoleprosjekt
- hva som ville vært neste steg hvis prosjektet skulle videreutvikles

## Hva mitt system har til felles med profesjonelle helpdesk-verktøy

Mitt system har en del sentrale funksjoner som også finnes i profesjonelle helpdesk-systemer:

- Brukere kan opprette saker.
- Saker har tittel, kategori, prioritet og status.
- Support og admin kan se køen med saker.
- Support/admin kan claime en sak og jobbe videre med den.
- Saksbehandler kan endre status og prioritet.
- Bruker og support kan kommunisere i en samtale/chat inne i saken.
- Support/admin kan skrive interne notater.
- Vanlige brukere skal ikke se interne notater.
- Systemet har en kunnskapsbase med artikler.
- Det finnes en enkel varslingsfunksjon når en sak blir tatt av support.
- Det finnes en enkel aktivitetsvisning i høyrepanelet.
- Det finnes lokal innlogging med roller: user, support og admin.
- Jeg har også laget C++ audit logging for innloggingsforsøk.

Dette viser at jeg forstår grunnleggende brukerstøtteflyt: en bruker melder inn et problem, support tar saken, kommuniserer med brukeren, dokumenterer internt og lukker eller oppdaterer saken.

## Hva mitt system ikke har

Pureservice er mye større og mer komplett enn mitt system.

Mitt system mangler for eksempel:

- ekte database på server
- full backend-API for saker
- e-post, SMS, Teams og telefonintegrasjon
- automatisk ruting av saker
- ekte SLA-frister og eskalering
- rapporter med trender og historikk
- asset management / CMDB
- change management
- vedlegg og filopplasting
- mobilapp med push-varsler
- full GDPR/personvernfunksjonalitet
- komplett sikkerhetsmodell på serversiden
- automatiserte tester

Dette er ikke feil i prosjektet, men naturlige begrensninger fordi dette er et skoleprosjekt. Jeg har valgt å fokusere på de viktigste delene som er relevante for eksamen.

## Viktigste forskjell

Den største forskjellen er at Pureservice er et ferdig profesjonelt produkt for mange brukere og organisasjoner.

Mitt system er en lokal eksamensdemo som viser konseptene:

- roller
- tickets
- kø
- status
- prioritet
- kommunikasjon
- interne notater
- kunnskapsbase
- audit logging

Jeg bør derfor ikke si at mitt system er like bra som Pureservice. Jeg bør si at mitt system er inspirert av slike profesjonelle systemer.

## Hvordan dette kobles til utvikling

På utviklingssiden kan jeg forklare:

- React og TypeScript brukes til frontend.
- Komponentene er delt opp i dashboard, ticket list, ticket detail, chat og knowledge base.
- `localStorage` brukes til å lagre saker lokalt for demo.
- Roller kommer fra lokal innlogging.
- Tilgang styres i React ved hjelp av rolle og brukernavn.
- Interne notater filtreres før de rendres.
- C++ brukes til audit logging.
- CMake brukes til å bygge C++-delen.

Dette viser at jeg kan lage funksjonalitet, strukturere kode og forklare tekniske valg.

## Hvordan dette kobles til driftsstøtte

På driftsstøtte-siden kan jeg forklare:

- Systemet kan kjøres lokalt med `npm run dev`.
- Frontend kan bygges med `npm run build`.
- C++ kan bygges med CMake.
- AuditLogger skriver logg til `logs/helpdesk-auth.log`.
- Loggen kan brukes til feilsøking og sikkerhet.
- `.gitignore` beskytter mot å committe logger, build-mapper, `.env`, keytabs og secrets.
- Dokumentasjonen forklarer hvordan systemet kjøres og testes.

Dette viser at jeg ikke bare har laget en UI, men også tenkt på drift, bygging, logging og dokumentasjon.

## Hvordan dette kobles til brukerstøtte

På brukerstøtte-siden kan jeg forklare:

- En bruker kan melde inn et problem via skjema.
- Brukeren kan se egne saker.
- Support kan se køen og ta ansvar for en sak.
- Support kan svare brukeren i saken.
- Support kan legge til interne notater som brukeren ikke ser.
- Kunnskapsbasen kan brukes til standard feilsøking.
- Status og prioritet hjelper support med å vite hva som haster.

Dette ligner på hvordan ekte IT-support jobber: registrere, prioritere, behandle, kommunisere og dokumentere.

## Hva jeg lærte av sammenligningen

Jeg lærte at et profesjonelt helpdesk-system ikke bare handler om å lage en saksliste.

Et ordentlig system må også ha:

- god rolle- og tilgangsstyring
- sporbarhet
- intern dokumentasjon
- rapportering
- automatisering
- integrasjoner
- sikkerhet og personvern
- drift og vedlikehold

Mitt prosjekt dekker flere av grunnprinsippene, men mangler de store enterprise-funksjonene. Det er derfor en god eksamensversjon, men ikke et fullverdig ITSM-produkt.

## Slik kan jeg si det til sensor

"Jeg har sammenlignet systemet mitt med Pureservice fordi Pureservice er et profesjonelt norsk servicedesk-system. Mitt system er ikke ment å være like stort eller komplett. Jeg har laget en mindre eksamensversjon som viser de viktigste prinsippene: brukere kan opprette saker, support kan jobbe i kø, saker har status og prioritet, det finnes chat, interne notater, kunnskapsbase og rollebasert tilgang.

Forskjellen er at Pureservice også har store enterprise-funksjoner som SLA, automatisk ruting, rapporter, asset management, change management, mobilapp og integrasjoner. Det har jeg dokumentert som gap og videreutvikling.

Poenget mitt er å vise at jeg forstår hvordan et helpdesk-system fungerer, både fra utvikling, drift og brukerstøtte. Jeg kan også vise C++ audit logging som en backend-funksjon for sikkerhet og feilsøking."

## Gode forbedringer før eksamen

Hvis jeg rekker små forbedringer før eksamen, ville jeg prioritert:

1. Få filterknappene i ticket-listen til å faktisk filtrere Open, Waiting og Resolved.
2. Legge til en enkel SLA-frist, for eksempel `dueAt`, og vise om saken er innenfor frist eller forsinket.
3. Logge flere ticket-hendelser i aktivitetslisten, for eksempel statusendring og priority-endring.
4. Lage en enkel backup/export-knapp for `localStorage`.
5. Legge til et par skjermbilder i dokumentasjonen som viser user/support/admin-flyten.

## Langsiktige forbedringer

Hvis prosjektet skulle bli mer likt Pureservice på lang sikt, ville neste steg vært:

- backend med database
- server-side tilgangskontroll
- ekte audit trail for alle handlinger
- SLA og eskalering
- automatisk ruting etter kategori
- asset-register
- vedlegg
- e-postvarsling
- rapporter og grafer
- change management
- tester
- backup/restore

## Kort konklusjon

Systemet mitt kan sammenlignes med Pureservice på konseptnivå.

Det har flere sentrale helpdesk-funksjoner, men er mye enklere. Det er riktig nivå for et eksamensprosjekt fordi jeg kan forklare koden, vise funksjonene og være ærlig om hva som mangler.
