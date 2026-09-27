import type { PrivacySettings } from "@/types/privacy";
import { useEffect, useState } from "react";
import { getPrivacySettings } from "@/services/privacyService";

function usePrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const current = await getPrivacySettings();
        setSettings(current);
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return { settings };
}

export default usePrivacySettings;
