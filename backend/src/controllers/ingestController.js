/**
 * ingestController.js
 * POST /api/ingest
 */

const { body, validationResult } = require("express-validator");
const { ingestFromUrl } = require("../services/ingestionService");

const validateIngest = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("url is required")
    .isURL({ require_protocol: true })
    .withMessage("url must be a valid URL with protocol (http/https)"),
];

async function ingest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { url } = req.body;

  try {
    const { api, endpointCount, isNew } = await ingestFromUrl(url);

    return res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew
        ? `API "${api.name}" ingested with ${endpointCount} endpoints`
        : `API "${api.name}" re-ingested with ${endpointCount} endpoints`,
      data: {
        apiId: api._id,
        name: api.name,
        endpointCount,
        isNew,
      },
    });
  } catch (err) {
    console.error("[ingest] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Ingestion failed",
      error: err.message,
    });
  }
}

module.exports = { ingest, validateIngest };
