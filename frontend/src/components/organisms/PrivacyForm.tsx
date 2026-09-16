import {
  Field,
  FieldContent,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { ProfileVisibility, type PrivacySettings } from "@/types/privacy";

type PrivacyFormProps = {
  values: PrivacySettings;
  disabled?: boolean;
  onFieldChange: (update: Partial<PrivacySettings>) => void;
};

function PrivacyForm({ values, disabled, onFieldChange }: PrivacyFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Für Gruppenmitglieder sichtbar</FieldTitle>
          <FieldDescription>
            Steuert, ob dein Name und Profilbild für andere Mitglieder in
            geteilten Gruppen sichtbar sind.
          </FieldDescription>
        </FieldContent>
        <Switch
          disabled={disabled}
          checked={values.profileVisibility === ProfileVisibility.VISIBLE}
          onCheckedChange={(checked) =>
            onFieldChange({
              profileVisibility: checked
                ? ProfileVisibility.VISIBLE
                : ProfileVisibility.HIDDEN,
            })
          }
        />
      </Field>
      <FieldSeparator />
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Nutzungsdaten teilen</FieldTitle>
          <FieldDescription>
            Reserviert deine Präferenz für anonymisierte Nutzungsdaten zur
            Verbesserung der App. Diese Funktion ist aktuell noch nicht
            aktiv, wir erfassen derzeit keine solchen Daten.
          </FieldDescription>
        </FieldContent>
        <Switch
          disabled={disabled}
          checked={values.analyticsOptIn}
          onCheckedChange={(checked) =>
            onFieldChange({ analyticsOptIn: checked })
          }
        />
      </Field>
    </div>
  );
}

export default PrivacyForm;
