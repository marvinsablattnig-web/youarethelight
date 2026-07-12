import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Impressum | youarethelight",
  description: "Impressum der Website you are the light.",
};

export default function ImpressumPage() {
  return (
    <LegalPage
      eyebrow="Rechtliches"
      title="Impressum"
      intro="Diese Seite ist als Vorlage angelegt. Ersetze alle Platzhalter durch deine echten Unternehmens- und Kontaktdaten und lass die Inhalte vor dem Livegang rechtlich prüfen."
      sections={[
        {
          title: "Angaben zum Medieninhaber",
          body: [
            "Name / Unternehmen:\n[Bitte eintragen]",
            "Vertreten durch:\n[Bitte eintragen]",
            "Anschrift:\n[Straße, Hausnummer]\n[PLZ, Ort]\n[Land]",
          ],
        },
        {
          title: "Kontakt",
          body: [
            "Telefon:\n[Bitte eintragen]",
            "E-Mail:\n[Bitte eintragen]",
            "Website:\n[Bitte eintragen]",
          ],
        },
        {
          title: "Unternehmensangaben",
          body: [
            "Unternehmensgegenstand:\n[Bitte eintragen]",
            "UID-Nummer:\n[Bitte eintragen]",
            "Firmenbuchnummer / Registergericht:\n[Bitte eintragen, falls vorhanden]",
            "Gewerbebehörde:\n[Bitte eintragen, falls relevant]",
          ],
        },
        {
          title: "Haftung für Inhalte",
          body: [
            "Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird jedoch keine Gewähr übernommen.",
          ],
        },
        {
          title: "Urheberrecht",
          body: [
            "Soweit nicht anders angegeben, unterliegen Texte, Bilder, Videos und sonstige Inhalte auf dieser Website dem Urheberrecht. Eine Verwendung ohne ausdrückliche Zustimmung ist nicht gestattet.",
          ],
        },
      ]}
    />
  );
}
