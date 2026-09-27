import { useRouter } from "next/navigation";
import LegalPageLayout from "@/components/templates/LegalPageLayout";

function AgbPage() {
  const router = useRouter();

  return (
    <LegalPageLayout
      title="Nutzungsbedingungen (AGB)"
      lastUpdated="15. September 2026"
    >
      <p className="text-muted-foreground">
        Diese Nutzungsbedingungen regeln die Nutzung von Recur. Mit der
        Erstellung eines Kontos akzeptierst du die folgenden Bedingungen.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Leistungsbeschreibung
        </h2>
        <p>
          Recur ist eine kostenlose Anwendung zur Verwaltung von Aufgaben
          (Tasks), Gewohnheiten, Gruppen und Projekten. Es werden derzeit
          keine kostenpflichtigen Funktionen angeboten.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">Konto</h2>
        <p>
          Für die Nutzung von Recur ist ein Konto erforderlich, entweder per
          E-Mail/Passwort oder über Google-Login. Du bist dafür
          verantwortlich, deine Zugangsdaten geheim zu halten und uns über
          eine missbräuchliche Nutzung deines Kontos zu informieren.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Gruppen und geteilte Inhalte
        </h2>
        <p>
          Wenn du Aufgaben oder Projekte mit anderen Nutzer:innen in einer
          Gruppe teilst, sind diese Inhalte für die übrigen Gruppenmitglieder
          sichtbar. Du bist selbst dafür verantwortlich, welche Inhalte du
          mit einer Gruppe teilst. Streitigkeiten zwischen Mitgliedern einer
          Gruppe (z.B. über geteilte Aufgaben) sind eigenverantwortlich zu
          klären; wir übernehmen dafür keine Vermittlungspflicht.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Pflichten der Nutzer:innen
        </h2>
        <p>
          Du verpflichtest dich, Recur nicht für rechtswidrige Zwecke zu
          nutzen und keine Inhalte einzustellen, die gegen geltendes Recht
          oder Rechte Dritter verstossen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Verfügbarkeit und Haftung
        </h2>
        <p>
          Recur wird ohne Gewähr für ständige Verfügbarkeit bereitgestellt.
          Es besteht kein Anspruch auf unterbrechungsfreien Betrieb. Die
          Haftung für leichte Fahrlässigkeit wird, soweit gesetzlich
          zulässig, ausgeschlossen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Kündigung / Löschung des Kontos
        </h2>
        <p>
          Du kannst die Nutzung von Recur jederzeit beenden, indem du die
          Löschung deines Kontos beantragst (siehe Datenschutzerklärung). Wir
          behalten uns vor, Konten bei Verstössen gegen diese Bedingungen zu
          sperren oder zu löschen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Änderungen dieser Bedingungen
        </h2>
        <p>
          Wir behalten uns vor, diese Nutzungsbedingungen bei Bedarf
          anzupassen, etwa wenn neue Funktionen (z.B. Bezahlfunktionen)
          hinzukommen. Die jeweils aktuelle Version ist stets über diese
          Seite abrufbar.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Anwendbares Recht
        </h2>
        <p>
          Es gilt Schweizer Recht. Gerichtsstand ist, soweit gesetzlich
          zulässig, der Sitz des Anbieters gemäss Impressum.
        </p>
      </section>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          className="self-start text-sm text-primary hover:underline"
          onClick={() => router.push("/datenschutz")}
        >
          Zur Datenschutzerklärung
        </button>
        <button
          type="button"
          className="self-start text-sm text-primary hover:underline"
          onClick={() => router.push("/impressum")}
        >
          Zum Impressum
        </button>
      </div>
    </LegalPageLayout>
  );
}

export default AgbPage;
