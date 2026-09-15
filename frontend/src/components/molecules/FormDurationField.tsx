import { useMemo, useState, type ChangeEvent } from "react";
import { useField } from "formik";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DURATION_OPTIONS } from "@/constants/taskOptions";

/**
 * Dauer-Auswahl über anklickbare Presets statt manueller Zahleneingabe -
 * der häufige Fall (15/30/45/60/90 min) braucht so nur einen Klick. "Eigene"
 * schaltet auf ein Zahlenfeld für abweichende Werte um. Bleibt wie bisher
 * optional: erneutes Klicken des aktiven Chips setzt den Wert zurück auf null.
 */
function FormDurationField() {
  const [field, meta, helpers] = useField<number | null>("durationMinutes");
  const { setValue, setTouched } = helpers;

  const isPresetValue = useMemo(
    () => DURATION_OPTIONS.some((option) => option.value === field.value),
    [field.value]
  );
  const [showCustom, setShowCustom] = useState(() => !!field.value && !isPresetValue);

  const error = meta.touched && !!meta.error;
  const helperText = meta.touched ? meta.error : undefined;

  const handleChipClick = (value: number) => {
    setShowCustom(false);
    setValue(field.value === value ? null : value);
    setTouched(true, false);
  };

  const handleCustomToggle = () => {
    setShowCustom((prev) => {
      if (prev) setValue(null);
      return !prev;
    });
  };

  const handleCustomChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setValue(raw === "" ? null : Number(raw));
  };

  return (
    <Field data-invalid={error ? "true" : "false"}>
      <FieldLabel className="mt-3">Dauer</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChipClick(option.value)}
            aria-pressed={!showCustom && field.value === option.value}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !showCustom && field.value === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustomToggle}
          aria-pressed={showCustom}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            showCustom
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Eigene
        </button>
      </div>
      {showCustom && (
        <Input
          type="number"
          min={1}
          placeholder="Minuten"
          value={field.value ?? ""}
          onChange={handleCustomChange}
          onBlur={() => setTouched(true, true)}
          aria-invalid={error}
          className={cn(
            "mt-1.5 max-w-32",
            error && "border-destructive focus-visible:ring-destructive"
          )}
        />
      )}
      {error && (
        <FieldError className="text-sm text-destructive">
          {helperText}
        </FieldError>
      )}
    </Field>
  );
}

export default FormDurationField;
