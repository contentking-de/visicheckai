import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – visicheck.ai",
};

export default function DatenschutzPage() {
  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert">
      <h1>Datenschutzerklärung</h1>

      <h2>1. Verantwortlicher</h2>
      <p>
        Nicolas Sacotte
        <br />
        Eisenbahnstrasse 1
        <br />
        88677 Markdorf
        <br />
        E-Mail:{" "}
        <a href="mailto:nico@contentking.de">nico@contentking.de</a>
      </p>

      <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
      <p>
        Beim Besuch unserer Website werden automatisch Informationen durch den
        Browser übermittelt und in Server-Logfiles gespeichert. Dies umfasst:
      </p>
      <ul>
        <li>IP-Adresse des anfragenden Rechners</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>Name und URL der abgerufenen Datei</li>
        <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
        <li>
          Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners sowie
          der Name Ihres Access-Providers
        </li>
      </ul>
      <p>
        Diese Daten werden ausschließlich zur Sicherstellung eines
        störungsfreien Betriebs der Seite und zur Verbesserung unseres Angebots
        ausgewertet. Eine Zuordnung zu einer bestimmten Person ist nicht
        möglich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h2>3. Registrierung und Nutzerkonto</h2>
      <p>
        Bei der Registrierung auf unserer Plattform erheben wir folgende Daten:
      </p>
      <ul>
        <li>Name</li>
        <li>E-Mail-Adresse</li>
      </ul>
      <p>
        Diese Daten werden zur Bereitstellung unseres Dienstes verwendet.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
      </p>

      <h2>4. Anmeldung per Magic Link und Google OAuth</h2>
      <p>
        Wir bieten die Anmeldung per Magic Link (E-Mail-basiert) und über
        Google OAuth an. Bei der Anmeldung über Google werden Ihr Name und Ihre
        E-Mail-Adresse von Google übermittelt. Es gelten zusätzlich die
        Datenschutzbestimmungen von Google:{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://policies.google.com/privacy
        </a>
      </p>

      <h2>5. Nutzung von KI-Schnittstellen</h2>
      <p>
        visicheck.ai sendet von Ihnen definierte Prompts an externe
        KI-Dienste (u.a. OpenAI/ChatGPT, Google Gemini, Anthropic Claude). Die
        Prompts enthalten keine personenbezogenen Daten, sofern Sie keine
        solchen in den Prompts eingeben. Die jeweiligen Datenschutzrichtlinien
        der Anbieter finden Sie auf deren Websites.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Wir verwenden technisch notwendige Cookies, die für den Betrieb der
        Website erforderlich sind (z.B. Session-Cookies für die Authentifizierung).
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h2>7. Hosting</h2>
      <p>
        Unsere Website wird bei einem externen Dienstleister gehostet
        (Hosting-Provider). Die personenbezogenen Daten, die auf dieser Website
        erfasst werden, werden auf den Servern des Hosters gespeichert. Mit dem
        Anbieter wurde ein Auftragsverarbeitungsvertrag (AVV) geschlossen.
      </p>

      <h2>8. Ihre Rechte</h2>
      <p>Sie haben das Recht:</p>
      <ul>
        <li>
          gemäß Art. 15 DSGVO Auskunft über Ihre von uns verarbeiteten
          personenbezogenen Daten zu verlangen
        </li>
        <li>
          gemäß Art. 16 DSGVO unverzüglich die Berichtigung unrichtiger Daten
          zu verlangen
        </li>
        <li>
          gemäß Art. 17 DSGVO die Löschung Ihrer gespeicherten Daten zu
          verlangen
        </li>
        <li>
          gemäß Art. 18 DSGVO die Einschränkung der Verarbeitung zu verlangen
        </li>
        <li>
          gemäß Art. 20 DSGVO Ihre Daten in einem übertragbaren Format zu
          erhalten (Datenportabilität)
        </li>
        <li>
          gemäß Art. 21 DSGVO Widerspruch gegen die Verarbeitung einzulegen
        </li>
        <li>
          gemäß Art. 77 DSGVO sich bei einer Aufsichtsbehörde zu beschweren
        </li>
      </ul>

      <h2>9. Änderung dieser Datenschutzerklärung</h2>
      <p>
        Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie
        stets den aktuellen rechtlichen Anforderungen entspricht oder um
        Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch
        gilt dann die neue Datenschutzerklärung.
      </p>

      <p className="text-sm text-muted-foreground">
        Stand: Februar 2026
      </p>
    </article>
  );
}
