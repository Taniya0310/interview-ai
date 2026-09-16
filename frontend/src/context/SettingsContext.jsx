import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { authenticatedFetch } from "../services/authApi";

const SettingsContext = createContext(null);

const defaultSettings = {
  minimum_passing_score: 60,
  follow_up_question_limit: 2,
  speech_speed: 1,
  speech_pitch: 1,
  speech_volume: 1,
  tts_chunk_size: 180,
  silence_timeout_ms: 3000,
  interview_duration_minutes: 30,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] =
    useState(defaultSettings);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const data = await authenticatedFetch(
          "/settings"
        );

        if (mounted) {
          setSettings({
            ...defaultSettings,
            ...data,
          });
        }
      } catch (error) {
        console.error(
          "Failed to load settings:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider"
    );
  }

  return context;
}