import { useState } from "react";
import AppDialog from "@/components/molecules/dialog/AppDialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GroupMember } from "@/services/groupService";

type SelectSuccessorDialogProps = {
  open: boolean;
  onClose: () => void;
  members: GroupMember[];
  title: string;
  description?: string;
  submitLabel?: string;
  onConfirm: (memberId: string) => Promise<void> | void;
};

/** Dialog zum Auswählen eines Gruppenmitglieds - für Admin-Übertragung und den erzwungenen Nachfolger-Flow beim Verlassen. */
function SelectSuccessorDialog({
  open,
  onClose,
  members,
  title,
  description,
  submitLabel = "Bestätigen",
  onConfirm,
}: SelectSuccessorDialogProps) {
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  const items = members.map((m) => ({
    value: m.id,
    label: `${m.firstName} ${m.lastName}`,
  }));

  const handleSubmit = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await onConfirm(selectedId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      onSubmit={handleSubmit}
      loading={loading}
      submitDisabled={!selectedId || loading}
      submitLabel={submitLabel}
    >
      {description && (
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      )}
      <Select
        items={items}
        value={selectedId}
        onValueChange={(value) => setSelectedId(value ?? "")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Mitglied auswählen" />
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
    </AppDialog>
  );
}

export default SelectSuccessorDialog;
