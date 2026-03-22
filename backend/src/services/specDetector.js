/**
 * specDetector.js
 * Detects whether a given URL or content is an OpenAPI / Swagger spec or HTML docs.
 */

const axios = require("axios");
const https = require("https");

// Allow self-signed / corporate-proxy certificates in non-production environments
const httpsAgent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === "production" });

/**
 * Heuristically classify raw text into "openapi" or "html".
 * @param {string} text
 * @returns {"openapi"|"html"}
 */
function classifyContent(text) {
  const lower = text.slice(0, 2000).toLowerCase();

  // JSON / YAML indicators
  if (
    lower.includes('"openapi"') ||
    lower.includes("'openapi'") ||
    lower.includes("openapi:") ||
    lower.includes('"swagger"') ||
    lower.includes("'swagger'") ||
    lower.includes("swagger:")
  ) {
    return "openapi";
  }

  // HTML indicator
  if (lower.includes("<!doctype html") || lower.includes("<html")) {
    return "html";
  }

  // Fall back to openapi for JSON/YAML without explicit marker
  if (lower.trim().startsWith("{") || lower.trim().startsWith("---")) {
    return "openapi";
  }

  return "html";
}

/**
 * Fetches the content at `url` and returns the detected spec type and raw body.
 * @param {string} url
 * @returns {Promise<{type: "openapi"|"html", raw: string}>}
 */
async function detectSpecType(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { Accept: "application/json, text/yaml, text/html, */*" },
      maxContentLength: 10 * 1024 * 1024, // 10 MB safety cap
      httpsAgent,
    });

    const raw =
      typeof response.data === "object"
        ? JSON.stringify(response.data)
        : response.data;

    const contentType = (response.headers["content-type"] || "").toLowerCase();

    let type;
    if (
      contentType.includes("json") ||
      contentType.includes("yaml") ||
      contentType.includes("yml")
    ) {
      type = "openapi";
    } else {
      type = classifyContent(raw);
    }

    return { type, raw };
  } catch (err) {
    throw new Error(`Failed to fetch spec URL: ${err.message}`);
  }
}

module.exports = { detectSpecType, classifyContent };
