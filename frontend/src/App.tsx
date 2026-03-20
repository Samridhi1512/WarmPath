import { useState } from "react";
import { analyzeConnections } from "./api";
import {
  ErrorAlert,
  LoadingIndicator,
  ParsingSummaryBar,
  PreferencesForm,
  ResultsList,
} from "./components";
import type { AnalyzeResponse, Preferences } from "./types";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [lastPrefs, setLastPrefs] = useState<Preferences | null>(null);

  const handleSubmit = async (prefs: Preferences, file: File) => {
    setLoading(true);
    setError(null);
    setData(null);
    setLastPrefs(prefs);

    try {
      const result = await analyzeConnections(file, prefs);
      setData(result);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      ) {
        setError(
          (err as { response: { data: { detail: string } } }).response.data.detail
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please check that the backend is running and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>WarmPath</h1>
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: 24 }}>
        Find your warm paths — upload your LinkedIn connections and discover your best referral opportunities.
      </p>

      <PreferencesForm onSubmit={handleSubmit} loading={loading} />

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {loading && <LoadingIndicator />}

      {data && !loading && (
        <>
          <ParsingSummaryBar summary={data.parsing_summary} />
          <ResultsList results={data.results} preferences={lastPrefs} />
        </>
      )}
    </div>
  );
}
