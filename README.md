# API Explorer – GSoC POC for API Dash

An end-to-end system to **discover, parse, tag, and import public APIs** directly into [API Dash](https://github.com/foss42/apidash).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                      │
│  ExplorerPage  │  ApiDetailPage  │  UploadPage           │
└──────────────────────────┬──────────────────────────────┘
                           │ REST
┌──────────────────────────▼──────────────────────────────┐
│               Node.js + Express Backend                  │
│                                                          │
│  POST /api/ingest   →  ingestionService                  │
│  GET  /api/apis     →  apiController                     │
│  GET  /api/apis/:id/endpoints                            │
│  POST /api/import   →  templateGenerator                 │
│  GET  /api/categories                                    │
└───────────┬───────────────────┬─────────────────────────┘
            │                   │
   ┌────────▼──────┐  ┌────────▼────────────┐
   │   MongoDB      │  │  External Spec URLs  │
   │  apis          │  │  (OpenAPI / HTML)    │
   │  endpoints     │  └─────────────────────┘
   └───────────────┘
```

## Pipeline

```
URL Input
   │
   ▼
specDetector  ──► "openapi" ──► openApiParser (swagger-parser)
                │                     │
                └─► "html"  ──► htmlParser (cheerio)
                                      │
                                      ▼
                               tagger (AI / rule-based)
                                      │
                                      ▼
                             MongoDB (Api + Endpoint)
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                    ▼
               GET /apis     GET /endpoints        POST /import
                                                         │
                                                         ▼
                                              API Dash Template JSON
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas URI)

### Backend

```bash
cd api-explorer/backend
cp .env.example .env          # edit MONGO_URI, optional OPENAI_API_KEY
npm install
npm run dev                    # http://localhost:5000
```

### Frontend

```bash
cd api-explorer/frontend
cp .env.example .env
npm install
npm start                      # http://localhost:3000
```

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/ingest` | Ingest an OpenAPI or HTML URL |
| `GET`  | `/api/apis` | List / search APIs (`?q=`, `?category=`, `?page=`) |
| `GET`  | `/api/apis/:id` | Single API details |
| `GET`  | `/api/apis/:id/endpoints` | Endpoints (`?method=`, `?q=`) |
| `GET`  | `/api/categories` | All distinct categories |
| `POST` | `/api/import` | Generate API Dash template (`{ endpointId }` or `{ apiId }`) |
| `GET`  | `/health` | Health check |

### Ingest Example

```bash
curl -X POST http://localhost:5000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://petstore3.swagger.io/api/v3/openapi.json"}'
```

### Import Example

```bash
curl -X POST http://localhost:5000/api/import \
  -H "Content-Type: application/json" \
  -d '{"endpointId": "<id>"}'
```

Returns an **API Dash-compatible template**:

```json
{
  "name": "List pets",
  "method": "GET",
  "url": "https://petstore3.swagger.io/api/v3/pet/findByStatus",
  "headers": [],
  "params": [{ "name": "status", "value": "available", "enabled": true }],
  "body": { "type": "none", "content": null },
  "auth": { "type": "none" }
}
```

---

## Project Structure

```
api-explorer/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── models/
│   │   │   ├── Api.js                # API collection schema
│   │   │   └── Endpoint.js           # Endpoint collection schema
│   │   ├── services/
│   │   │   ├── specDetector.js       # Detect OpenAPI vs HTML
│   │   │   ├── openApiParser.js      # Parse OpenAPI 2/3 specs
│   │   │   ├── htmlParser.js         # Scrape HTML docs (cheerio)
│   │   │   ├── tagger.js             # AI / rule-based categorisation
│   │   │   ├── templateGenerator.js  # API Dash template builder
│   │   │   └── ingestionService.js   # Orchestration pipeline
│   │   ├── controllers/
│   │   │   ├── ingestController.js
│   │   │   ├── apiController.js
│   │   │   └── importController.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── server.js
│   ├── tests/
│   │   ├── unit.test.js
│   │   └── integration.test.js
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── api/
        │   └── client.js             # Axios API client
        ├── components/
        │   ├── Layout.jsx
        │   ├── MethodBadge.jsx
        │   └── TemplateModal.jsx
        ├── pages/
        │   ├── ExplorerPage.jsx      # Browse & search APIs
        │   ├── ApiDetailPage.jsx     # Endpoints + import
        │   └── UploadPage.jsx        # Ingest new API
        ├── styles/
        │   └── global.css
        ├── App.jsx
        └── index.js
```

---

## AI Tagging (Optional)

Set in `backend/.env`:

```
USE_AI_TAGGING=true
OPENAI_API_KEY=sk-...
```

When enabled, uses `gpt-3.5-turbo` to generate categories and tags.
Falls back to fast rule-based matching if the API call fails.

---

## Running Tests

```bash
cd backend
npm install --save-dev mongodb-memory-server
npm test
```

Unit tests cover: spec detection, rule-based tagger, template generator.  
Integration tests cover: all REST endpoints using an in-memory MongoDB.

---

## GSoC Relevance

| Design Goal | Implementation |
|---|---|
| Discover public APIs | `/api/ingest` + spec detection |
| Parse OpenAPI/Swagger | `openApiParser.js` via `swagger-parser` |
| Parse HTML docs | `htmlParser.js` via `cheerio` |
| Categorize & tag | `tagger.js` (AI + rule-based) |
| Generate request templates | `templateGenerator.js` |
| Store in database | MongoDB with `Api` + `Endpoint` schemas |
| Browse & search UI | `ExplorerPage`, `ApiDetailPage` |
| Import into API Dash | `TemplateModal` + `/api/import` |

---

## Bonus Features (Planned)

- [ ] GitHub-based API contribution system
- [ ] Postman collection export (`/api/export/postman`)
- [ ] API health-check pinger
- [ ] User ratings and popularity ranking
- [ ] OpenAPI YAML file upload support
