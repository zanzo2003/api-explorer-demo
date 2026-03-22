/**
 * Unit tests for rule-based tagger and template generator.
 * No DB or network needed.
 */

const { ruleBasedTag } = require("../src/services/tagger");
const { generateTemplate } = require("../src/services/templateGenerator");
const { classifyContent } = require("../src/services/specDetector");

// ── Tagger ────────────────────────────────────────────────────────────────────
describe("ruleBasedTag", () => {
  test("tags a payment API correctly", () => {
    const { categories, tags } = ruleBasedTag("Stripe API", "Payment and billing API");
    expect(categories).toContain("finance");
    expect(tags.some((t) => ["payment", "billing"].includes(t))).toBe(true);
  });

  test("tags a weather API correctly", () => {
    const { categories } = ruleBasedTag("OpenWeather", "Weather forecast data");
    expect(categories).toContain("weather");
  });

  test("returns empty arrays for unrecognised API", () => {
    const { categories, tags } = ruleBasedTag("XYZ", "Some random service");
    expect(Array.isArray(categories)).toBe(true);
    expect(Array.isArray(tags)).toBe(true);
  });
});

// ── Spec Detector ─────────────────────────────────────────────────────────────
describe("classifyContent", () => {
  test("detects openapi JSON", () => {
    const sample = JSON.stringify({ openapi: "3.0.0", info: { title: "Test" } });
    expect(classifyContent(sample)).toBe("openapi");
  });

  test("detects swagger JSON", () => {
    const sample = JSON.stringify({ swagger: "2.0", info: { title: "Test" } });
    expect(classifyContent(sample)).toBe("openapi");
  });

  test("detects HTML", () => {
    expect(classifyContent("<!DOCTYPE html><html><body></body></html>")).toBe("html");
  });
});

// ── Template Generator ────────────────────────────────────────────────────────
describe("generateTemplate", () => {
  const mockApi = {
    _id: "api123",
    name: "Test API",
    baseUrl: "https://api.example.com",
  };

  test("generates a GET template with query params", () => {
    const endpoint = {
      _id: "ep1",
      path: "/users",
      method: "GET",
      summary: "List users",
      description: "",
      headers: [],
      params: [{ name: "limit", in: "query", type: "integer", required: false, example: 10 }],
      body: null,
      bodyType: "none",
      security: [],
      tags: ["user"],
    };

    const tpl = generateTemplate(endpoint, mockApi);

    expect(tpl.method).toBe("GET");
    expect(tpl.url).toBe("https://api.example.com/users");
    expect(tpl.name).toBe("List users");
    expect(tpl.params).toHaveLength(1);
    expect(tpl.params[0].name).toBe("limit");
    expect(tpl.params[0].value).toBe("10");
    expect(tpl.body.type).toBe("none");
  });

  test("generates a POST template with JSON body", () => {
    const endpoint = {
      _id: "ep2",
      path: "/users",
      method: "POST",
      summary: "Create user",
      description: "",
      headers: [],
      params: [],
      body: { name: "string", email: "string" },
      bodyType: "json",
      security: ["BearerAuth"],
      tags: [],
    };

    const tpl = generateTemplate(endpoint, mockApi);

    expect(tpl.method).toBe("POST");
    expect(tpl.body.type).toBe("json");
    expect(tpl.auth.type).toBe("bearer");
    const hasContentType = tpl.headers.some(
      (h) => h.name === "Content-Type" && h.value === "application/json"
    );
    expect(hasContentType).toBe(true);
  });

  test("trailing slash in baseUrl is removed", () => {
    const apiWithSlash = { ...mockApi, baseUrl: "https://api.example.com/" };
    const endpoint = {
      _id: "ep3",
      path: "/items",
      method: "GET",
      summary: "",
      description: "",
      headers: [],
      params: [],
      body: null,
      bodyType: "none",
      security: [],
      tags: [],
    };
    const tpl = generateTemplate(endpoint, apiWithSlash);
    expect(tpl.url).toBe("https://api.example.com/items");
  });
});
