import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import ImportQuartalsplanDialog from "@/components/organisms/dialogs/ImportQuartalsplanDialog";

type ImportQuartalsplanContextValue = {
  openImportQuartalsplan: () => void;
};

const ImportQuartalsplanContext =
  createContext<ImportQuartalsplanContextValue | null>(null);

export function ImportQuartalsplanProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [showImportDialog, setShowImportDialog] = useState(false);

  const openImportQuartalsplan = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  function handleClose() {
    setShowImportDialog(false);
  }

  return (
    <ImportQuartalsplanContext.Provider value={{ openImportQuartalsplan }}>
      {children}
      {showImportDialog && (
        <ImportQuartalsplanDialog onClose={handleClose} />
      )}
    </ImportQuartalsplanContext.Provider>
  );
}

export function useImportQuartalsplan() {
  const ctx = useContext(ImportQuartalsplanContext);
  if (!ctx) {
    throw new Error(
      "useImportQuartalsplan muss innerhalb von ImportQuartalsplanProvider verwendet werden"
    );
  }
  return ctx;
}
