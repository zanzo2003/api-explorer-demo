/**
 * ingestionService.js
 * Orchestrates the full ingest pipeline:
 *   1. Detect spec type
 *   2. Parse spec (OpenAPI or HTML)
 *   3. Tag / categorise
 *   4. Persist to MongoDB
 */

const { detectSpecType } = require("./specDetector");
const { parseOpenAPI } = require("./openApiParser");
const { parseHtmlUrl } = require("./htmlParser");
const { tagApi } = require("./tagger");
const Api = require("../models/Api");
const Endpoint = require("../models/Endpoint");

/**
 * Ingest an API from a URL.
 *
 * @param {string} url - OpenAPI spec URL or HTML documentation URL
 * @returns {Promise<{ api: object, endpointCount: number, isNew: boolean }>}
 */
async function ingestFromUrl(url) {
  // ── Step 1: Detect spec type ─────────────────────────────────────────────
  const { type } = await detectSpecType(url);
  console.log(`[ingest] Detected spec type: ${type} for ${url}`);

  // ── Step 2: Parse ────────────────────────────────────────────────────────
  let meta, endpoints;
  if (type === "openapi") {
    ({ meta, endpoints } = await parseOpenAPI(url));
  } else {
    ({ meta, endpoints } = await parseHtmlUrl(url));
  }

  console.log(`[ingest] Parsed ${endpoints.length} endpoints from "${meta.name}"`);

  // ── Step 3: Tag / categorise ─────────────────────────────────────────────
  const { categories, tags } = await tagApi(meta.name, meta.description);
  console.log(`[ingest] Tagged: categories=${categories}, tags=${tags}`);

  // ── Step 4: Upsert API document ──────────────────────────────────────────
  let api = await Api.findOne({ specUrl: url });
  const isNew = !api;

  if (!api) {
    api = new Api({
      name: meta.name,
      baseUrl: meta.baseUrl,
      description: meta.description,
      version: meta.version,
      contactEmail: meta.contactEmail,
      license: meta.license,
      category: categories,
      tags,
      source: type,
      specUrl: url,
    });
  } else {
    // Update mutable fields on re-ingest
    api.name = meta.name;
    api.baseUrl = meta.baseUrl;
    api.description = meta.description;
    api.category = categories;
    api.tags = tags;
  }

  await api.save();

  // ── Step 5: Upsert endpoints ─────────────────────────────────────────────
  if (endpoints.length > 0) {
    // Remove stale endpoints from a previous ingest of the same API
    await Endpoint.deleteMany({ apiId: api._id });

    const docs = endpoints.map((ep) => ({
      ...ep,
      apiId: api._id,
    }));

    await Endpoint.insertMany(docs);
  }

  // Update endpoint count on the API document
  api.endpointCount = endpoints.length;
  await api.save();

  return { api, endpointCount: endpoints.length, isNew };
}

module.exports = { ingestFromUrl };
