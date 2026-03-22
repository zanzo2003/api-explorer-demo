import React from "react";

const METHOD_COLORS = {
  GET: "badge-GET",
  POST: "badge-POST",
  PUT: "badge-PUT",
  PATCH: "badge-PATCH",
  DELETE: "badge-DELETE",
  HEAD: "badge-HEAD",
  OPTIONS: "badge-OPTIONS",
};

export default function MethodBadge({ method }) {
  const cls = METHOD_COLORS[method?.toUpperCase()] || "badge-OPTIONS";
  return <span className={`badge ${cls}`}>{method?.toUpperCase()}</span>;
}
