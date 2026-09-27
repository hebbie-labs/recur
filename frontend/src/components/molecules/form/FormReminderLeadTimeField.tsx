import { useId } from "react";
import { useField } from "formik";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { LEAD_TIME_OPTIONS } from "@/constants/taskOptions";
import type { ReminderLeadTime } from "@/types/notifications";

const DEFAULT_LABEL = "Standard (aus Einstellungen)";

// Pro-Task-Override des Erinnerungs-Vorlaufs (#102-Follow-up). "" steht für
// "kein Override" (Kontoeinstellung greift) - anders als bei FormSelector
// ist das hier ein echter, auswählbarer Menüpunkt statt eines Platzhalters,
// da der Nutzer explizit zum Standard zurückwechseln können soll.
function FormReminderLeadTimeField() {
  const uid = useId();
  const fieldId = `reminder-lead-time-${uid}`;
  const [field, , helpers] = useField<ReminderLeadTime | "">("reminderLeadTime");

  return (
    <Field>
      <FieldLabel className="mt-3" htmlFor={fieldId}>
        Erinnerungs-Vorlauf
      </FieldLabel>
      <Select
        value={field.value || "DEFAULT"}
        onValueChange={(value) =>
          helpers.setValue(value === "DEFAULT" ? "" : (value as ReminderLeadTime))
        }
      >
        <SelectTrigger id={fieldId}>
          <SelectValue>
            {(value: string) =>
              value === "DEFAULT" || !value
                ? DEFAULT_LABEL
                : LEAD_TIME_OPTIONS.find((option) => option.value === value)?.label
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DEFAULT">{DEFAULT_LABEL}</SelectItem>
          {LEAD_TIME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export default FormReminderLeadTimeField;
