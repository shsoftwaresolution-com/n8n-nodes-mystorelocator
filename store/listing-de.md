# My Store Locator – Eintrag als n8n-Community-Node (Deutsch)

Zuletzt geprüft: 2026-11-06 · Quellen: product-facts.md + content/pricing.json und content/de/entwickler/*.md (web-my-store-locator), n8n/README.md, n8n/SUBMISSION.md, n8n/package.json, n8n/nodes/*
Stand: nicht veröffentlicht – weder auf npm noch im n8n Creator Portal eingereicht. Erst danach „in n8n verfügbar“ schreiben.
n8n ist auf Englisch – für npm und n8n gilt listing-en.md. Diese Datei ist die deutsche Fassung für /integrationen/n8n/, Hilfe, Newsletter und Social Media. Gleiche Fakten wie in der englischen Datei.

## Felder im Portal und Grenzen

| Wo | Feld | Grenze | Unser Wert | Quelle der Grenze |
|---|---|---|---|---|
| npm | Paketname | muss mit `n8n-nodes-` beginnen | `n8n-nodes-mystorelocator` | SUBMISSION.md |
| npm | Beschreibung (package.json) | keine feste Grenze, ≤ 160 Zeichen halten | siehe listing-en.md | npm (prüfen) |
| npm | Keywords | `n8n-community-node-package` Pflicht | siehe listing-en.md | SUBMISSION.md |
| npm | Homepage, Repository, Lizenz | öffentliches GitHub-Repo für die Prüfung, MIT | siehe „Links“ | SUBMISSION.md |
| npm | README | Markdown, Bilder nur über absolute https-Adressen | `n8n/README.md` + Text unten | npm |
| n8n | Node-Icons | SVG hell und dunkel | `icons/` (vorhanden) | SUBMISSION.md |
| n8n Creator Portal | Prüfantrag | im Repo nicht dokumentiert – bei Eingabe prüfen | – | SUBMISSION.md |
| Screenshots, Video | **kein Upload-Feld**, README kann Bilder einbinden | Bildplan unten | npm / GitHub |

## Felder

**Paket:** `n8n-nodes-mystorelocator`
**Nodes:** My Store Locator · My Store Locator Trigger (Abfrage) · My Store Locator Webhook Trigger
**Zugangsdaten:** My Store Locator API (API-Schlüssel + Basis-URL)

**Kurzbeschreibung (141 Zeichen, für deutsche Seiten; auf npm gilt die englische Fassung):**
n8n-Nodes für My Store Locator: Standorte anlegen und ändern, Karten und Anfragen lesen, Workflows bei neuen Standorten und Anfragen starten.

**Suchbegriffe:** Filialfinder, Store Locator, Händlersuche, Standortkarte, Standorte, Filialen, Anfragen, Leads, Webhook, DSGVO, n8n
**Kategorien (falls gefragt):** Marketing · Sales · Data & Storage
**Sprachen:** Nodes englisch. App und öffentliche Karte von My Store Locator: Deutsch und Englisch.
**Tarif-Hinweis (muss sichtbar bleiben):** API-Schlüssel und Webhooks gibt es ab dem Tarif **Starter** ($20/Monat). Mit Free antwortet die API mit `403 plan_limit`.
**Lizenz:** MIT
**Anbieter:** Internet am Dornbusch, Inh. Sajjad Hanifa, Eschersheimer Landstraße 297, 60320 Frankfurt am Main (in package.json steht noch „SH Software Solution“)
**Support-E-Mail:** info@my-store-locator.com

### Links
- Startseite: https://my-store-locator.com/?utm_source=n8n&utm_medium=listing
- Anleitung n8n: https://my-store-locator.com/integrationen/n8n/?utm_source=n8n&utm_medium=listing
- API-Dokumentation: https://my-store-locator.com/entwickler/api/?utm_source=n8n&utm_medium=listing
- Webhooks: https://my-store-locator.com/entwickler/webhooks/?utm_source=n8n&utm_medium=listing
- Hilfe: https://my-store-locator.com/hilfe/?utm_source=n8n&utm_medium=listing
- Preise: https://my-store-locator.com/preise/?utm_source=n8n&utm_medium=listing
- Datenschutz: https://my-store-locator.com/datenschutz/?utm_source=n8n&utm_medium=listing
- AGB: https://my-store-locator.com/agb/?utm_source=n8n&utm_medium=listing
- AV-Vertrag: https://my-store-locator.com/av-vertrag/?utm_source=n8n&utm_medium=listing
- Impressum: https://my-store-locator.com/impressum/?utm_source=n8n&utm_medium=listing
- Repository (öffentlich): https://github.com/shsoftwaresolution-com/n8n-nodes-mystorelocator
- Registrieren: https://app.my-store-locator.com/#/register

### Nodes und Vorgänge (so in `n8n/nodes` gebaut; Bezeichnungen englisch)
| Node | Ressource / Ereignis | Vorgänge |
|---|---|---|
| My Store Locator | Location | Create, Get, Get Many (Suche, Ort, PLZ-Anfang, Land, Status, Kategorie, geändert seit; alle Seiten), Update, Archive |
| My Store Locator | Map | Get Many (ID, Name, Einbett-Token, veröffentlicht, Anzahl Standorte) |
| My Store Locator | Lead | Get Many (Anfragen, neueste zuerst) |
| My Store Locator | Category / Status | Get Many |
| My Store Locator Trigger | Abfrage | New Location · Updated Location · New Lead |
| My Store Locator Webhook Trigger | sofort | `location.created`, `location.updated`, `location.deleted`, `lead.created`, `map.published`, `import.finished` |

## Lange Beschreibung

Grenze: keine (npm-README); n8n hat kein Feld dafür. Text für /integrationen/n8n/, Newsletter und Beiträge. Dieser Text: etwa 792 Wörter.

### Was es ist
My Store Locator ist ein Filialfinder für Websites. Sie pflegen Filialen, Händler, Niederlassungen oder Partner in einer Web-App und zeigen sie als Karte mit durchsuchbarer Liste. Besucher suchen nach Ort oder PLZ, filtern, sehen Öffnungszeiten und planen die Route. Anbieter ist Internet am Dornbusch in Frankfurt am Main, gehostet wird in Deutschland.

Die Community-Nodes verbinden n8n mit der Kunden-API von My Store Locator. Ihre Workflows gleichen Standorte mit Tabelle, CRM oder ERP ab und geben Anfragen aus der Karte an die richtigen Leute weiter.

### Für wen
- Händler und Ketten, deren Filialliste in einem anderen System liegt.
- Hersteller und Marken mit Händlernetz.
- Franchise-Systeme, Verbände und Pflegedienste mit vielen Standorten.
- Teams, die n8n selbst betreiben und ihre Standortdaten in Deutschland halten wollen.

### Funktionen
**Standorte komplett verwalten.** Anlegen, abrufen, suchen, ändern und archivieren. „Get Many“ filtert nach Text, Ort, PLZ-Anfang, Land, Status, Kategorie oder Änderungsdatum und holt auf Wunsch alle Seiten.

**Verortung beim Anlegen.** Ein neuer Standort braucht nur Name und Ort. Fehlen Koordinaten, ermittelt My Store Locator die Position aus der Adresse. Sie wählen die Karten, auf denen er erscheint.

**Karten, Kategorien, Status.** Karten lassen sich mit Einbett-Token und Anzahl der Standorte abrufen. Kategorie, Status und Karten wählen Sie aus Listen, die aus Ihrem Konto geladen werden.

**Anfragen.** Lesen Sie die Anfragen, die Besucher über das Kontaktformular Ihrer Karten senden (Pro und Business), neueste zuerst.

**Abfrage-Trigger.** „My Store Locator Trigger“ startet einen Workflow bei neuen Standorten, Änderungen oder neuen Anfragen. Beim Aktivieren merkt er sich den Stand und meldet danach nur Neues.

**Webhook-Trigger in Echtzeit.** Beim Aktivieren trägt der Node seine Adresse in My Store Locator ein und speichert das Signatur-Geheimnis. Jede Lieferung wird gegen `X-MSL-Signature` geprüft (HMAC-SHA256, höchstens 5 Minuten alt); ungültige werden abgelehnt. Beim Deaktivieren wird der Webhook wieder entfernt.

**Werkzeug für KI-Agenten, keine Zusatzpakete.** Der Aktions-Node lässt sich als Werkzeug für n8n-KI-Agenten nutzen. Außer n8n selbst braucht das Paket keine Abhängigkeiten.

### Einrichtung in n8n, Schritt für Schritt
1. Melden Sie sich bei My Store Locator an (ab Tarif Starter) und öffnen Sie **API & Webhooks**.
2. Erstellen Sie einen Schlüssel „n8n“ mit den Rechten `locations:read`, `locations:write`, `maps:read`, `leads:read` (für den Webhook-Trigger zusätzlich `webhooks:write`, sobald verfügbar). Kopieren Sie ihn – er wird nur einmal angezeigt.
3. Öffnen Sie in n8n **Settings → Community Nodes → Install** und geben Sie `n8n-nodes-mystorelocator` ein. Selbst betrieben mit npm: `npm install n8n-nodes-mystorelocator` in `~/.n8n/nodes`.
4. Fügen Sie einem Workflow den Node **My Store Locator** hinzu und legen Sie die Zugangsdaten **My Store Locator API** an. Schlüssel einfügen, Basis-URL so lassen. n8n prüft die Verbindung.
5. Wählen Sie Ressource und Vorgang, etwa **Location → Create**, und ordnen Sie die Felder zu.
6. Für automatische Starts fügen Sie **My Store Locator Trigger** (Abfrage) oder **My Store Locator Webhook Trigger** (sofort) hinzu und aktivieren den Workflow.

### Datenschutz und Hosting in Deutschland
My Store Locator läuft auf Servern in Deutschland. Den AV-Vertrag nach Art. 28 DSGVO bestätigen Inhaber oder Administratoren in der App. Die Nodes senden Daten nur an die eingestellte API und erfassen selbst nichts. API-Schlüssel werden nur als Hash gespeichert und lassen sich jederzeit widerrufen; dann pausieren auch ihre Webhooks. Betreiben Sie n8n selbst, bleiben Ihre Workflow-Daten auf Ihrem Server. Für Ihr Konto können Sie die Zwei-Faktor-Anmeldung nutzen.

### Preise
- **Free – $0:** 25 Standorte, 1 Karte, Templates 1–3. Einbetten ja, API nein.
- **Starter – $20/Monat:** 100 Standorte, 3 Karten, 2 Benutzer, ohne Branding, CSV-Import und -Export, API mit 2 Schlüsseln und 10 Webhooks.
- **Pro – $50/Monat:** 1.000 Standorte, 10 Karten, 5 Benutzer, alle 10 Templates, Kontaktformular und Anfragen, Insights, mehrsprachige Karten, Route in der Karte, 5 Schlüssel und 25 Webhooks.
- **Business – auf Anfrage:** unbegrenzt Standorte, Karten, Schlüssel und Webhooks, Rollen und Rechte, White Label, individueller AV-Vertrag.

Jährlich 20 % günstiger. Preise in US-Dollar, zzgl. MwSt. Neue Konten testen 14 Tage alle Pro-Funktionen. Die Nodes selbst sind kostenlos (MIT).

### Support
Schreiben Sie an info@my-store-locator.com, gern auf Deutsch. Endpunkte, Rechte und Ereignisse: https://my-store-locator.com/entwickler/?utm_source=n8n&utm_medium=listing

### Häufige Fragen
**Welchen Tarif brauche ich?**
Starter oder höher für die API.

**Läuft das in n8n Cloud?**
n8n Cloud zeigt nur geprüfte Community-Nodes. Bis zur Prüfung lassen sich die Nodes in selbst betriebenem n8n installieren.

**Abfrage- oder Webhook-Trigger?**
Der Abfrage-Trigger braucht keinen Webhook und läuft nach dem Zeitplan von n8n. Der Webhook-Trigger reagiert sofort und belegt einen Webhook Ihres Tarifs (Starter 10, Pro 25, Business unbegrenzt).

**Brauche ich Koordinaten?**
Nein. Name und Ort reichen; mit Straße und PLZ wird die Position genauer.

**Löscht „Archive“ den Standort?**
Nein. Er wird archiviert und auf Karten ausgeblendet. In der App stellen Sie ihn wieder her.

**Welche n8n-Versionen werden unterstützt?**
n8n 1.x und 2.x (Nodes-API Version 1).

**Gibt es ein Anfrage-Limit?**
600 Anfragen pro Minute und Schlüssel. Darüber antwortet die API mit `429`.

## Bildplan
Kein Upload-Feld bei npm oder n8n. Bilder liegen im öffentlichen Repo (`docs/images/`) und werden im README eingebunden; außerdem auf /integrationen/n8n/. App-Screenshots auf Deutsch, n8n bleibt englisch.

| # | Dateiname | Größe | Quelle | Bildunterschrift |
|---|---|---|---|---|
| 1 | n8n-01-icon.svg | SVG (hell + dunkel) | `n8n/icons/` (vorhanden) | Node-Icon von My Store Locator |
| 2 | n8n-02-installieren.png | 1600×1000 | NEU: Settings → Community Nodes → Install | Paket in n8n installieren |
| 3 | n8n-03-zugang.png | 1600×1000 | NEU: Zugangsdaten „My Store Locator API“ (Schlüssel verdeckt) | Mit API-Schlüssel verbinden |
| 4 | n8n-04-workflow.png | 1600×1000 | NEU: Google Sheets → Location → Create | Standorte aus einer Tabelle anlegen |
| 5 | n8n-05-webhook.png | 1600×1000 | NEU: Webhook Trigger mit Demo-Ereignis `lead.created` | Workflows starten, sobald eine Anfrage kommt |
| 6 | n8n-06-api-schluessel-de.png | 1600×1000 | NEU: App → API & Webhooks → Schlüssel „n8n“ (Demofirma, deutsch) | Dem Schlüssel nur nötige Rechte geben |
| 7 | n8n-07-standorte-de.png | 1600×1000 | `de-02-locations.png` (2560×1600, verkleinern) | Die Standortliste, die Ihre Workflows pflegen |
| 8 | n8n-08-karte-de.png | 1600×1000 | `de-04-public-map.png` (2560×1600, verkleinern) | Der Filialfinder auf Ihrer Website |

Nur Demodaten, nur das neue Logo.

## Video
Kein Video-Feld. Optional 45–60 s Bildschirmaufnahme (installieren → verbinden → Anfrage-Workflow) für README und Integrationsseite.

## Noch offen
- Live-Prüfung 06.11.2026: Webhooks über die API (`webhooks:write`), `sort`/`sinceId` und der Popup-Verbinden-Modus sind seit App v1.8.0 live (PR #65), `/connect` seit v1.7.0. Vor dem Einreichen einmal komplett mit einem Starter-Konto testen.
- n8n/README.md und n8n/SUBMISSION.md sagen noch „nur Business“ – seit 05.11.2026 „ab Starter“ (nicht Teil dieser Änderung).
- Öffentliches Repo (Sajjads OK nötig), npm-Konto, Creator-Portal-Konto, Testschlüssel für die Prüfer.
- Anbietername in package.json klären.
- Neue Screenshots 2–6.
