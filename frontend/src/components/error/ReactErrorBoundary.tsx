import ErrorPage from "@/components/pages/ErrorPage";
import InlineErrorFallback from "@/components/error/InlineErrorFallback";
import { ErrorBoundary, getErrorMessage } from "react-error-boundary";
import { type ReactNode } from "react";

type ReactErrorBoundaryProps = {
    variant?: "page" | "inline";
    errorCode?: number;
    errorMessage?: string;
    className?: string;
    /** Nur relevant für variant="page": ist die ErrorPage eine eigenständige Route oder innerhalb eines Layouts eingebettet? Default: true. */
    fullScreen?: boolean;
    children?: ReactNode;
};

function ReactErrorBoundary({
    variant = "page",
    errorCode,
    errorMessage,
    className,
    fullScreen = true,
    children,
}: ReactErrorBoundaryProps) {
    return (
        <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) =>
                variant === "inline" ? (
                    <InlineErrorFallback
                        resetErrorBoundary={resetErrorBoundary}
                        errorMessage={errorMessage ?? getErrorMessage(error)}
                        className={className}
                    />
                ) : (
                    <ErrorPage
                        resetErrorBoundary={resetErrorBoundary}
                        errorCode={errorCode}
                        errorMessage={errorMessage ?? getErrorMessage(error)}
                        fullScreen={fullScreen}
                    />
                )
            }
            onError={(error, errorInfo) => {
                console.error(error);
                console.error(errorInfo);
            }}
        >
            {children}
        </ErrorBoundary>
    );
}

export default ReactErrorBoundary;