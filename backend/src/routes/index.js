const express = require("express");
const router = express.Router();

const { ingest, validateIngest } = require("../controllers/ingestController");
const { listApis, getApi, getEndpoints, listCategories } = require("../controllers/apiController");
const { importEndpoint, validateImport } = require("../controllers/importController");

// Ingest
router.post("/ingest", validateIngest, ingest);

// APIs
router.get("/apis", listApis);
router.get("/apis/:id", getApi);
router.get("/apis/:id/endpoints", getEndpoints);

// Categories
router.get("/categories", listCategories);

// Import
router.post("/import", validateImport, importEndpoint);

module.exports = router;
