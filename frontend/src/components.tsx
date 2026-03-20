import { useState, useRef } from "react";
import type {
  CompanyResult,
  LLMDetails,
  ParsingSummary as ParsingSummaryType,
  Preferences,
} from "./types";
import { fetchDetails } from "./api";

/* ── Upload Area ── */

export function UploadArea({
  onFileSelect,
}: {
  onFileSelect: (file: File) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor="csv-upload" style={{ fontWeight: 600 }}>
        LinkedIn CSV:{" "}
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
        }}
      />
    </div>
  );
}

/* ── Preferences Form ── */

export function PreferencesForm({
  onSubmit,
  loading,
}: {
  onSubmit: (prefs: Preferences, file: File) => void;
  loading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");
  const [companyType, setCompanyType] = useState<Preferences["company_type"]>("any");

  const canSubmit = !!file && targetRole.trim().length > 0 && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !targetRole.trim()) return;
    onSubmit(
      { target_role: targetRole.trim(), location: location.trim(), company_type: companyType },
      file
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <UploadArea onFileSelect={setFile} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <div>
          <label htmlFor="target-role">Target Role *</label>
          <br />
          <input
            id="target-role"
            type="text"
            placeholder="e.g. software engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            style={{ padding: "6px 10px", width: 220 }}
          />
        </div>
        <div>
          <label htmlFor="location">Location</label>
          <br />
          <input
            id="location"
            type="text"
            placeholder="e.g. Seattle"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ padding: "6px 10px", width: 160 }}
          />
        </div>
        <div>
          <label htmlFor="company-type">Company Type</label>
          <br />
          <select
            id="company-type"
            value={companyType}
            onChange={(e) => setCompanyType(e.target.value as Preferences["company_type"])}
            style={{ padding: "6px 10px" }}
          >
            <option value="any">Any</option>
            <option value="startup">Startup</option>
            <option value="mid-size">Mid-size</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "8px 20px",
            background: canSubmit ? "#2563eb" : "#94a3b8",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}

/* ── Parsing Summary ── */

export function ParsingSummaryBar({ summary }: { summary: ParsingSummaryType }) {
  return (
    <div
      style={{
        background: "#f1f5f9",
        padding: "10px 16px",
        borderRadius: 6,
        marginBottom: 16,
        fontSize: 14,
      }}
    >
      <strong>{summary.total_rows}</strong> rows &middot;{" "}
      <strong>{summary.valid_connections}</strong> valid &middot;{" "}
      <strong>{summary.excluded_rows}</strong> excluded &middot;{" "}
      <strong>{summary.unique_companies}</strong> companies
    </div>
  );
}

/* ── Path Label Badge ── */

const LABEL_COLORS: Record<string, string> = {
  "Warm Path": "#16a34a",
  "Stretch Path": "#ca8a04",
  Explore: "#6b7280",
};

function PathBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        background: LABEL_COLORS[label] ?? "#6b7280",
        color: "#fff",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

/* ── Company Result Card (expandable) ── */

