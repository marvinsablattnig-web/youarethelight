import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Datenschutz | you are the light",
  description: "Datenschutzhinweise der Website you are the light.",
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      eyebrow="Rechtliches"
      title="Datenschutz"
      intro="Diese Seite ist eine technische Grundvorlage und ersetzt keine rechtliche Pruefung. Ergaenze die konkret eingesetzten Dienste, Speicherdauern, Rechtsgrundlagen und Ansprechpartner vor dem Livegang."
      sections={[
        {
          title: "Allgemeine Hinweise",
          body: [
            "Der Schutz deiner personenbezogenen Daten ist wichtig. In dieser Datenschutzerklaerung wird beschrieben, welche Daten beim Besuch dieser Website verarbeitet werden und zu welchem Zweck dies geschieht.",
          ],
        },
        {
          title: "Verantwortliche Stelle",
          body: [
            "Name / Unternehmen:\n[Bitte eintragen]",
            "Anschrift:\n[Bitte eintragen]",
            "E-Mail:\n[Bitte eintragen]",
          ],
        },
        {
          title: "Hosting",
          body: [
            "Diese Website wird ueber Vercel bereitgestellt. Beim Aufruf der Website koennen technisch notwendige Server-Logdaten verarbeitet werden, etwa IP-Adresse, Datum/Uhrzeit, aufgerufene URL, Referrer und Browserinformationen.",
          ],
        },
        {
          title: "Kontaktaufnahme",
          body: [
            "Wenn du per E-Mail Kontakt aufnimmst, werden deine Angaben zur Bearbeitung der Anfrage und fuer moegliche Anschlussfragen verarbeitet.",
          ],
        },
        {
          title: "Eingesetzte Dienste",
          body: [
            "Je nach Konfiguration koennen Dienste fuer Hosting, Media-Storage, Authentifizierung und Content-Management eingesetzt werden, insbesondere Vercel, Supabase, Upstash und GitHub. Ergaenze hier die konkret genutzten Verarbeitungen, Rechtsgrundlagen und Auftragsverarbeiterinformationen.",
          ],
        },
        {
          title: "Deine Rechte",
          body: [
            "Dir stehen nach anwendbarem Datenschutzrecht insbesondere Rechte auf Auskunft, Berichtigung, Loeschung, Einschraenkung, Datenuebertragbarkeit, Widerspruch und Beschwerde bei einer Aufsichtsbehoerde zu.",
          ],
        },
      ]}
    />
  );
}
