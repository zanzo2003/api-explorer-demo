/**
 * importController.js
 * POST /api/import  – return an API Dash template for a given endpointId
 */

const { body, validationResult } = require("express-validator");
const Endpoint = require("../models/Endpoint");
const Api = require("../models/Api");
const { generateTemplate, generateTemplates } = require("../services/templateGenerator");

const validateImport = [
  body("endpointId")
    .optional()
    .isMongoId()
    .withMessage("endpointId must be a valid MongoDB ObjectId"),
  body("apiId")
    .optional()
    .isMongoId()
    .withMessage("apiId must be a valid MongoDB ObjectId"),
];

/**
 * Import a single endpoint or all endpoints of an API as API Dash templates.
 * Body:
 *   { endpointId: string }  → single template
 *   { apiId: string }       → all templates for that API
 */
async function importEndpoint(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { endpointId, apiId } = req.body;

  if (!endpointId && !apiId) {
    return res.status(400).json({
      success: false,
      message: "Provide either endpointId or apiId",
    });
  }

  try {
    // ── Single endpoint ─────────────────────────────────────────────────────
    if (endpointId) {
      const endpoint = await Endpoint.findById(endpointId);
      if (!endpoint) {
        return res.status(404).json({ success: false, message: "Endpoint not found" });
      }

      const api = await Api.findById(endpoint.apiId);
      if (!api) {
        return res.status(404).json({ success: false, message: "Parent API not found" });
      }

      const template = generateTemplate(endpoint, api);

      // Bump popularity counter
      api.popularity = (api.popularity || 0) + 1;
      await api.save();

      return res.json({ success: true, data: template });
    }

    // ── All endpoints for an API ────────────────────────────────────────────
    const api = await Api.findById(apiId);
    if (!api) {
      return res.status(404).json({ success: false, message: "API not found" });
    }

    const endpoints = await Endpoint.find({ apiId: api._id });
    const templates = generateTemplates(endpoints, api);

    api.popularity = (api.popularity || 0) + 1;
    await api.save();

    return res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (err) {
    console.error("[import] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { importEndpoint, validateImport };
