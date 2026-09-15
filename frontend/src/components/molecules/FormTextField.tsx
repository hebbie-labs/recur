import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type FormTextFieldProps = {
  name: string;
  label: string;
  value: string | number | null;
  className?: string;
  error?: boolean;
  helperText?: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  endAdornment?: ReactNode;
};

function FormTextField({
  name,
  label,
  value,
  error,
  className,
  helperText,
  type = "text",
  required,
  autoFocus,
  onChange,
  onBlur,
  endAdornment,
}: FormTextFieldProps) {
  return (
    <Field data-invalid={error ? "true" : "false"}>
      <FieldLabel className="mt-3" htmlFor={name}>
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={name}
          name={name}
          placeholder={label}
          type={type}
          autoFocus={autoFocus}
          onChange={onChange}
          onBlur={onBlur}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            endAdornment && "pr-10",
            className
          )}
          value={value ?? ""}
          aria-invalid={error ? "true" : "false"}
          required={required}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <FieldError className="text-sm text-destructive">
          {helperText}
        </FieldError>
      )}
    </Field>
  );
}

export default FormTextField;
