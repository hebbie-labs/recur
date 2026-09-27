import type { FormEvent, ChangeEvent, FocusEvent } from "react";
import { Form as FormikForm } from "formik";
import type { FormikErrors, FormikTouched } from "formik";
import type { UserResponse as User } from "@/types/auth";
import FormTextField from "@/components/molecules/form/FormTextField";

type AccountFormProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: Partial<User>;
  errors: FormikErrors<Partial<User>>;
  touched: FormikTouched<Partial<User>>;
  className?: string;
  disabled?: boolean;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleBlur: (
    event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

function AccountForm({
  onSubmit,
  values,
  handleChange,
  handleBlur,
  errors,
  touched,
  className,
  disabled,
}: AccountFormProps) {
  return (
    <FormikForm onSubmit={onSubmit} className={className}>
      <FormTextField
        name="firstName"
        label="Vorname"
        value={values.firstName ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!touched.firstName && !!errors.firstName}
        helperText={touched.firstName ? errors.firstName : undefined}
        disabled={disabled}
      />
      <FormTextField
        name="lastName"
        label="Nachname"
        value={values.lastName ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!touched.lastName && !!errors.lastName}
        helperText={touched.lastName ? errors.lastName : undefined}
        disabled={disabled}
      />
      <FormTextField
        name="email"
        label="E-Mail"
        type="email"
        value={values.email ?? ""}
        error={!!touched.email && !!errors.email}
        helperText={touched.email ? errors.email : undefined}
        disabled
      />
      <FormTextField
        name="avatarUrl"
        label="Avatar-URL"
        value={values.avatarUrl ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!touched.avatarUrl && !!errors.avatarUrl}
        helperText={touched.avatarUrl ? errors.avatarUrl : undefined}
        disabled={disabled}
      />
    </FormikForm>
  );
}

export default AccountForm;
