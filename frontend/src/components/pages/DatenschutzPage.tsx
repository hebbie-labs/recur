import { useRouter } from "next/navigation";
import LegalPageLayout from "@/components/templates/LegalPageLayout";

function DatenschutzPage() {
  const router = useRouter();

  return (
    <LegalPageLayout
      title="Datenschutzerklärung"
      lastUpdated="22. September 2026"
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
            ein Anmelde-Token (JWT) und ein Sitzungs-Token (Refresh-Token),
            die beide in für JavaScript nicht zugänglichen Cookies liegen;
            das Sitzungs-Token stellt automatisch ein neues Anmelde-Token
            aus, sobald das alte abläuft - so bleibst du bis zu 30 Tage
            eingeloggt, ohne dich erneut anmelden zu müssen. Zu jeder
            solchen Sitzung speichern wir zudem die
            IP-Adresse und den User-Agent (Browser/Gerät) des jeweiligen
            Geräts; das ermöglicht künftig eine Übersicht deiner aktiven
            Sitzungen. Meldest du dich ab, wird die zugehörige Sitzung
            serverseitig ungültig gemacht.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Nutzungsanalyse (optional, aktuell nicht aktiv):
            </span>{" "}
            In deinen Privatsphäre-Einstellungen kannst du "Nutzungsdaten
            teilen" aktivieren oder deaktivieren. Aktuell erfassen wir keine
            Analyse- oder Trackingdaten; die Einstellung reserviert deine
            Präferenz für den Fall, dass wir eine solche Funktion künftig
            einführen. Wird diese Funktion eingeführt, aktualisieren wir
            diese Datenschutzerklärung entsprechend.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Benachrichtigungseinstellungen:
            </span>{" "}
            In deinen Benachrichtigungseinstellungen kannst du E-Mail- und
            Push-Benachrichtigungen für Aufgaben-Erinnerungen aktivieren oder
            deaktivieren sowie festlegen, wie lange vor dem Fälligkeitsdatum
            einer Aufgabe du erinnert werden möchtest. Ist E-Mail aktiviert,
            versenden wir Erinnerungs- und Überfällig-E-Mails über unseren
            E-Mail-Dienstleister Brevo (siehe unten); die Zustellung ist
            aktuell nicht garantiert (siehe Abschnitt
            "E-Mail-Verifizierung und Kontowiederherstellung"). Ist Push
            aktiviert, speichern wir die vom Browser bereitgestellte
            Push-Subscription (Endpoint-URL und Verschlüsselungsschlüssel
            deines Geräts), um dir Erinnerungen als Browser-Benachrichtigung
            zuzustellen; diese Daten werden gelöscht, sobald du Push wieder
            deaktivierst oder die Subscription ungültig wird. In geteilten
            Projekten wird zudem allen Gruppenmitgliedern (ausser der
            erstellenden Person) eine Benachrichtigung geschickt, wenn ein
            neuer Task für das Projekt erstellt wird.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          E-Mail-Verifizierung und Kontowiederherstellung
        </h2>
        <p>
          <span className="font-medium text-foreground">
            Vorübergehend deaktiviert:
          </span>{" "}
          unser E-Mail-Versand wird derzeit von den Mail-Servern der meisten
          Empfänger:innen blockiert, daher können wir aktuell keine
          Bestätigungs- oder Passwort-Reset-Mails zustellen. Solange dies der
          Fall ist, wird deine E-Mail-Adresse bei der Registrierung per
          E-Mail/Passwort ohne Bestätigungslink als verifiziert markiert und
          eine Anmeldung ist direkt nach der Registrierung möglich; die
          Funktion "Passwort vergessen?" ist im Login-Formular ausgeblendet.
        </p>
        <p>
          Sobald der Mail-Versand wieder funktioniert, senden wir dir bei
          Registrierung per E-Mail/Passwort wieder eine Bestätigungs-E-Mail
          mit einem Verifizierungslink und aktivieren "Passwort vergessen?"
          erneut. Der zugehörige Token wird serverseitig gespeichert, ist bei
          der E-Mail-Bestätigung 24 Stunden und beim Passwort-Reset 1 Stunde
          gültig und wird nach Bestätigung/Verwendung bzw. Ablauf gelöscht.
        </p>
        <p>
          Der Versand erfolgt über unseren E-Mail-Dienstleister Brevo als
          Auftragsverarbeiter; dabei wird ausschliesslich deine E-Mail-Adresse
          (nebst Vorname und Bestätigungs- bzw. Reset-Link) an Brevo übermittelt.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Sichtbarkeit in Gruppen
        </h2>
        <p>
          Wenn du Aufgaben über die Gruppen-Funktion mit anderen teilst, sind
          dein Vor- und Nachname sowie dein Profilbild für die anderen
          Mitglieder dieser Gruppe sichtbar. Schaltest du "Für
          Gruppenmitglieder sichtbar" in den Privatsphäre-Einstellungen aus,
          sehen andere Mitglieder stattdessen nur deine Initialen ohne
          Profilbild - in der Mitgliederliste, bei der Aufgaben-Zuweisung und
          überall sonst, wo deine Gruppenmitgliedschaft angezeigt wird.
        </p>
        <p>
          Für einen geteilten Gruppen-Task speichern wir ausserdem, wer ihn
          erstellt hat (nicht an andere Mitglieder sichtbar), sowie für
          welche Mitglieder er nach dem Löschen weiterhin ausgeblendet
          bleibt - er wird dabei nur für dich entfernt, die übrigen
          Mitglieder behalten ihn, bis die erstellende Person ihn endgültig
          löscht. Löschst du dein Konto, werden diese Zuordnungen entfernt;
          der Task selbst bleibt für die übrigen Mitglieder bestehen.
        </p>
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
          <li>
            <span className="font-medium text-foreground">
              access_token:
            </span>{" "}
            hält dein Anmelde-Token für die Dauer deiner Sitzung (30 Minuten,
            wird bei Aktivität automatisch erneuert, siehe "Technische Daten"
            oben). Für JavaScript nicht auslesbar (HttpOnly) und nur an
            unseren Server, nicht an Dritte, übermittelt.
          </li>
          <li>
            <span className="font-medium text-foreground">
              refresh_token:
            </span>{" "}
            hält dich bis zu 30 Tage eingeloggt, ohne dass du dich erneut
            anmelden musst (siehe "Technische Daten" oben). Für JavaScript
            nicht auslesbar (HttpOnly) und nur an unseren Server, nicht an
            Dritte, übermittelt.
          </li>
          <li>
            <span className="font-medium text-foreground">
              XSRF-TOKEN:
            </span>{" "}
            ein zufälliger Sicherheits-Wert, der Angriffe verhindert, bei
            denen eine andere Website in deinem Namen Aktionen in Recur
            auslösen würde (CSRF-Schutz). Enthält keine personenbezogenen
            Daten und wird nur an unseren Server übermittelt.
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
