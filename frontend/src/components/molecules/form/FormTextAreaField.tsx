import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormTextAreaFieldProps = {
  name: string;
  label: string;
  value: string;
  className?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
};

function FormTextAreaField({
  name,
  label,
  value,
  error,
  className,
  helperText,
  required,
  onChange,
  onBlur,
}: FormTextAreaFieldProps) {
  return (
    <Field data-invalid={error ? "true" : "false"}>
      <FieldLabel className="mt-3" htmlFor={name}>
        {label}
      </FieldLabel>
      <Textarea
        id={name}
        name={name}
        placeholder={label}
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

export default FormTextAreaField;
