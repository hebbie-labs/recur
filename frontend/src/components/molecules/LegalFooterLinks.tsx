import { useRouter } from "next/navigation";
import { GITHUB_REPO_URL } from "@/constants/links";

function LegalFooterLinks() {
  const router = useRouter();

  return (
    <div className="mt-4 flex justify-center gap-3 text-xs text-muted-foreground">
      <button
        type="button"
        className="hover:text-foreground hover:underline"
        onClick={() => router.push("/impressum")}
      >
        Impressum
      </button>
      <span aria-hidden>•</span>
      <button
        type="button"
        className="hover:text-foreground hover:underline"
        onClick={() => router.push("/datenschutz")}
      >
        Datenschutzerklärung
      </button>
      <span aria-hidden>•</span>
      <button
        type="button"
        className="hover:text-foreground hover:underline"
        onClick={() => router.push("/agb")}
      >
        AGB
      </button>
      <span aria-hidden>•</span>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground hover:underline"
      >
        GitHub
      </a>
    </div>
  );
}

export default LegalFooterLinks;
