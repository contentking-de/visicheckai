import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum – visicheck.ai",
};

export default function ImpressumPage() {
  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert">
      <h1>Impressum</h1>

      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        Nicolas Sacotte
        <br />
        Eisenbahnstrasse 1
        <br />
        88677 Markdorf
      </p>

      <h2>Kontakt</h2>
      <p>
        Tel.: +49 7544 5067064
        <br />
        E-Mail:{" "}
        <a href="mailto:nico@contentking.de">nico@contentking.de</a>
      </p>

      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE227809660
      </p>

      <h2>Inhaltlich verantwortlich</h2>
      <p>
        Inhaltlich verantwortlich i.S.v. § 18 Abs. 2 MStV:
        <br />
        Nicolas Sacotte
        <br />
        Am Stadtgraben 25
        <br />
        88677 Markdorf
      </p>

      <h2>Streitbeilegung</h2>
      <p>
        Wir sind nicht bereit und nicht verpflichtet, an einem
        Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
        teilzunehmen.
      </p>
    </article>
  );
}
