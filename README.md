# Sizzling Hot Products API

Implementation of the Bunnings challenge as a Fastify + TypeScript backend service.

## What This Solution Delivers

- Domain-first implementation of the business rules.
- Input loading from `inputs/products.json` and `inputs/orders.json`.
- Zod validation/parsing for input files and route query parameters.
- HTTP API endpoints for summary, daily winner, and period winner.
- Vitest coverage for domain logic, loader validation, and API routes.

## Stack and Rationale

- `Fastify`: lightweight HTTP framework with good schema support and testability via `app.inject`.
- `Mercurius`: minimal Fastify-native GraphQL integration for the optional read interface.
- `TypeScript`: safer refactors and explicit contracts for domain entities.
- `Zod`: runtime validation for external inputs (JSON files, route query params).
- `Vitest`: fast unit/integration testing with minimal setup.

This submission focuses on the TypeScript API and business-logic layer because the challenge is centred on aggregation rules and product calculation. A React Native client can consume the REST endpoints directly, and this optional branch also demonstrates how the same domain layer can be exposed through GraphQL.

## Project Structure

```text
src/
  app.ts
  server.ts
  data/
    inputData.ts
  domain/
    types.ts
    sizzlingHotProducts.ts
  routes/
    index.ts
    routes.graphql.ts
    routes.health.ts
    routes.sizzlingHotProducts.ts
tests/
  data/
  domain/
  routes/
inputs/
  products.json
  orders.json
```

## Architecture Notes

- **Route layer (`src/routes`)** handles HTTP concerns: parsing/query validation, status codes, and response shapes.
- **Domain layer (`src/domain`)** owns the product-calculation business rules.
- **Data layer (`src/data`)** owns reading, validating, and exposing input data from JSON files.

The domain logic is framework-independent and directly unit-testable, which keeps rule verification fast and focused.

This separation is intentionally lightweight and helps keep business rules isolated from transport concerns without presenting this as a full enterprise clean-architecture implementation.

## Run Instructions

```bash
npm install
npm run dev
```

Service defaults to `http://localhost:3000`.

### Verification Commands

```bash
npm run format:check
npm run build
npm test
```

## Manual Live Testing

Start the server:

```bash
npm run dev
```

Happy-path checks:

```bash
curl http://localhost:3000/v1/health
curl http://localhost:3000/v1/sizzling-hot-products
curl "http://localhost:3000/v1/sizzling-hot-products/daily?date=23/04/2026"
curl "http://localhost:3000/v1/sizzling-hot-products/period?from=21/04/2026&to=23/04/2026"
```

Error-path checks (should return HTTP 400):

```bash
curl -i "http://localhost:3000/v1/sizzling-hot-products/daily"
curl -i "http://localhost:3000/v1/sizzling-hot-products/daily?date=2026-04-23"
curl -i "http://localhost:3000/v1/sizzling-hot-products/period?from=23/04/2026&to=21/04/2026"
```

## Challenge Expected Outcomes

| Date or Period             | Expected Product                                     | Endpoint                                                             |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `21/04/2026`               | `Ezy Storage 37L Flexi Laundry Basket - White`       | `GET /v1/sizzling-hot-products/daily?date=21/04/2026`                |
| `22/04/2026`               | `Ezy Storage 37L Flexi Laundry Basket - White`       | `GET /v1/sizzling-hot-products/daily?date=22/04/2026`                |
| `23/04/2026`               | `Arlec 160W Crystalline Solar Foldable Charging Kit` | `GET /v1/sizzling-hot-products/daily?date=23/04/2026`                |
| `21/04/2026 to 23/04/2026` | `Ezy Storage 37L Flexi Laundry Basket - White`       | `GET /v1/sizzling-hot-products/period?from=21/04/2026&to=23/04/2026` |

## API Endpoints

All endpoints are under `/v1`.

### `GET /v1/health`

Returns:

```json
{ "status": "ok" }
```

### `GET /v1/sizzling-hot-products`

Returns a default challenge summary for `21/04/2026` to `23/04/2026`.

Response shape:

```json
{
  "today": "23/04/2026",
  "period": {
    "from": "21/04/2026",
    "to": "23/04/2026",
    "product": { "id": "P1", "name": "..." },
    "salesCount": 6
  }
}
```

### `GET /v1/sizzling-hot-products/daily?date=DD/MM/YYYY`

Response shape:

```json
{
  "date": "23/04/2026",
  "product": { "id": "P6", "name": "..." },
  "salesCount": 1
}
```

Error on missing/invalid date:

