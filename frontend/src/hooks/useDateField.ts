import { useRef, useState } from "react";
import { useField } from "formik";
import { toDateOnlyString } from "@/utils/formatDate";

function useDateField(name: string) {
  const [field, meta, helpers] = useField(name);
  const { setValue, setTouched } = helpers;

  const [open, setOpen] = useState(false);
  const hasOpenedRef = useRef(false);

  const dateValue = field.value
    ? new Date(`${field.value}T00:00:00`)
    : undefined;
  const showError = meta.touched && !!meta.error;
  const errorMessage = meta.error;

  const handleSelect = (date: Date | undefined) => {
    setValue(date ? toDateOnlyString(date) : date);
    setTouched(true, true); // markiert Feld als "touched", triggert Yup-Validierung
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      hasOpenedRef.current = true;
      return;
    }

    // Nur als "touched" markieren, wenn das Popover tatsächlich vom Nutzer
    // geöffnet wurde. Manche Popover-Implementierungen feuern onOpenChange(false)
    // bereits beim initialen Mount - das würde das Feld sonst sofort fälschlich
    // rot färben, bevor der Nutzer überhaupt interagiert hat.
    if (hasOpenedRef.current) {
      setTouched(true, true);
    }
  };

  return {
    dateValue,
    showError,
    errorMessage,
    open,
    handleSelect,
    handleOpenChange,
  };
}

export default useDateField;
