/**
 * apiController.js
 * GET  /api/apis            – list / search
 * GET  /api/apis/:id        – single API
 * GET  /api/apis/:id/endpoints – endpoints for an API
 */

const Api = require("../models/Api");
const Endpoint = require("../models/Endpoint");

// ── GET /api/apis ──────────────────────────────────────────────────────────
async function listApis(req, res) {
  try {
    const {
      q,
      category,
      tag,
      source,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }

    if (category) {
      filter.category = { $in: Array.isArray(category) ? category : [category] };
    }

    if (tag) {
      filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    }

    if (source) {
      filter.source = source;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [apis, total] = await Promise.all([
      Api.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select("-__v"),
      Api.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: apis,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("[listApis] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/apis/:id ──────────────────────────────────────────────────────
async function getApi(req, res) {
  try {
    const api = await Api.findById(req.params.id).select("-__v");
    if (!api) {
      return res.status(404).json({ success: false, message: "API not found" });
    }
    return res.json({ success: true, data: api });
  } catch (err) {
    console.error("[getApi] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/apis/:id/endpoints ────────────────────────────────────────────
async function getEndpoints(req, res) {
  try {
    const api = await Api.findById(req.params.id);
    if (!api) {
      return res.status(404).json({ success: false, message: "API not found" });
    }

    const {
      method,
      tag,
      q,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { apiId: api._id };

    if (method) {
      filter.method = method.toUpperCase();
    }

    if (tag) {
      filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    }

    if (q) {
      filter.$or = [
        { path: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [endpoints, total] = await Promise.all([
      Endpoint.find(filter)
        .sort({ path: 1, method: 1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-__v"),
      Endpoint.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: endpoints,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("[getEndpoints] Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/categories ────────────────────────────────────────────────────
async function listCategories(req, res) {
  try {
    const categories = await Api.distinct("category");
    return res.json({ success: true, data: categories.sort() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listApis, getApi, getEndpoints, listCategories };
