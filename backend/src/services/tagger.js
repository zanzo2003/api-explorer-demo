/**
 * tagger.js
 * Categorises and tags an API using:
 *   1. OpenAI (if USE_AI_TAGGING=true and OPENAI_API_KEY is set)
 *   2. Rule-based keyword matching as a fast, free fallback
 */

const OpenAI = require("openai").default;

// ── Rule-based keyword map ────────────────────────────────────────────────────
const CATEGORY_RULES = [
  { keywords: ["payment", "billing", "invoice", "stripe", "charge", "wallet", "finance", "bank", "money", "currency", "transaction"], category: "finance" },
  { keywords: ["weather", "forecast", "climate", "temperature", "humidity", "rain", "wind"], category: "weather" },
  { keywords: ["map", "geo", "location", "geocode", "coordinate", "latitude", "longitude", "place", "address", "routing", "navigation"], category: "geolocation" },
  { keywords: ["auth", "oauth", "jwt", "token", "login", "identity", "permission", "role", "user", "account", "password", "sso"], category: "authentication" },
  { keywords: ["send", "email", "sms", "message", "notification", "push", "alert", "webhook", "twilio", "mailgun", "sendgrid"], category: "messaging" },
  { keywords: ["social", "twitter", "facebook", "instagram", "linkedin", "post", "follower", "like", "share", "feed"], category: "social-media" },
  { keywords: ["storage", "file", "upload", "download", "bucket", "s3", "blob", "drive", "cloud"], category: "storage" },
  { keywords: ["video", "audio", "music", "stream", "media", "youtube", "spotify", "podcast", "image", "photo"], category: "media" },
  { keywords: ["ai", "machine learning", "ml", "model", "inference", "nlp", "vision", "openai", "embeddings", "completions", "gpt"], category: "artificial-intelligence" },
  { keywords: ["analytics", "metrics", "tracking", "event", "log", "insight", "dashboard", "report", "stats"], category: "analytics" },
  { keywords: ["ecommerce", "shop", "product", "order", "cart", "inventory", "catalog", "shipping"], category: "ecommerce" },
  { keywords: ["health", "medical", "patient", "doctor", "hospital", "prescription", "diagnosis", "fhir"], category: "healthcare" },
  { keywords: ["news", "article", "blog", "rss", "feed", "headline", "content"], category: "news-content" },
  { keywords: ["search", "elastic", "solr", "index", "query", "full-text"], category: "search" },
  { keywords: ["iot", "sensor", "device", "telemetry", "mqtt", "edge", "hardware"], category: "iot" },
  { keywords: ["travel", "flight", "hotel", "booking", "airline", "itinerary", "trip"], category: "travel" },
  { keywords: ["sport", "football", "soccer", "basketball", "score", "match", "team", "league", "player"], category: "sports" },
  { keywords: ["crypto", "blockchain", "bitcoin", "ethereum", "nft", "web3", "defi", "token"], category: "blockchain" },
];

/**
 * Rule-based categoriser – fast, deterministic, no API key required.
 * @param {string} name
 * @param {string} description
 * @returns {{ categories: string[], tags: string[] }}
 */
function ruleBasedTag(name, description) {
  const haystack = `${name} ${description}`.toLowerCase();

  const categories = [];
  const tags = new Set();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) {
        if (!categories.includes(rule.category)) {
          categories.push(rule.category);
        }
        tags.add(kw);
        break; // one match per category rule is enough
      }
    }
  }

  return {
    categories: categories.slice(0, 4),
    tags: [...tags].slice(0, 10),
  };
}

/**
 * AI-based categoriser using OpenAI chat completions.
 * Falls back to rule-based if the call fails.
 * @param {string} name
 * @param {string} description
 * @returns {Promise<{ categories: string[], tags: string[] }>}
 */
async function aiTag(name, description) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are an API cataloguing expert.
Categorise the following API and return ONLY valid JSON (no markdown, no explanation).

API Name: ${name}
Description: ${description}

Return format:
{
  "categories": ["category1", "category2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Use lowercase hyphen-separated values (e.g. "social-media", "machine-learning").
Return at most 3 categories and 8 tags.`;

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.2,
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);

    return {
      categories: (parsed.categories || []).slice(0, 3),
      tags: (parsed.tags || []).slice(0, 8),
    };
  } catch (err) {
    console.warn("[tagger] AI tagging failed, falling back to rule-based:", err.message);
    return ruleBasedTag(name, description);
  }
}

/**
 * Main entry point. Uses AI if configured, otherwise rule-based.
 * @param {string} name
 * @param {string} description
 * @returns {Promise<{ categories: string[], tags: string[] }>}
 */
async function tagApi(name, description = "") {
  const useAI =
    process.env.USE_AI_TAGGING === "true" &&
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your_openai_api_key_here";

  if (useAI) {
    return aiTag(name, description);
  }
  return ruleBasedTag(name, description);
}

module.exports = { tagApi, ruleBasedTag };