function CompanyResultCard({
  result,
  preferences,
  cachedDetails,
  onCacheDetails,
}: {
  result: CompanyResult;
  preferences: Preferences | null;
  cachedDetails: LLMDetails | undefined;
  onCacheDetails: (key: string, details: LLMDetails) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<LLMDetails | null>(cachedDetails ?? null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const cacheKey = result.contact_url; // URL is unique per LinkedIn profile

  const handleToggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);

    // Use cached details if available
    if (details || cachedDetails) {
      if (cachedDetails && !details) setDetails(cachedDetails);
      return;
    }

    if (!preferences) return;

    setLoadingDetails(true);
    try {
      const d = await fetchDetails(result, preferences);
      setDetails(d);
      onCacheDetails(cacheKey, d);
    } catch {
      setDetails({
        explanation: "Relevance based on your preferences.",
        next_action: "Reach out via LinkedIn message.",
        outreach_draft: `Hi ${result.contact_name}, I noticed we're connected on LinkedIn. Would you be open to a quick chat?`,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCopy = async () => {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details.outreach_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = details.outreach_draft;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 8,
        cursor: "pointer",
      }}
    >
      <div onClick={handleToggle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontSize: 16 }}>{result.company_name}</strong>
            <span style={{ color: "#64748b", marginLeft: 8, fontSize: 13 }}>
              ({result.contact_count} contact{result.contact_count !== 1 ? "s" : ""})
            </span>
            <span style={{ color: "#94a3b8", marginLeft: 6, fontSize: 12 }}>
              {expanded ? "▲" : "▼"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <PathBadge label={result.path_label} />
            <span style={{ fontWeight: 700, fontSize: 18 }}>{result.score}</span>
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 14, color: "#334155" }}>
          <a
            href={result.contact_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb", textDecoration: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            {result.contact_name}
          </a>
          {" — "}
          {result.contact_title}
          {result.contact_email && (
            <span style={{ color: "#64748b", marginLeft: 8 }}>✉ {result.contact_email}</span>
          )}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #e2e8f0",
            fontSize: 14,
          }}
        >
          {loadingDetails ? (
            <p style={{ color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                display: "inline-block", width: 14, height: 14,
                border: "2px solid #e2e8f0", borderTopColor: "#2563eb",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
              }} />
              Generating insights...
            </p>
          ) : details ? (
            <>
              <div style={{ marginBottom: 10 }}>
                <strong>Why relevant:</strong>
                <p style={{ margin: "4px 0", color: "#334155" }}>{details.explanation}</p>
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong>Next action:</strong>
                <p style={{ margin: "4px 0", color: "#334155" }}>{details.next_action}</p>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Outreach draft:</strong>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                    style={{
                      padding: "4px 12px",
                      fontSize: 12,
                      background: copied ? "#16a34a" : "#e2e8f0",
                      color: copied ? "#fff" : "#334155",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "✓ Copied to clipboard" : "📋 Copy"}
                  </button>
                </div>
                <p
                  style={{
                    margin: "4px 0",
                    color: "#334155",
                    background: "#f8fafc",
                    padding: "8px 12px",
                    borderRadius: 4,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {details.outreach_draft}
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Results List ── */

const PAGE_SIZE = 25;

export function ResultsList({
  results,
  preferences,
}: {
  results: CompanyResult[];
  preferences: Preferences | null;
}) {
  const [showCount, setShowCount] = useState(PAGE_SIZE);
  const detailsCacheRef = useRef<Record<string, LLMDetails>>({});

  const handleCacheDetails = (key: string, details: LLMDetails) => {
    detailsCacheRef.current[key] = details;
  };

  if (results.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b" }}>
        <p style={{ fontSize: 16, marginBottom: 4 }}>No matching companies found.</p>
        <p style={{ fontSize: 13 }}>
          All connections were excluded (e.g., missing company info) or none matched your criteria.
          Try a different CSV or adjust your preferences.
        </p>
      </div>
    );
  }

  const visible = results.slice(0, showCount);

  return (
    <div>
      {visible.map((r, i) => {
        const cacheKey = r.contact_url;
        return (
          <CompanyResultCard
            key={`${r.company_name}-${i}`}
            result={r}
            preferences={preferences}
            cachedDetails={detailsCacheRef.current[cacheKey]}
            onCacheDetails={handleCacheDetails}
          />
        );
      })}
      {showCount < results.length && (
        <button
          onClick={() => setShowCount((c) => c + PAGE_SIZE)}
          style={{
            display: "block",
            margin: "12px auto",
            padding: "8px 24px",
            background: "#e2e8f0",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Show More ({results.length - showCount} remaining)
        </button>
      )}
    </div>
  );
}

/* ── Loading Indicator ── */

export function LoadingIndicator() {
  return (
    <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
      <div
        style={{
          display: "inline-block",
          width: 32,
          height: 32,
          border: "3px solid #e2e8f0",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p>Analyzing your network — this may take a moment...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Error Alert ── */

export function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        color: "#991b1b",
        padding: "12px 16px",
        borderRadius: 6,
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        style={{
          background: "none",
          border: "none",
          color: "#991b1b",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ✕
      </button>
    </div>
  );
}
