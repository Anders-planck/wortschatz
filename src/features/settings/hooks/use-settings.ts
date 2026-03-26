import { useCallback, useEffect, useState } from "react";
import {
  getAppSettings,
  updateSetting as updateSettingDb,
} from "../services/settings-repository";
import { DEFAULT_SETTINGS, type AppSettings } from "../types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAppSettings()
      .then(setSettings)
      .finally(() => setIsLoading(false));
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      await updateSettingDb(key, value);
    },
    [],
  );

  return { settings, updateSetting, isLoading };
}
