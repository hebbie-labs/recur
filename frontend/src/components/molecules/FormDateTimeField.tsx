import { useRef, useState, type ChangeEvent } from "react";
import { useField } from "formik";
import { CalendarIcon, X } from "lucide-react";
import { de } from "date-fns/locale";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toDateOnlyString } from "@/utils/formatDate";

type FormDateTimeFieldProps = {
  label: string;
};

/**
 * Kombiniert startDate + startTimeOfDay in einer einzigen Kontrolle statt
 * zwei separaten Feldern - wer eines der beiden setzt, bekommt für das
 * andere automatisch einen sinnvollen Wert (heute / 09:00), statt eine
 * "beides oder nichts"-Fehlermeldung zu sehen.
 */
function FormDateTimeField({ label }: FormDateTimeFieldProps) {
  const [dateField, dateMeta, dateHelpers] = useField<string>("startDate");
  const [timeField, timeMeta, timeHelpers] = useField<string>("startTimeOfDay");

  const [open, setOpen] = useState(false);
  const hasOpenedRef = useRef(false);

  const dateValue = dateField.value
    ? new Date(`${dateField.value}T00:00:00`)
    : undefined;

  const showError =
    (dateMeta.touched && !!dateMeta.error) || (timeMeta.touched && !!timeMeta.error);
  const errorMessage = dateMeta.error ?? timeMeta.error;

  const handleSelectDate = (date: Date | undefined) => {
    dateHelpers.setValue(date ? toDateOnlyString(date) : "");
    dateHelpers.setTouched(true, true);
    if (date && !timeField.value) {
      timeHelpers.setValue("09:00");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      hasOpenedRef.current = true;
      return;
    }
    if (hasOpenedRef.current) {
      dateHelpers.setTouched(true, true);
    }
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    timeHelpers.setValue(value);
    if (value && !dateField.value) {
      dateHelpers.setValue(toDateOnlyString(new Date()));
    }
  };

  const handleClear = () => {
    dateHelpers.setValue("");
    timeHelpers.setValue("");
  };

  return (
    <Field data-invalid={showError ? "true" : "false"}>
      <FieldLabel className="mt-3">{label}</FieldLabel>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-invalid={showError}
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground",
                  showError && "border-destructive focus-visible:ring-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? dateValue.toLocaleDateString("de-DE") : "Datum auswählen"}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleSelectDate}
              locale={de}
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={timeField.value ?? ""}
          onChange={handleTimeChange}
          onBlur={() => timeHelpers.setTouched(true, true)}
          aria-invalid={showError}
          className={cn(
            "w-28",
            showError && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {(dateField.value || timeField.value) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            aria-label="Start zurücksetzen"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {showError && (
        <FieldError className="text-sm text-destructive">
          {errorMessage}
        </FieldError>
      )}
    </Field>
  );
}

export default FormDateTimeField;
