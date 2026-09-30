import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ERROR_OPTIONS, DEFAULT_ERROR_OPTION } from "@/constants/errorOptions";
import { cn } from "@/lib/utils";

type ErrorPageProps = {
  resetErrorBoundary?: () => void;
  errorCode?: number;
  errorMessage?: string;
  buttonText?: string;
  /** Standalone-Seite (füllt den Viewport) vs. innerhalb eines Layouts eingebettet. Default: true. */
  fullScreen?: boolean;
};

function ErrorPage({
  resetErrorBoundary,
  errorCode,
  errorMessage,
  buttonText,
  fullScreen = true,
}: ErrorPageProps) {
  const { icon: Icon, message } =
    ERROR_OPTIONS[errorCode ?? 500] ?? DEFAULT_ERROR_OPTION;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6 bg-background px-4 py-8",
        fullScreen ? "min-h-svh" : "min-h-[50vh]",
      )}
    >
      <Card className="w-full max-w-sm border-none shadow-lg">
        <CardHeader className="flex flex-col items-center gap-3 text-center pb-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <Icon className="size-7 text-destructive" />
          </div>
          <CardTitle className="text-6xl font-extrabold tracking-tight">
            {errorCode || "500"}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {errorMessage || message}
          </CardDescription>
        </CardHeader>
        {resetErrorBoundary && (
          <CardFooter className="flex flex-col justify-center pt-4">
            <Button
              className="w-full font-semibold"
              onClick={resetErrorBoundary}
            >
              {buttonText || "Erneut versuchen"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default ErrorPage;
