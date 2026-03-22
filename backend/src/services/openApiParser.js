/**
 * openApiParser.js
 * Dereferences and parses an OpenAPI 2.x / 3.x spec into a normalized structure.
 */

const SwaggerParser = require("@apidevtools/swagger-parser");
const https = require("https");

// Allow corporate-proxy / self-signed certs outside production
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

/**
 * Normalize a single OpenAPI parameter object.
 */
function normalizeParam(param) {
  const schema = param.schema || {};
  return {
    name: param.name || "",
    in: param.in || "query",
    description: param.description || "",
    required: param.required || false,
    type: schema.type || param.type || "string",
    example: schema.example ?? param.example ?? null,
  };
}

/**
 * Extract a JSON body schema example from a requestBody (OAS3) or body param (OAS2).
 */
function extractBody(details) {
  // OAS 3.x
  if (details.requestBody) {
    const content = details.requestBody.content || {};
    const jsonContent =
      content["application/json"] ||
      content["application/x-www-form-urlencoded"] ||
      Object.values(content)[0] ||
      {};
    const schema = jsonContent.schema || {};
    const example =
      jsonContent.example ||
      (schema.examples && Object.values(schema.examples)[0]) ||
      schema.example ||
      null;

    const bodyType = Object.keys(content)[0]?.includes("form")
      ? "form"
      : "json";

    return { body: example || schema, bodyType };
  }

  // OAS 2.x – body parameter
  const bodyParam = (details.parameters || []).find((p) => p.in === "body");
  if (bodyParam) {
    return {
      body: bodyParam.schema || null,
      bodyType: "json",
    };
  }

  return { body: null, bodyType: "none" };
}

/**
 * Extract security scheme names used by the operation.
 */
function extractSecurity(details) {
  const sec = details.security || [];
  return sec.flatMap((s) => Object.keys(s));
}

/**
 * Parse an OpenAPI spec URL / file path and return normalised API metadata + endpoint list.
 *
 * @param {string} specUrl - URL or local file path
 * @returns {Promise<{meta: object, endpoints: object[]}>}
 */
async function parseOpenAPI(specUrl) {
  const api = await SwaggerParser.dereference(specUrl);

  // ── Meta ──────────────────────────────────────────────────────────────────
  const info = api.info || {};
  const servers = api.servers || [];
  const baseUrl =
    servers[0]?.url ||
    (api.host
      ? `${api.schemes?.[0] || "https"}://${api.host}${api.basePath || ""}`
      : "");

  const meta = {
    name: info.title || "Unnamed API",
    version: info.version || "1.0.0",
    description: info.description || "",
    baseUrl,
    contactEmail: info.contact?.email || "",
    license: info.license?.name || "",
    source: "openapi",
  };

  // ── Endpoints ─────────────────────────────────────────────────────────────
  const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head"];

  const endpoints = [];

  for (const [path, pathItem] of Object.entries(api.paths || {})) {
    for (const method of HTTP_METHODS) {
      if (!pathItem[method]) continue;

      const details = pathItem[method];

      // Parameters: combine path-level + operation-level, deduplicate by name+in
      const rawParams = [
        ...(pathItem.parameters || []),
        ...(details.parameters || []),
      ];

      const seen = new Set();
      const params = [];
      const headers = [];

      for (const p of rawParams) {
        const key = `${p.name}::${p.in}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const norm = normalizeParam(p);
        if (norm.in === "header") {
          headers.push(norm);
        } else if (norm.in !== "body") {
          // "body" params are handled via requestBody
          params.push(norm);
        }
      }

      const { body, bodyType } = extractBody(details);
      const security = extractSecurity(details);

      // Response example (first 2xx schema / example)
      let responseExample = null;
      let responseSchema = null;
      const responses = details.responses || {};
      const successKey = Object.keys(responses).find((k) =>
        k.startsWith("2")
      );
      if (successKey) {
        const resp = responses[successKey];
        const respContent = resp.content || {};
        const respJson =
          respContent["application/json"] || Object.values(respContent)[0] || {};
        responseExample = respJson.example || null;
        responseSchema = respJson.schema || resp.schema || null;
      }

      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: details.summary || "",
        description: details.description || "",
        operationId: details.operationId || "",
        tags: details.tags || [],
        params,
        headers,
        body,
        bodyType,
        responseExample,
        responseSchema,
        security,
        deprecated: details.deprecated || false,
      });
    }
  }

  return { meta, endpoints };
}

module.exports = { parseOpenAPI };
