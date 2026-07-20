/** Inhalt der Datenschutzerklärung (FIELDNET) */

export const DATENSCHUTZ_BLOCKS = [
  { type: 'h1', text: 'Datenschutzerklärung' },

  { type: 'h2', text: '1. Datenschutz auf einen Blick' },
  { type: 'h3', text: 'Allgemeine Hinweise' },
  {
    type: 'p',
    text: 'Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit deinen personenbezogenen Daten passiert, wenn du die FIELDNET-App nutzt. Personenbezogene Daten sind alle Daten, mit denen du persönlich identifiziert werden kannst.',
  },
  { type: 'h3', text: 'Datenerfassung in dieser App' },
  {
    type: 'p',
    text: 'Die Datenverarbeitung in dieser App erfolgt durch den App-Betreiber. Dessen Kontaktdaten kannst du dem Abschnitt „Hinweis zur verantwortlichen Stelle“ entnehmen. Die Daten werden zum einen dadurch erhoben, dass du uns diese in Formularen mitteilst. Andere technische Daten werden zur Bereitstellung der App-Funktionen automatisch über unsere IT-Systeme erfasst.',
  },

  { type: 'h2', text: '2. Hosting und Infrastruktur' },
  {
    type: 'p',
    text: 'Wir hosten die Inhalte unserer App bei externen Dienstleistern. Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren Nutzern (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Angebots (Art. 6 Abs. 1 lit. f DSGVO).',
  },
  { type: 'h3', text: 'netcup' },
  {
    type: 'p',
    text: 'Wir nutzen für unsere Domain-Infrastruktur und E-Mail-Routing den Anbieter netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe. Wir haben mit dem Anbieter einen gesetzlich vorgeschriebenen Vertrag über Auftragsverarbeitung (AVV) geschlossen.',
  },
  { type: 'h3', text: 'Supabase (Datenbank und Authentifizierung)' },
  {
    type: 'p',
    text: 'Wir nutzen für die Registrierung, Anmeldung und Datenverwaltung den Cloud-Dienst Supabase (Supabase, Inc., USA). Alle von dir eingegebenen App-Daten (z. B. Ligen, Teams, Ergebnisse und Profilangaben) sowie deine Login-Daten (E-Mail-Adresse und verschlüsseltes Passwort) werden auf den sicheren Servern von Supabase verarbeitet. Mit dem Anbieter wurde ein Vertrag über Auftragsverarbeitung (AVV) inklusive EU-Standardvertragsklauseln geschlossen.',
  },

  { type: 'h2', text: '3. Allgemeine Hinweise und Pflichtinformationen' },
  { type: 'h3', text: 'Hinweis zur verantwortlichen Stelle' },
  {
    type: 'p',
    text: 'Die verantwortliche Stelle für die Datenverarbeitung ist:',
  },
  {
    type: 'address',
    lines: [
      'Enver Jonuz',
      'Mühlstraße 29',
      '89542 Herbrechtingen',
      'E-Mail: kontakt@fieldnet-app.de',
    ],
  },
  { type: 'h3', text: 'Speicherdauer' },
  {
    type: 'p',
    text: 'Soweit keine speziellere Speicherdauer genannt wurde, verbleiben deine personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt (z. B. bei der Löschung deines Accounts).',
  },
  { type: 'h3', text: 'Deine Rechte als Nutzer' },
  {
    type: 'p',
    text: 'Du hast jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck deiner gespeicherten Daten zu erhalten. Du hast außerdem ein Recht, die Berichtigung, Einschränkung oder Löschung dieser Daten zu verlangen sowie deine Einwilligung jederzeit zu widerrufen. Zudem steht dir ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.',
  },

  { type: 'h2', text: '4. Spezifische Datenerfassung in dieser App' },
  { type: 'h3', text: 'Nutzerregistrierung und Authentifizierung' },
  {
    type: 'p',
    text: 'Wenn du ein Nutzerkonto in der App erstellst, verarbeiten wir deine E-Mail-Adresse und dein Passwort, um dir den Zugang zu deinem Profil zu ermöglichen (Art. 6 Abs. 1 lit. b DSGVO).',
  },
  { type: 'h3', text: 'Feedback-, Support- und Kontaktformulare' },
  {
    type: 'p',
    text: 'Wenn du uns über die integrierten Formulare Feedback oder eine Support-Anfrage zukommen lässt, werden deine eingegebenen Daten (Kategorie, Nachricht) sowie deine User-ID zur Bearbeitung des Anliegens verarbeitet.',
  },
  {
    type: 'p',
    text: 'Für den technischen Versand dieser Support-Benachrichtigungen an uns nutzen wir den E-Mail-Dienst Resend (Resend, Inc., USA). Die Daten werden verschlüsselt übermittelt, um eine direkte Zustellung an unsere Support-Adresse zu gewährleisten (berechtigtes Interesse gemäß Art. 6 Abs. 1 lit. f DSGVO). Mit Resend besteht ein Vertrag zur Auftragsverarbeitung (AVV).',
  },

  { type: 'h2', text: '5. SSL- bzw. TLS-Verschlüsselung' },
  {
    type: 'p',
    text: 'Diese App nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Damit können Daten, die du innerhalb der App übermittelst, nicht von Dritten mitgelesen werden.',
  },
];
