import { Metadata } from "next";
import { buildHreflangAlternates } from "@/lib/locale-href";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen – visicheck.ai",
  alternates: {
    languages: buildHreflangAlternates("/agb"),
  },
};

export default function AGBPage() {
  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert">
      <h1>Allgemeine Geschäftsbedingungen</h1>

      <h2>§ 1 Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der
        Plattform visicheck.ai, betrieben von Nicolas Sacotte,
        Eisenbahnstrasse 1, 88677 Markdorf (nachfolgend „Anbieter").
      </p>
      <p>
        Mit der Registrierung und Nutzung der Plattform erklärt sich der
        Nutzer mit diesen AGB einverstanden.
      </p>

      <h2>§ 2 Leistungsbeschreibung</h2>
      <p>
        visicheck.ai ist eine Plattform zur Messung und Analyse der
        Sichtbarkeit von Marken und Domains in KI-gestützten Suchsystemen
        (u.a. ChatGPT, Google Gemini, Anthropic Claude). Der Anbieter stellt
        dem Nutzer Werkzeuge zur Verfügung, um Prompts zu definieren,
        Sichtbarkeitsdaten zu erheben und auszuwerten.
      </p>

      <h2>§ 3 Registrierung und Nutzerkonto</h2>
      <ol>
        <li>
          Für die Nutzung der Plattform ist eine Registrierung erforderlich.
          Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen.
        </li>
        <li>
          Jeder Nutzer darf nur ein Konto führen. Der Zugang zum Konto ist
          persönlich und darf nicht an Dritte weitergegeben werden.
        </li>
        <li>
          Der Anbieter behält sich das Recht vor, Nutzerkonten bei Verstoß
          gegen diese AGB zu sperren oder zu löschen.
        </li>
      </ol>

      <h2>§ 4 Kostenlose und kostenpflichtige Leistungen</h2>
      <ol>
        <li>
          Die Basisnutzung der Plattform kann kostenlos erfolgen. Der Umfang
          der kostenlosen Leistungen wird auf der Website beschrieben.
        </li>
        <li>
          Für erweiterte Funktionen können kostenpflichtige Tarife angeboten
          werden. Die jeweiligen Preise und Konditionen werden vor
          Vertragsschluss transparent dargestellt.
        </li>
        <li>
          Der Anbieter behält sich das Recht vor, den Umfang kostenloser
          Leistungen jederzeit zu ändern.
        </li>
      </ol>

      <h2>§ 5 Pflichten des Nutzers</h2>
      <ol>
        <li>
          Der Nutzer verpflichtet sich, die Plattform nur für rechtmäßige
          Zwecke zu nutzen.
        </li>
        <li>
          Der Nutzer darf keine Prompts eingeben, die gegen geltendes Recht
          verstoßen oder Rechte Dritter verletzen.
        </li>
        <li>
          Automatisierte Zugriffe auf die Plattform (z.B. Scraping) sind ohne
          ausdrückliche Genehmigung des Anbieters nicht gestattet.
        </li>
      </ol>

      <h2>§ 6 Verfügbarkeit</h2>
      <p>
        Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie
        Verfügbarkeit der Plattform. Ein Anspruch auf ständige Verfügbarkeit
        besteht nicht. Der Anbieter haftet nicht für Ausfallzeiten aufgrund von
        Wartung, technischen Störungen oder höherer Gewalt.
      </p>

      <h2>§ 7 Haftung</h2>
      <ol>
        <li>
          Die auf der Plattform bereitgestellten Daten und Analysen dienen
          ausschließlich zu Informationszwecken. Der Anbieter übernimmt keine
          Gewähr für die Vollständigkeit, Richtigkeit und Aktualität der
          bereitgestellten Daten.
        </li>
        <li>
          Die Haftung des Anbieters für leicht fahrlässig verursachte Schäden
          ist ausgeschlossen, soweit diese keine vertragswesentlichen
          Pflichten, Schäden aus der Verletzung des Lebens, des Körpers oder
          der Gesundheit betreffen.
        </li>
      </ol>

      <h2>§ 8 Geistiges Eigentum</h2>
      <p>
        Alle Inhalte der Plattform (Texte, Grafiken, Software, Logos) sind
        urheberrechtlich geschützt. Eine Vervielfältigung oder Verwendung
        außerhalb der bestimmungsgemäßen Nutzung bedarf der vorherigen
        schriftlichen Zustimmung des Anbieters.
      </p>

      <h2>§ 9 Kündigung</h2>
      <ol>
        <li>
          Der Nutzer kann sein Konto jederzeit löschen und die Nutzung der
          Plattform beenden.
        </li>
        <li>
          Der Anbieter kann das Nutzungsverhältnis mit einer Frist von 14
          Tagen kündigen. Das Recht zur außerordentlichen Kündigung aus
          wichtigem Grund bleibt unberührt.
        </li>
      </ol>

      <h2>§ 10 Datenschutz</h2>
      <p>
        Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß
        unserer{" "}
        <a href="/datenschutz">Datenschutzerklärung</a>.
      </p>

      <h2>§ 11 Änderungen der AGB</h2>
      <p>
        Der Anbieter behält sich das Recht vor, diese AGB jederzeit zu ändern.
        Registrierte Nutzer werden über Änderungen per E-Mail informiert. Die
        weitere Nutzung der Plattform nach Inkrafttreten der Änderungen gilt
        als Zustimmung.
      </p>

      <h2>§ 12 Schlussbestimmungen</h2>
      <ol>
        <li>Es gilt das Recht der Bundesrepublik Deutschland.</li>
        <li>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt.
        </li>
      </ol>

      <p className="text-sm text-muted-foreground">
        Stand: Februar 2026
      </p>
    </article>
  );
}
