/**
 * smoke-test.js  –  Quick end-to-end check of every REST endpoint.
 * Run: node smoke-test.js
 */

const BASE = "http://localhost:5000";

async function req(method, path, body) {
  const opts = { method };
  if (body) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  const json = await res.json();
  return { status: res.status, json };
}

async function run() {
  let passed = 0;
  let failed = 0;

  function check(label, condition, detail = "") {
    if (condition) {
      console.log(`  ✅  ${label}`);
      passed++;
    } else {
      console.error(`  ❌  ${label}  ${detail}`);
      failed++;
    }
  }

  console.log("\n=== API Explorer Smoke Tests ===\n");

  // 1. Health
  const { status: hs, json: hj } = await req("GET", "/health");
  check("GET /health returns 200", hs === 200, `got ${hs}`);
  check("GET /health returns status=ok", hj.status === "ok");

  // 2. List APIs (empty DB)
  const { status: as, json: aj } = await req("GET", "/api/apis");
  check("GET /api/apis returns 200", as === 200, `got ${as}`);
  check("GET /api/apis returns success=true", aj.success === true);
  check("GET /api/apis returns data array", Array.isArray(aj.data));

  // 3. Categories
  const { status: cs, json: cj } = await req("GET", "/api/categories");
  check("GET /api/categories returns 200", cs === 200, `got ${cs}`);
  check("GET /api/categories returns array", Array.isArray(cj.data));

  // 4. Ingest – validation: missing url
  const { status: i1s, json: i1j } = await req("POST", "/api/ingest", {});
  check("POST /api/ingest (no url) returns 400", i1s === 400, `got ${i1s}`);
  check("POST /api/ingest (no url) has errors array", Array.isArray(i1j.errors));

  // 5. Ingest – validation: bad url
  const { status: i2s } = await req("POST", "/api/ingest", { url: "not-a-url" });
  check("POST /api/ingest (bad url) returns 400", i2s === 400, `got ${i2s}`);

  // 6. Get non-existent API
  const { status: g1s } = await req("GET", "/api/apis/000000000000000000000000");
  check("GET /api/apis/:id (not found) returns 404", g1s === 404, `got ${g1s}`);

  // 7. Endpoints for non-existent API
  const { status: e1s } = await req("GET", "/api/apis/000000000000000000000000/endpoints");
  check("GET /api/apis/:id/endpoints (not found) returns 404", e1s === 404, `got ${e1s}`);

  // 8. Import – missing ids
  const { status: m1s, json: m1j } = await req("POST", "/api/import", {});
  check("POST /api/import (no ids) returns 400", m1s === 400, `got ${m1s}`);
  check("POST /api/import (no ids) has message", typeof m1j.message === "string");

  // 9. Import – non-existent endpointId
  const { status: m2s } = await req("POST", "/api/import", {
    endpointId: "000000000000000000000001",
  });
  check("POST /api/import (bad endpointId) returns 404", m2s === 404, `got ${m2s}`);

  // 10. 404 on unknown route
  const { status: u1s } = await req("GET", "/api/doesnotexist");
  check("Unknown route returns 404", u1s === 404, `got ${u1s}`);

  console.log(`\n${"─".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("─".repeat(40));
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("\n❌ Could not connect to server:", e.message);
  console.error("   Make sure the backend is running: node src/server.js");
  process.exit(1);
});
