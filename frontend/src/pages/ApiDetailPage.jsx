import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchApi, fetchEndpoints } from "../api/client";
import MethodBadge from "../components/MethodBadge";
import TemplateModal from "../components/TemplateModal";

export default function ApiDetailPage() {
  const { id } = useParams();

  const [api, setApi] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [methodFilter, setMethodFilter] = useState("");
  const [searchEp, setSearchEp] = useState("");
  const [page, setPage] = useState(1);

  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showImportAll, setShowImportAll] = useState(false);

  // Load API meta
  useEffect(() => {
    fetchApi(id)
      .then((r) => setApi(r.data))
      .catch((e) => setError(e.response?.data?.message || e.message));
  }, [id]);

  // Load endpoints
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const params = { page, limit: 30 };
    if (methodFilter) params.method = methodFilter;
    if (searchEp) params.q = searchEp;

    fetchEndpoints(id, params)
      .then((r) => {
        setEndpoints(r.data || []);
        setPagination(r.pagination || {});
      })
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id, methodFilter, searchEp, page]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!api) return <div className="spinner" />;

  const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  return (
    <>
      {/* Back */}
      <Link to="/" style={{ color: "var(--text2)", fontSize: "0.85rem" }}>
        ← Back to Explorer
      </Link>

      {/* API Header */}
      <div style={{ marginTop: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <h1 className="page-title" style={{ margin: 0 }}>{api.name}</h1>
          <span className="stats-pill">v{api.version}</span>
          <span className="stats-pill">
            {api.source === "openapi" ? "📄 OpenAPI" : "🌐 HTML"}
          </span>
        </div>

        {api.description && (
          <p className="page-subtitle" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            {api.description}
          </p>
        )}

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <a href={api.baseUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem" }}>
            🔗 {api.baseUrl}
          </a>
          {api.category?.map((c) => (
            <span key={c} className="badge-category">{c}</span>
          ))}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowImportAll(true)}
          >
            ⬇️ Import All Endpoints
          </button>
        </div>
      </div>

      <hr className="divider" />

      {/* Endpoint Filters */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search endpoints…"
          value={searchEp}
          onChange={(e) => { setSearchEp(e.target.value); setPage(1); }}
          style={{ maxWidth: 280 }}
        />
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button
            className={`btn btn-sm ${!methodFilter ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setMethodFilter(""); setPage(1); }}
          >
            All
          </button>
          {METHODS.map((m) => (
            <button
              key={m}
              className={`btn btn-sm ${methodFilter === m ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setMethodFilter(m); setPage(1); }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoint count */}
      {!loading && (
        <p style={{ fontSize: "0.8rem", color: "var(--text2)", marginBottom: "0.75rem" }}>
          {pagination.total ?? endpoints.length} endpoint{(pagination.total ?? endpoints.length) !== 1 ? "s" : ""}
        </p>
      )}

      {/* Endpoints */}
      {loading ? (
        <div className="spinner" />
      ) : endpoints.length === 0 ? (
        <div className="empty-state">No endpoints match your filter.</div>
      ) : (
        endpoints.map((ep) => (
          <EndpointRow
            key={ep._id}
            endpoint={ep}
            onImport={() => setSelectedEndpoint(ep)}
          />
        ))
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      )}

      {/* Template Modal – single endpoint */}
      {selectedEndpoint && (
        <TemplateModal
          endpoint={selectedEndpoint}
          api={api}
          onClose={() => setSelectedEndpoint(null)}
        />
      )}

      {/* Template Modal – import all */}
      {showImportAll && (
        <TemplateModal
          endpoint={null}
          api={api}
          onClose={() => setShowImportAll(false)}
        />
      )}
    </>
  );
}

function EndpointRow({ endpoint, onImport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        className="endpoint-row"
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: "pointer" }}
      >
        <MethodBadge method={endpoint.method} />
        <div style={{ flex: 1 }}>
          <div className="endpoint-path">{endpoint.path}</div>
          {endpoint.summary && (
            <div className="endpoint-summary">{endpoint.summary}</div>
          )}
        </div>
        {endpoint.deprecated && (
          <span style={{ fontSize: "0.7rem", color: "var(--warning)" }}>Deprecated</span>
        )}
        <button
          className="btn btn-secondary btn-sm"
          onClick={(e) => { e.stopPropagation(); onImport(); }}
        >
          ⬇️ Import
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            background: "var(--bg3)",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
            padding: "0.75rem 1rem",
            marginBottom: "0.5rem",
            fontSize: "0.8rem",
          }}
        >
          {endpoint.description && (
            <p style={{ color: "var(--text2)", marginBottom: "0.5rem" }}>
              {endpoint.description}
            </p>
          )}

          {endpoint.params?.length > 0 && (
            <>
              <p style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Parameters</p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0.5rem" }}>
                <thead>
                  <tr style={{ color: "var(--text3)" }}>
                    <th style={th}>Name</th>
                    <th style={th}>In</th>
                    <th style={th}>Type</th>
                    <th style={th}>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p, i) => (
                    <tr key={i}>
                      <td style={td}><code>{p.name}</code></td>
                      <td style={td}>{p.in}</td>
                      <td style={td}>{p.type}</td>
                      <td style={td}>{p.required ? "✅" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {endpoint.security?.length > 0 && (
            <p style={{ color: "var(--text2)" }}>
              🔐 Auth: {endpoint.security.join(", ")}
            </p>
          )}

          {endpoint.tags?.length > 0 && (
            <div className="tag-list" style={{ marginTop: "0.35rem" }}>
              {endpoint.tags.map((t) => (
                <span key={t} className="badge-category">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "0.2rem 0.5rem",
  borderBottom: "1px solid var(--border)",
  fontWeight: 500,
};
const td = {
  padding: "0.2rem 0.5rem",
  borderBottom: "1px solid var(--border)",
  color: "var(--text2)",
};
