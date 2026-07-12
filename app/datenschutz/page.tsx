import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Datenschutz | youarethelight",
  description: "Datenschutzhinweise der Website you are the light.",
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      eyebrow="Rechtliches"
      title="Datenschutz"
      intro="Diese Seite ist eine technische Grundvorlage und ersetzt keine rechtliche Prüfung. Ergänze die konkret eingesetzten Dienste, Speicherdauern, Rechtsgrundlagen und Ansprechpartner vor dem Livegang."
      sections={[
        {
          title: "Allgemeine Hinweise",
          body: [
            "Der Schutz deiner personenbezogenen Daten ist wichtig. In dieser Datenschutzerklärung wird beschrieben, welche Daten beim Besuch dieser Website verarbeitet werden und zu welchem Zweck dies geschieht.",
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
            "Diese Website wird über Vercel bereitgestellt. Beim Aufruf der Website können technisch notwendige Server-Logdaten verarbeitet werden, etwa IP-Adresse, Datum/Uhrzeit, aufgerufene URL, Referrer und Browserinformationen.",
          ],
        },
        {
          title: "Kontaktaufnahme",
          body: [
            "Wenn du per E-Mail Kontakt aufnimmst, werden deine Angaben zur Bearbeitung der Anfrage und für mögliche Anschlussfragen verarbeitet.",
          ],
        },
        {
          title: "Eingesetzte Dienste",
          body: [
            "Je nach Konfiguration können Dienste für Hosting, Media-Storage, Authentifizierung und Content-Management eingesetzt werden, insbesondere Vercel, Supabase, Upstash und GitHub. Ergänze hier die konkret genutzten Verarbeitungen, Rechtsgrundlagen und Auftragsverarbeiterinformationen.",
          ],
        },
        {
          title: "Cookies & externe Inhalte",
          body: [
            "Beim ersten Besuch dieser Website wird ein Cookie-Banner eingeblendet. Deine Auswahl (z. B. \"Alle akzeptieren\" oder \"Nur notwendige\") wird ausschließlich lokal in deinem Browser gespeichert (localStorage), nicht in einem Cookie und nicht auf unseren Servern. Du kannst deine Auswahl jederzeit über den Link \"Cookie-Einstellungen\" im Footer der Website ändern oder widerrufen.",
            "Videos auf dieser Website können über den Anbieter Vimeo (Vimeo.com Inc., 555 West 18th Street, New York, NY 10011, USA) eingebunden sein. Ein eingebettetes Vimeo-Video wird jedoch erst geladen, wenn du dem aktiv zustimmst - erst dann setzt Vimeo eigene Cookies und es können Daten (z. B. IP-Adresse, Geräteinformationen) an Server von Vimeo in die USA übertragen werden. Rechtsgrundlage hierfür ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Ohne Zustimmung werden keine Vimeo-Inhalte geladen und keine entsprechenden Daten übertragen.",
            "Deine Einwilligung ist 12 Monate gültig. Danach wird das Cookie-Banner erneut angezeigt, damit du deine Auswahl bestätigen oder ändern kannst.",
          ],
        },
        {
          title: "Deine Rechte",
          body: [
            "Dir stehen nach anwendbarem Datenschutzrecht insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Beschwerde bei einer Aufsichtsbehörde zu.",
          ],
        },
      ]}
    />
  );
}
