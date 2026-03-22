import axios from "axios";

const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE });

// ── APIs ──────────────────────────────────────────────────────────────────────
export const fetchApis = (params) =>
  api.get("/apis", { params }).then((r) => r.data);

export const fetchApi = (id) =>
  api.get(`/apis/${id}`).then((r) => r.data);

export const fetchEndpoints = (id, params) =>
  api.get(`/apis/${id}/endpoints`, { params }).then((r) => r.data);

export const fetchCategories = () =>
  api.get("/categories").then((r) => r.data);

// ── Ingest ────────────────────────────────────────────────────────────────────
export const ingestApi = (url) =>
  api.post("/ingest", { url }).then((r) => r.data);

// ── Import ────────────────────────────────────────────────────────────────────
export const importEndpoint = (endpointId) =>
  api.post("/import", { endpointId }).then((r) => r.data);

export const importAllEndpoints = (apiId) =>
  api.post("/import", { apiId }).then((r) => r.data);
