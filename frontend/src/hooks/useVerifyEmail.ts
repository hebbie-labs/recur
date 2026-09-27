import { useSearchParams } from "next/navigation";

export type VerifyEmailStatus = "verified" | "expired" | "invalid";

function useVerifyEmail() {
    const searchParams = useSearchParams();
    const status = (searchParams.get("status") as VerifyEmailStatus | null) ?? "invalid";

    return { status };
}

export { useVerifyEmail };
