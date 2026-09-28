import { CalendarIcon } from "lucide-react";
import { de } from "date-fns/locale";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import useDateField from "@/hooks/useDateField";

type FormDateFieldProps = {
  name: string;
  label: string;
};

function FormDateField({ name, label }: FormDateFieldProps) {
  const { dateValue, showError, errorMessage, open, handleSelect, handleOpenChange } =
    useDateField(name);

  return (
    <Field data-invalid={showError ? "true" : "false"}>
      <FieldLabel className="mt-3" htmlFor={name}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              id={name}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={showError}
              className={cn(
                "w-full justify-start text-left font-normal",
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
          <Calendar mode="single" selected={dateValue} onSelect={handleSelect} locale={de} />
        </PopoverContent>
      </Popover>
      <FieldError className="text-sm text-destructive">
        {showError && errorMessage}
      </FieldError>
    </Field>
  );
}

export default FormDateField;