```json
{
  "error": "Bad Request",
  "message": "Invalid query parameter \"date\". Expected DD/MM/YYYY."
}
```

### `GET /v1/sizzling-hot-products/period?from=DD/MM/YYYY&to=DD/MM/YYYY`

Response shape:

```json
{
  "from": "21/04/2026",
  "to": "23/04/2026",
  "product": { "id": "P1", "name": "..." },
  "salesCount": 6
}
```

Error on missing/invalid/from>to:

```json
{
  "error": "Bad Request",
  "message": "Invalid query parameters \"from\" and \"to\". Expected DD/MM/YYYY with from before or equal to to."
}
```

## Optional GraphQL Interface

The REST API remains the primary challenge interface. This branch also includes a minimal optional GraphQL endpoint to demonstrate that the same framework-independent domain layer can be exposed through another transport without duplicating business logic.

Endpoint:

`POST /v1/graphql`

Daily query example:

```bash
curl -X POST http://localhost:3000/v1/graphql \
  -H "content-type: application/json" \
  -d '{"query":"query { sizzlingHotProduct(date: \"23/04/2026\") { date product { id name } salesCount } }"}'
```

Period query example:

```bash
curl -X POST http://localhost:3000/v1/graphql \
  -H "content-type: application/json" \
  -d '{"query":"query { sizzlingHotProductForPeriod(from: \"21/04/2026\", to: \"23/04/2026\") { from to product { id name } salesCount } }"}'
```

## Business Rules Coverage

Implemented in `src/domain/sizzlingHotProducts.ts`:

1. Count each product at most once per order (`quantity` ignored for ranking).
2. Deduplicate same-customer/same-product/same-day sales across completed orders.
3. Credit cancellations by excluding completed orders whose `orderId` appears in cancelled records.
4. Tie-break by product name alphabetically (case-insensitive).  
   Assumption: if names are still equal, fallback to product ID for deterministic results.
5. Date filtering supports single-day and inclusive period filtering using calendar dates.

## Validation Strategy

### Input files (`src/data/inputData.ts`)

- Uses Zod for structural validation of products/orders.
- Additional checks:
  - duplicate product IDs rejected
  - unknown product references in order entries rejected
- Date strings validated as real `DD/MM/YYYY` calendar dates.

### Route boundary (`src/routes/routes.sizzlingHotProducts.ts`)

- Daily and period query params validated with Zod before domain execution.
- Invalid queries return `400 Bad Request`.

## Testing Strategy

- Domain tests (`tests/domain/*`): core aggregation and rule behavior.
- Loader tests (`tests/data/*`): parsing/validation and failure scenarios.
- Route tests (`tests/routes/*`): endpoint contract and query error handling via `app.inject`.

Current suite includes:

- happy path result checks
- invalid date format checks
- invalid date range checks
- cancellation behavior
- duplicate customer/day behavior

## Assumptions

- Challenge “today” is fixed to `23/04/2026`.
- Default summary range is fixed to `21/04/2026` to `23/04/2026`.
- Dates are treated as calendar dates in `DD/MM/YYYY`.
- Cancellation records reference completed orders by `orderId`.
- Unmatched cancellation records are ignored (no-op).

## Tradeoffs and Design Decisions

- Kept a compact route module to match the existing target app style and avoid over-abstraction.
- Kept error handling local/simple (plain `400` payloads) instead of introducing a global error architecture.
- Domain still performs lightweight date validation for safe direct invocation outside route context.
- Loader and route both validate dates intentionally:
  - loader protects file integrity
  - route protects API boundary

## Nice-to-Have Improvements (Not Required for Core Challenge)

1. Add OpenAPI/Swagger docs for endpoint contracts.
2. Add centralized error-mapping utility for consistent API error payloads.
3. Add contract tests for exact error messages/payload schema.
4. Allow configurable default summary range/today via environment variables.

## Implemented Nice-to-Have

- CI workflow added at `.github/workflows/ci.yml` for push and pull requests.
- CI pipeline runs: `npm ci`, `npm run format:check`, `npm run build`, and `npm test`.

## Future Scaling Considerations

The current implementation is intentionally in-memory because the challenge dataset is small and static. For larger datasets, ingestion should be separated from query serving, with products and orders normalised and persisted in a database. Query paths should use precomputed daily product/customer aggregates rather than scanning raw orders on each request. For production readiness, add stronger observability (metrics/tracing), consistent structured logging with request IDs, and maintained API contract documentation.

## Reviewer Notes

- This implementation is intentionally incremental and test-backed.
- Core behavior is implemented in domain functions, with route/input layers kept thin.
- Output results align with expected challenge outcomes for provided input data.
