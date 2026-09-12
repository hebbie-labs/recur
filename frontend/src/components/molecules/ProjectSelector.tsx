import { useId, useMemo } from "react";
import { useField } from "formik";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { useGroupsContext } from "@/contexts/GroupsContext";

const PERSONAL_VALUE = "personal";

type ProjectSelectorProps = {
  className?: string;
  disabled?: boolean;
};

/**
 * Lässt einen Task optional einem Gruppen-Projekt zuordnen (Opt-in, Default
 * bleibt "persönlich"). Nur nicht-archivierte Projekte sind wählbar.
 */
function ProjectSelector({ className, disabled }: ProjectSelectorProps) {
  const uid = useId();
  const fieldId = `project-${uid}`;
  const { groups, projectsByGroupId } = useGroupsContext();

  const [field, , helpers] = useField<string>("projectId");

  const items = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: PERSONAL_VALUE, label: "Persönlich (kein Projekt)" },
    ];

    groups.forEach((group) => {
      (projectsByGroupId[group.id] ?? [])
        .filter((project) => !project.isArchived)
        .forEach((project) => {
          options.push({
            value: project.id,
            label: `${group.name} / ${project.name}`,
          });
        });
    });

    return options;
  }, [groups, projectsByGroupId]);

  // Sobald kein Projekt zugewiesen ist, meldet das Backend `projectId`
  // schlicht als "" - dafür steht in der UI der Platzhalterwert "personal".
  const selectValue = field.value || PERSONAL_VALUE;

  return (
    <Field className={className}>
      <FieldLabel className="mt-3" htmlFor={fieldId}>
        Projekt
      </FieldLabel>
      <Select
        items={items}
        value={selectValue}
        onValueChange={(value) => helpers.setValue(value === PERSONAL_VALUE ? "" : (value ?? ""))}
        disabled={disabled}
      >
        <SelectTrigger id={fieldId}>
          <SelectValue placeholder="Persönlich (kein Projekt)" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export default ProjectSelector;
