import React, { useState } from "react";
import { importEndpoint, importAllEndpoints } from "../api/client";
import MethodBadge from "./MethodBadge";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="btn btn-secondary btn-sm" onClick={copy}>
      {copied ? "✅ Copied" : "📋 Copy JSON"}
    </button>
  );
}

export default function TemplateModal({ endpoint, api, onClose }) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await importEndpoint(endpoint._id);
      setTemplate(res.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await importAllEndpoints(api._id);
      setTemplate(res.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const json = template ? JSON.stringify(template, null, 2) : null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">
            {endpoint ? (
              <>
                <MethodBadge method={endpoint.method} />{" "}
                <code style={{ fontSize: "0.85rem" }}>{endpoint.path}</code>
              </>
            ) : (
              `All endpoints – ${api.name}`
            )}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!template && (
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            {endpoint && (
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? "Generating…" : "Generate Template"}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleImportAll}
              disabled={loading}
            >
              {loading ? "Generating…" : "Import All Endpoints"}
            </button>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {json && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
              <CopyButton text={json} />
            </div>
            <pre className="template-preview">{json}</pre>
          </>
        )}
      </div>
    </div>
  );
}
