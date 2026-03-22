/**
 * templateGenerator.js
 * Converts a stored Endpoint document into an API Dash-compatible request template.
 *
 * API Dash template format:
 * {
 *   name       : string,
 *   method     : "GET"|"POST"|...,
 *   url        : string,
 *   headers    : [{ name, value }],
 *   params     : [{ name, value, enabled }],
 *   body       : { type: "json"|"form"|"none", content: any },
 *   auth       : { type: "none"|"bearer"|"basic", ... },
 *   description: string
 * }
 */

/**
 * Build a flat [{ name, value, enabled }] array from the endpoint's param list.
 */
function buildQueryParams(params = []) {
  return params
    .filter((p) => p.in === "query" || !p.in)
    .map((p) => ({
      name: p.name || "",
      value: p.example != null ? String(p.example) : "",
      enabled: true,
    }));
}

/**
 * Build a flat [{ name, value }] array from the endpoint's header list.
 * Merges in any Content-Type that would be implied by bodyType.
 */
function buildHeaders(headers = [], bodyType = "none") {
  const result = headers.map((h) => ({
    name: h.name || "",
    value: h.example != null ? String(h.example) : "",
  }));

  const hasContentType = result.some(
    (h) => h.name.toLowerCase() === "content-type"
  );

  if (!hasContentType) {
    if (bodyType === "json") {
      result.push({ name: "Content-Type", value: "application/json" });
    } else if (bodyType === "form") {
      result.push({
        name: "Content-Type",
        value: "application/x-www-form-urlencoded",
      });
    }
  }

  return result;
}

/**
 * Convert a body object + bodyType into the API Dash body block.
 */
function buildBody(body, bodyType = "none") {
  if (!body || bodyType === "none") {
    return { type: "none", content: null };
  }

  if (bodyType === "json") {
    return {
      type: "json",
      content: typeof body === "string" ? body : JSON.stringify(body, null, 2),
    };
  }

  if (bodyType === "form") {
    const entries = Object.entries(
      typeof body === "object" ? body : {}
    ).map(([k, v]) => ({ name: k, value: String(v ?? ""), enabled: true }));
    return { type: "form", content: entries };
  }

  return { type: "none", content: null };
}

/**
 * Infer auth type from security scheme names (heuristic).
 */
function inferAuth(security = []) {
  for (const s of security) {
    const lower = s.toLowerCase();
    if (lower.includes("bearer") || lower.includes("jwt")) {
      return { type: "bearer", token: "" };
    }
    if (lower.includes("basic")) {
      return { type: "basic", username: "", password: "" };
    }
    if (lower.includes("api") || lower.includes("key")) {
      return { type: "apikey", key: "", value: "", in: "header" };
    }
  }
  return { type: "none" };
}

/**
 * Generate a single API Dash template from an endpoint + its parent API.
 *
 * @param {object} endpoint  - Endpoint document (Mongoose doc or plain object)
 * @param {object} api       - Api document (Mongoose doc or plain object)
 * @returns {object}         - API Dash template
 */
function generateTemplate(endpoint, api) {
  const baseUrl = (api.baseUrl || "").replace(/\/$/, "");
  const url = `${baseUrl}${endpoint.path}`;

  return {
    name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
    method: endpoint.method,
    url,
    description: endpoint.description || "",
    headers: buildHeaders(endpoint.headers, endpoint.bodyType),
    params: buildQueryParams(endpoint.params),
    body: buildBody(endpoint.body, endpoint.bodyType),
    auth: inferAuth(endpoint.security),
    meta: {
      apiName: api.name,
      apiId: String(api._id),
      endpointId: String(endpoint._id),
      tags: endpoint.tags || [],
    },
  };
}

/**
 * Generate templates for multiple endpoints.
 * @param {object[]} endpoints
 * @param {object}   api
 * @returns {object[]}
 */
function generateTemplates(endpoints, api) {
  return endpoints.map((ep) => generateTemplate(ep, api));
}

module.exports = { generateTemplate, generateTemplates };
