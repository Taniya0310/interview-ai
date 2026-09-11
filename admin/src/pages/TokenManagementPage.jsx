import { useEffect, useState } from "react";
import {
  getTokenUsageLogs,
  getTokenUsageSummary,
} from "../services/tokenUsageService";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRequestType(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function TokenManagementPage() {
  const [summary, setSummary] = useState({});
  const [logs, setLogs] = useState([]);

  const [filters, setFilters] = useState({
    status: "",
    requestType: "",
    interviewId: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsage() {
      try {
        setLoading(true);
        setError("");

        const [summaryResponse, logsResponse] =
          await Promise.all([
            getTokenUsageSummary(filters),
            getTokenUsageLogs(filters),
          ]);

        setSummary(summaryResponse.summary || {});
        setLogs(logsResponse.logs || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadUsage();
  }, [
    filters.status,
    filters.requestType,
    filters.interviewId,
  ]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>Gemini monitoring</p>
          <h1>Token Management</h1>
          <span>
            Monitor token consumption per request and interview
          </span>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="analytics-cards token-summary-cards">
        <SummaryCard
          label="Total requests"
          value={formatNumber(summary.total_requests)}
        />

        <SummaryCard
          label="Prompt tokens"
          value={formatNumber(summary.prompt_tokens)}
        />

        <SummaryCard
          label="Output tokens"
          value={formatNumber(summary.output_tokens)}
        />

        <SummaryCard
          label="Total tokens"
          value={formatNumber(summary.total_tokens)}
        />

        <SummaryCard
          label="Estimated cost"
          value={`$${Number(
            summary.estimated_cost || 0,
          ).toFixed(4)}`}
        />

        <SummaryCard
          label="Failed requests"
          value={formatNumber(summary.failed_requests)}
          tone="failed"
        />
      </div>

      <div className="token-filters">
        <input
          type="text"
          placeholder="Search interview ID"
          value={filters.interviewId}
          onChange={(event) =>
            updateFilter(
              "interviewId",
              event.target.value,
            )
          }
        />

        <select
          value={filters.requestType}
          onChange={(event) =>
            updateFilter(
              "requestType",
              event.target.value,
            )
          }
        >
          <option value="">All request types</option>
          <option value="transcription">
            Transcription
          </option>
          <option value="audio_analysis">
            Audio analysis
          </option>
          <option value="video_analysis">
            Video analysis
          </option>
          <option value="answer_analysis">
            Answer analysis
          </option>
          <option value="follow_up_generation">
            Follow-up generation
          </option>
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            updateFilter("status", event.target.value)
          }
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <p>Loading token usage...</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Interview</th>
                <th>User</th>
                <th>Request type</th>
                <th>Model</th>
                <th>Input tokens</th>
                <th>Output tokens</th>
                <th>Total tokens</th>
                <th>Latency</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="10">
                    No token usage found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.interview_id || "—"}</td>
                    <td>{log.user_id || "—"}</td>
                    <td>
                      {formatRequestType(
                        log.request_type,
                      )}
                    </td>
                    <td>{log.model || "—"}</td>
                    <td>
                      {formatNumber(log.prompt_tokens)}
                    </td>
                    <td>
                      {formatNumber(log.output_tokens)}
                    </td>
                    <td>
                      {formatNumber(log.total_tokens)}
                    </td>
                    <td>
                      {log.latency_ms
                        ? `${log.latency_ms} ms`
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${log.status}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value, tone = "" }) {
  return (
    <div className={`analytics-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}