import { Formik } from "formik";
import { useState } from "react";
import * as yup from "yup";
import type { UserResponse as User } from "../../types/auth";
import { patchUser } from "../../services/authService";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/atoms/LoadingButton";
import AccountForm from "../organisms/AccountForm";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "../ui/spinner";

type AccountPageProps = {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  onClose: () => void;
};

const validationSchema = yup.object().shape({
  firstName: yup.string().required("Vorname ist erforderlich"),
  lastName: yup.string().required("Nachname ist erforderlich"),
  email: yup
    .string()
    .email("Ungültige E-Mail-Adresse")
    .required("E-Mail ist erforderlich"),
  avatarUrl: yup.string().url("Ungültige URL").nullable().notRequired(),
});

function AccountPage({
  firstName,
  lastName,
  email,
  avatarUrl,
  onClose,
}: AccountPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      await patchUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        avatarUrl: values.avatarUrl,
      } as User);
      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Bearbeiten des Accounts"
      );
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <Formik<Partial<User>>
        initialValues={{
          firstName: firstName,
          lastName: lastName,
          email: email,
          avatarUrl: avatarUrl,
        }}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
        }) => (
          <>
            <AccountForm
              onSubmit={handleSubmit}
              values={values}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              handleBlur={handleBlur}
              className="flex flex-col gap-2"
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Zurück
              </Button>
              <LoadingButton
                type="submit"
                onClick={() => handleSubmit()}
                loading={loading}
              >
                Speichern
              </LoadingButton>
            </div>
          </>
        )}
      </Formik>
    </div>
  );
}

function AccountPageWrapper() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <AccountPage
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      avatarUrl={user.avatarUrl}
      onClose={() => router.back()}
    />
  );
}

export default AccountPageWrapper;
