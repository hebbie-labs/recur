import {
  Field,
  FieldContent,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { NotificationSettings } from "@/types/notifications";

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
            Reserviert deine Präferenz für Benachrichtigungen per E-Mail.
            Diese Funktion ist aktuell noch nicht aktiv, wir versenden
            derzeit keine E-Mails zu deinen Aufgaben.
          </FieldDescription>
        </FieldContent>
        <Switch
          disabled={disabled}
          checked={values.emailEnabled}
          onCheckedChange={(checked) => onFieldChange({ emailEnabled: checked })}
        />
      </Field>
      <FieldSeparator />
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Push-Benachrichtigungen</FieldTitle>
          <FieldDescription>
            Reserviert deine Präferenz für Push-Benachrichtigungen im
            Browser oder auf dem Gerät. Diese Funktion ist aktuell noch
            nicht aktiv, wir versenden derzeit keine Push-Benachrichtigungen.
          </FieldDescription>
        </FieldContent>
        <Switch
          disabled={disabled}
          checked={values.pushEnabled}
          onCheckedChange={(checked) => onFieldChange({ pushEnabled: checked })}
        />
      </Field>
    </div>
  );
}

export default NotificationForm;
