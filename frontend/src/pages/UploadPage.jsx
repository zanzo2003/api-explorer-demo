import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ingestApi } from "../api/client";

const SAMPLE_URLS = [
  { label: "Petstore (OpenAPI 3)", url: "https://petstore3.swagger.io/api/v3/openapi.json" },
  { label: "Petstore (Swagger 2)", url: "https://petstore.swagger.io/v2/swagger.json" },
  { label: "GitHub REST API", url: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json" },
];

export default function UploadPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await ingestApi(url.trim());
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Add an API</h1>
      <p className="page-subtitle">
        Paste an OpenAPI / Swagger JSON URL or an HTML documentation URL.
        The system will parse, tag, and store all endpoints automatically.
      </p>

      {/* Form */}
      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: "0.85rem", fontWeight: 500, display: "block", marginBottom: "0.5rem" }}>
            API Spec URL
          </label>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !url.trim()}
            >
              {loading ? "⏳ Processing…" : "Ingest"}
            </button>
          </div>
        </form>

        {/* Sample URLs */}
        <div style={{ marginTop: "1rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text3)", marginBottom: "0.4rem" }}>
            Try a sample:
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {SAMPLE_URLS.map((s) => (
              <button
                key={s.url}
                className="btn btn-secondary btn-sm"
                onClick={() => setUrl(s.url)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ maxWidth: 640, marginTop: "1rem" }}>
          ❌ {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="card" style={{ maxWidth: 640, marginTop: "1rem" }}>
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            ✅ {result.message}
          </div>
          <div style={{ display: "flex", gap: "2rem", fontSize: "0.875rem" }}>
            <Stat label="API" value={result.data.name} />
            <Stat label="Endpoints" value={result.data.endpointCount} />
            <Stat label="Status" value={result.data.isNew ? "New" : "Updated"} />
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/apis/${result.data.apiId}`)}
            >
              View API →
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setResult(null); setUrl(""); }}
            >
              Add another
            </button>
          </div>
        </div>
      )}

      {/* Pipeline info */}
      <div style={{ marginTop: "2.5rem", maxWidth: 640 }}>
        <h2 className="section-title">How it works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            ["1️⃣", "Detect", "Identifies whether the URL is an OpenAPI/Swagger spec or HTML docs"],
            ["2️⃣", "Parse", "Extracts all endpoints – path, method, params, body, security"],
            ["3️⃣", "Tag", "Auto-categorises the API using AI or keyword rules"],
            ["4️⃣", "Store", "Persists to MongoDB for discovery and browsing"],
            ["5️⃣", "Export", "Generates API Dash-compatible request templates on demand"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem" }}>{icon}</span>
              <div>
                <strong style={{ fontSize: "0.875rem" }}>{title}</strong>
                <p style={{ color: "var(--text2)", fontSize: "0.8rem", margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ color: "var(--text3)", fontSize: "0.7rem", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
