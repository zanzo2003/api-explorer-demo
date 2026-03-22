import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchApis, fetchCategories } from "../api/client";

export default function ExplorerPage() {
  const [apis, setApis] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCategories().then((r) => setCategories(r.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = { page, limit: 12 };
    if (search) params.q = search;
    if (category) params.category = category;

    fetchApis(params)
      .then((r) => {
        setApis(r.data || []);
        setPagination(r.pagination || {});
      })
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [search, category, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <h1 className="page-title">API Explorer</h1>
      <p className="page-subtitle">
        Browse, search, and import public API templates into API Dash
      </p>

      {/* Search bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search APIs…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
        {(search || category) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { setSearch(""); setCategory(""); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Stats */}
      {!loading && pagination.total !== undefined && (
        <p style={{ color: "var(--text2)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
          {pagination.total} API{pagination.total !== 1 ? "s" : ""} found
        </p>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner" />
      ) : apis.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: "2rem" }}>🔍</p>
          <p style={{ marginTop: "0.5rem" }}>No APIs found.</p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
            + Add your first API
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {apis.map((api) => (
            <ApiCard key={api._id} api={api} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === page ? "active" : ""}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
        </div>
      )}
    </>
  );
}

function ApiCard({ api }) {
  return (
    <Link to={`/apis/${api._id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h3 style={{ fontWeight: 600, fontSize: "0.95rem" }}>{api.name}</h3>
          <span className="stats-pill">
            {api.endpointCount ?? 0} endpoints
          </span>
        </div>

        <p
          style={{
            color: "var(--text2)",
            fontSize: "0.8rem",
            marginTop: "0.4rem",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {api.description || "No description."}
        </p>

        {/* Categories */}
        {api.category?.length > 0 && (
          <div className="tag-list" style={{ marginTop: "0.75rem" }}>
            {api.category.map((c) => (
              <span key={c} className="badge-category">{c}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--text3)" }}>
          {api.source === "openapi" ? "📄 OpenAPI" : "🌐 HTML"} · {api.baseUrl}
        </div>
      </div>
    </Link>
  );
}
