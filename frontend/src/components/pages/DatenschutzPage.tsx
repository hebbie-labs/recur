import { useRouter } from "next/navigation";
import LegalPageLayout from "@/components/templates/LegalPageLayout";

function DatenschutzPage() {
  const router = useRouter();

  return (
    <LegalPageLayout
      title="Datenschutzerklärung"
      lastUpdated="14. September 2026"
    >
      <p className="text-muted-foreground">
        Diese Datenschutzerklärung informiert dich darüber, welche
        personenbezogenen Daten bei der Nutzung von Recur verarbeitet
        werden, gemäss Schweizer Datenschutzgesetz (revDSG) und, soweit
        anwendbar, der EU-Datenschutz-Grundverordnung (DSGVO).
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Verantwortliche Stelle
        </h2>
        <p>
          Leon Hebeisen
          <br />
          Brunismattweg 5, 3665 Wattenwil, Schweiz
          <br />
          E-Mail: leonhebeisen@proton.me
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Welche Daten wir verarbeiten
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Kontodaten:</span>{" "}
            Vor- und Nachname, E-Mail-Adresse, Passwort (verschlüsselt
            gespeichert) bei der Registrierung per E-Mail.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Google-Login (OAuth2):
            </span>{" "}
            Falls du dich über Google anmeldest, erhalten wir von Google
            deinen Namen, deine E-Mail-Adresse und ggf. dein Profilbild.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Nutzungsdaten:
            </span>{" "}
            von dir erstellte Aufgaben (Tasks), Gruppen, Projekte und
            zugehörige Metadaten (z.B. Fälligkeitsdaten, Kategorien,
            Fortschritt).
          </li>
          <li>
            <span className="font-medium text-foreground">
              Technische Daten:
            </span>{" "}
            ein Anmelde-Token (JWT), das lokal in deinem Browser
            (localStorage) gespeichert wird, um dich eingeloggt zu halten.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Zweck der Verarbeitung
        </h2>
        <p>
          Wir verarbeiten diese Daten ausschliesslich, um dir die
          Kernfunktionen von Recur bereitzustellen: Authentifizierung,
          Speicherung und Anzeige deiner Aufgaben, sowie die
          Zusammenarbeit in geteilten Gruppen/Projekten. Es findet keine
          Weitergabe an Dritte zu Werbezwecken statt.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Rechtsgrundlage
        </h2>
        <p>
          Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags
          (Bereitstellung des Dienstes) sowie, im Fall des Google-Logins,
          auf Basis deiner Einwilligung gegenüber Google und uns.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Google OAuth2 / Drittanbieter
        </h2>
        <p>
          Wenn du dich mit Google anmeldest, gelten zusätzlich die
          Datenschutzbestimmungen von Google. Wir erhalten von Google nur
          die für die Anmeldung notwendigen Profildaten und geben keine
          eigenen Daten an Google weiter, ausser den für den Login-Flow
          technisch erforderlichen Informationen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Speicherdauer und Hosting
        </h2>
        <p>
          Deine Daten werden in einer PostgreSQL-Datenbank gespeichert,
          selbst gehostet auf einem privaten Server in der Schweiz/Deutschland.
          Wir speichern deine Daten, solange dein Konto besteht. Nach
          Löschung deines Kontos werden deine personenbezogenen Daten
          innerhalb von 30 Tagen gelöscht, soweit keine gesetzliche
          Aufbewahrungspflicht entgegensteht.
        </p>
        <p>
          Der Datenverkehr zu unserem Server läuft über Cloudflare (Cloudflare
          Tunnel). Cloudflare fungiert dabei als Auftragsverarbeiter und kann
          technische Verbindungsdaten (z.B. IP-Adresse) verarbeiten, um den
          Datenverkehr an unseren Server weiterzuleiten und vor Missbrauch zu
          schützen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Lokale Speicherung (localStorage)
        </h2>
        <p>
          Recur verwendet den localStorage deines Browsers, um dein
          Anmelde-Token zu speichern. Dies ist technisch notwendig, damit
          du zwischen Seitenaufrufen eingeloggt bleibst.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Cookies
        </h2>
        <p>
          Es werden keine Tracking- oder Werbe-Cookies eingesetzt. Wir
          verwenden lediglich folgende technisch notwendige Cookies:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">
              sidebar_state:
            </span>{" "}
            speichert, ob die Seitenleiste ein- oder ausgeklappt ist
            (7 Tage gültig).
          </li>
          <li>
            <span className="font-medium text-foreground">
              JSESSIONID:
            </span>{" "}
            wird beim Login über Google gesetzt, um den Anmeldevorgang
            (OAuth2) durchzuführen; er wird von unserem Server nach
            Abschluss des Logins nicht mehr für die eigentliche Nutzung
            der App benötigt (diese läuft über das Anmelde-Token) und
            verfällt mit dem Ende der Browser-Sitzung.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Deine Rechte
        </h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung und
          Einschränkung der Verarbeitung deiner Daten sowie auf
          Datenübertragbarkeit. Wende dich dazu an die oben genannte
          Kontaktadresse. Soweit die DSGVO anwendbar ist, hast du zudem ein
          Beschwerderecht bei der zuständigen Aufsichtsbehörde.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Änderungen dieser Erklärung
        </h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen,
          sobald sich die Datenverarbeitung ändert. Die jeweils aktuelle
          Version ist stets über diese Seite abrufbar.
        </p>
      </section>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          className="self-start text-sm text-primary hover:underline"
          onClick={() => router.push("/impressum")}
        >
          Zum Impressum
        </button>
        <button
          type="button"
          className="self-start text-sm text-primary hover:underline"
          onClick={() => router.push("/agb")}
        >
          Zu den Nutzungsbedingungen
        </button>
      </div>
    </LegalPageLayout>
  );
}

export default DatenschutzPage;
