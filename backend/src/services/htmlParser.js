/**
 * htmlParser.js
 * Scrapes basic endpoint information from HTML API documentation pages.
 * This is a best-effort, heuristic scraper – not a formal parser.
 */

const cheerio = require("cheerio");
const axios = require("axios");

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
const METHOD_PATTERN = new RegExp(
  `\\b(${HTTP_METHODS.join("|")})\\b`,
  "i"
);

/**
 * Attempt to extract endpoints by scanning the DOM for common patterns used in
 * API documentation generators (Swagger UI, ReDoc, Slate, custom pages, etc.).
 *
 * @param {string} html  - Raw HTML string
 * @param {string} pageUrl - Source URL (used to derive a base URL)
 * @returns {{ meta: object, endpoints: object[] }}
 */
function parseHtml(html, pageUrl = "") {
  const $ = cheerio.load(html);

  // ── Meta ──────────────────────────────────────────────────────────────────
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Unknown API";

  const description =
    $('meta[name="description"]').attr("content") ||
    $("p").first().text().trim() ||
    "";

  let baseUrl = "";
  try {
    const u = new URL(pageUrl);
    baseUrl = `${u.protocol}//${u.host}`;
  } catch (_) {
    /* ignore */
  }

  const meta = {
    name: title,
    version: "1.0.0",
    description,
    baseUrl,
    contactEmail: "",
    license: "",
    source: "html",
  };

  // ── Endpoints ─────────────────────────────────────────────────────────────
  const endpoints = [];

  /**
   * Helper: push an endpoint if it has a valid method + path.
   */
  function pushEndpoint(method, path, summary = "", description = "") {
    if (!method || !path) return;
    const m = method.toUpperCase();
    if (!HTTP_METHODS.includes(m)) return;
    // Deduplicate
    const exists = endpoints.some((e) => e.method === m && e.path === path);
    if (!exists) {
      endpoints.push({
        path,
        method: m,
        summary: summary.trim(),
        description: description.trim(),
        operationId: "",
        tags: [],
        params: [],
        headers: [],
        body: null,
        bodyType: "none",
        responseExample: null,
        responseSchema: null,
        security: [],
        deprecated: false,
      });
    }
  }

  // Pattern 1: <code>GET /path</code> or similar
  $("code, pre, .endpoint, .route, .operation").each((_, el) => {
    const text = $(el).text().trim();
    const match = text.match(
      new RegExp(`(${HTTP_METHODS.join("|")})\\s+(\\/[\\w\\/{}\\-:.?=&%_]+)`, "i")
    );
    if (match) {
      // Grab the nearest heading as summary
      const heading =
        $(el).closest("section, .operation-container, article, div")
          .find("h1, h2, h3, h4")
          .first()
          .text()
          .trim() ||
        $(el).prev("h1, h2, h3, h4").text().trim() ||
        "";
      pushEndpoint(match[1], match[2], heading);
    }
  });

  // Pattern 2: Swagger UI / ReDoc rendered divs
  // Swagger UI: <span class="opblock-summary-method">GET</span>
  //             <span class="opblock-summary-path">...</span>
  $(".opblock").each((_, el) => {
    const method = $(el).find(".opblock-summary-method").text().trim();
    const path = $(el)
      .find(".opblock-summary-path, .opblock-summary-path__deprecated")
      .text()
      .trim();
    const summary = $(el).find(".opblock-summary-description").text().trim();
    pushEndpoint(method, path, summary);
  });

  // Pattern 3: ReDoc / Stoplight-style
  $("[data-section-id], [data-operation-id]").each((_, el) => {
    const badge = $(el).find(".http-verb, .badge, .label").first().text().trim();
    const path = $(el)
      .find(".operation__path, code")
      .first()
      .text()
      .trim();
    const summary = $(el).find("h2, h3, h4").first().text().trim();
    pushEndpoint(badge, path, summary);
  });

  // Pattern 4: Slate / custom docs – look for headings that contain method + path
  $("h1, h2, h3, h4").each((_, el) => {
    const text = $(el).text().trim();
    const match = text.match(
      new RegExp(`(${HTTP_METHODS.join("|")})\\s+(\\/[\\w\\/{}\\-:.?=&%_]+)`, "i")
    );
    if (match) {
      const desc = $(el).next("p").text().trim();
      pushEndpoint(match[1], match[2], text, desc);
    }
  });

  return { meta, endpoints };
}

/**
 * Fetch an HTML page from `url` and parse it.
 * @param {string} url
 * @returns {Promise<{ meta: object, endpoints: object[] }>}
 */
async function parseHtmlUrl(url) {
  const https = require("https");
  const httpsAgent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === "production" });
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "API-Explorer-Bot/1.0" },
    httpsAgent,
  });
  const html =
    typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data);
  return parseHtml(html, url);
}

module.exports = { parseHtml, parseHtmlUrl };
