# Eksamen demo-checklist

Denne sjekklisten kan brukes som en praktisk demo foran sensor.

## 1. Logg inn som vanlig bruker

Bruk:

```text
user1 / user123
```

Forklar:

- Dette er lokal eksamensinnlogging.
- Rollen er `user`.
- Vanlig bruker kan opprette saker og se egne saker.

## 2. Opprett en sak

Gå til `Create ticket`.

Opprett en sak med:

- tittel
- kategori
- prioritet
- beskrivelse

Forklar:

- Saken lagres i `localStorage`.
- Systemet setter status `Open`.
- Systemet setter en enkel SLA-frist basert på prioritet.
- Det legges inn en aktivitet: ticket created.

## 3. Logg inn som support

Bruk:

```text
support1 / support123
```

Forklar:

- Rollen er `support`.
- Support får kø, claimed tickets og statusvisning.
- Support kan jobbe med saker som brukere har meldt inn.

## 4. Claim ticket

Velg saken og trykk `Claim ticket` eller `Claim`.

Forklar:

- Saken får `assignedTo`.
- Status settes til `In Progress`.
- Brukeren får en notification.
- Aktivitet legges til i historikken.

## 5. Vis notification

Logg inn som bruker igjen, eller forklar at notification vises når riktig bruker har en notification.

Forklar:

- Dette er en enkel demo-notification.
- Pureservice har mer avanserte varsler, men prinsippet er det samme: brukeren får beskjed når saken oppdateres.

## 6. Svar brukeren

Logg inn som support igjen.

Skriv en vanlig `Reply`.

Forklar:

- Meldingen er offentlig.
- Brukeren kan se den.
- Aktiviteten registreres som public reply.

## 7. Legg til intern note

Velg `Note` og skriv et internt notat.

Forklar:

- Intern note er bare synlig for support/admin.
- Vanlig bruker ser ikke Note-fanen.
- Vanlig bruker får ikke rendret interne notater.
- Dette ligner på profesjonelle servicedesk-systemer der intern kommunikasjon og kundekommunikasjon er separert.

## 8. Endre status og prioritet

Endre status, for eksempel:

```text
Open -> In Progress -> Waiting -> Resolved
```

Endre prioritet, for eksempel:

```text
Medium -> High
```

Forklar:

- Status og prioritet oppdaterer saken.
- Aktivitet legges til i historikken.
- Når prioritet endres, settes en ny enkel SLA-frist.

## 9. Vis SLA-indikator

Se i høyrepanelet.

Forklar:

- `Within SLA`: saken er innenfor frist.
- `Due soon`: saken nærmer seg frist.
- `Overdue`: fristen er passert.

Dette er en enkel eksamensversjon, ikke et komplett SLA-system med arbeidstid og eskalering.

## 10. Export backup

Logg inn som support eller admin.

Trykk:

```text
Export backup
```

Forklar:

- Systemet laster ned en JSON-fil med gjeldende HelpDesk-data.
- Dette er en enkel backup/export av `localStorage`.
- Det kan brukes til å forklare driftsstøtte: data bør kunne tas vare på og gjenopprettes.

## 11. Hva er likt med Pureservice?

Forklar kort:

- Begge systemer har saker/tickets.
- Begge har kø og saksbehandling.
- Begge har roller og tilgangsstyring.
- Begge skiller mellom offentlig kommunikasjon og interne notater.
- Begge bruker kunnskapsbase for å støtte brukere og support.
- Begge har fokus på status, prioritet og oversikt.

## 12. Hva er enklere enn Pureservice?

Forklar ærlig:

- Mitt system bruker `localStorage`, ikke en ekte serverdatabase.
- Det har ikke e-post, SMS, Teams eller telefonintegrasjon.
- Det har ikke full SLA-motor.
- Det har ikke asset management / CMDB.
- Det har ikke change management.
- Det har ikke mobilapp med push-varsler.
- Det har ikke full GDPR/compliance-funksjonalitet.

## Kort avslutning

Jeg kan si:

```text
Dette er en mindre eksamensversjon inspirert av profesjonelle servicedesk-systemer som Pureservice. Jeg har fokusert på de viktigste delene: innmelding av saker, roller, kø, saksbehandling, kommunikasjon, interne notater, kunnskapsbase, SLA-indikator og enkel backup/export. De store enterprise-funksjonene har jeg dokumentert som videreutvikling.
```
