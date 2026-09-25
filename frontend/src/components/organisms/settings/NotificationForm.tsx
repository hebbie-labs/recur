import {
  Field,
  FieldContent,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NotificationSettings, ReminderLeadTime } from "@/types/notifications";
import { LEAD_TIME_OPTIONS } from "@/constants/taskOptions";

type NotificationFormProps = {
  values: NotificationSettings;
  disabled?: boolean;
  onFieldChange: (update: Partial<NotificationSettings>) => void;
};

function NotificationForm({ values, disabled, onFieldChange }: NotificationFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>E-Mail-Benachrichtigungen</FieldTitle>
          <FieldDescription>
            Aktuell nicht verfügbar: unser E-Mail-Versand wird derzeit von
            manchen Mail-Providern blockiert, daher ist der Versand
            serverseitig deaktiviert.
          </FieldDescription>
        </FieldContent>
        <Switch disabled checked={false} />
      </Field>
      <FieldSeparator />
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Push-Benachrichtigungen</FieldTitle>
          <FieldDescription>
            Erinnerungen und Überfällig-Hinweise als Push-Benachrichtigung im
            Browser. Beim Aktivieren fragen wir dich nach der
            Benachrichtigungs-Berechtigung.
          </FieldDescription>
        </FieldContent>
        <Switch
          disabled={disabled}
          checked={values.pushEnabled}
          onCheckedChange={(checked) => onFieldChange({ pushEnabled: checked })}
        />
      </Field>
      <FieldSeparator />
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Erinnerungs-Vorlauf</FieldTitle>
          <FieldDescription>
            Wie lange vor dem Fälligkeitsdatum einer Aufgabe du erinnert
            werden möchtest.
          </FieldDescription>
        </FieldContent>
        <Select
          value={values.reminderLeadTime}
          onValueChange={(value) =>
            onFieldChange({ reminderLeadTime: value as ReminderLeadTime })
          }
        >
          <SelectTrigger disabled={disabled} className="w-[200px] shrink-0">
            <SelectValue>
              {(value: ReminderLeadTime) =>
                LEAD_TIME_OPTIONS.find((option) => option.value === value)?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-[200px] min-w-0">
            {LEAD_TIME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

export default NotificationForm;
