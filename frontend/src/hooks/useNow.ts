import { useEffect, useState } from "react";

/** Aktuelle Zeit, die sich jede Minute aktualisiert - damit zeitabhängige Anzeigen wie das Overdue-Signal (#153) bei offener Seite von selbst umspringen (z.B. um 0 Uhr). */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

export default useNow;
