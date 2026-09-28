import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FormTimeFieldProps = {
  name: string;
  label: string;
  value: string | number | null;
  className?: string;
  error?: boolean;
  helperText?: string;
  type?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

function FormTimeField({
  name,
  label,
  value,
  error,
  className,
  helperText,
  type = "time",
  required,
  onChange,
  onBlur,
}: FormTimeFieldProps) {
  return (
    <Field data-invalid={error ? "true" : "false"}>
      <FieldLabel className="mt-3" htmlFor={name}>
        {label}
      </FieldLabel>
      <Input
        id={name}
        name={name}
        placeholder={label}
        type={type}
        onChange={onChange}
        onBlur={onBlur}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        value={value ?? ""}
        aria-invalid={error ? "true" : "false"}
        required={required}
      />
      {error && (
        <FieldError className="text-sm text-destructive">
          {helperText}
        </FieldError>
      )}
    </Field>
  );
}

export default FormTimeField;
