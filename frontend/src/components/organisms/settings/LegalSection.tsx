import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LegalFooterLinks from "@/components/molecules/LegalFooterLinks";
import GithubIcon from "@/components/atoms/GithubIcon";
import { GITHUB_REPO_URL } from "@/constants/links";

function LegalSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rechtliches</CardTitle>
        <CardDescription>
          Impressum, Datenschutzerklärung und AGB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LegalFooterLinks />
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          <GithubIcon className="h-3.5 w-3.5" />
          GitHub
        </a>
      </CardContent>
    </Card>
  );
}

export default LegalSection;
