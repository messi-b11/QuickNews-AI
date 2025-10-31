# QuickNews.ai  detailed overview

This repository contains QuickNews.ai: a small web app and Serverless API that fetches news, summarizes headlines, and returns sentiment analysis results.

This README documents the project structure, the responsibilities of each unit, how to run locally, environment variables, security guidance, testing strategy (unit tests + a search speed benchmark), and next steps.

## Repository layout

- `sentiment-news-app/`  Next.js frontend (React + Tailwind). Key pieces:
  - `src/app/page.tsx`  main page and search UI that calls the API.
  - `src/components/UsageGuardRail.tsx`  local usage tracking helpers:
    - checkDailyUsageLimit(limit): returns {allowed, currentCount} (resets daily using localStorage).
    - incrementUsageCount(): increments today's usage counter in localStorage.
  - `src/utils/ThemeProvider.tsx`, `ThemeSwitcher.tsx`  UI theme support.

- `sentiment-news-api/`  Serverless-backed API (Node/TypeScript). Key files:
  - `handler.ts`  Lambda handler that:
    - Reads query param `keyword` (defaults to `AI`).
    - Reads `NEWS_API_KEY` from environment.
    - Calls NewsAPI (`https://newsapi.org/v2/everything`) to fetch top 3 articles.
    - Calls AWS Comprehend (`detectSentiment`) for each headline.
    - Returns an array of { headline, summary, sentiment }.
  - `serverless.yml`  Serverless Framework deployment config (sets `NEWS_API_KEY: ${env:NEWS_API_KEY}` in provider environment).

- Other files:
  - `LICENSE`  project license.
  - `package.json` files inside each service for dependencies and scripts.

## How the main units function (quick function map)

- Frontend (Next.js)
  - page.tsx: renders a search input, calls `/api/news?keyword=<term>` (proxy to the Serverless API), displays results and sentiment badges.
  - UsageGuardRail.tsx: enforces a simple client-side daily usage cap to reduce API calls during demos.
  - ThemeProvider/ThemeSwitcher: small helpers for theme toggling and persistence.

- API (Lambda handler)
  - exports.handler(event): main entry point.
    - Input: event.queryStringParameters.keyword
    - Outputs: JSON array of objects { headline, summary, sentiment }
    - Errors: returns 500 with {message, error} if something fails.
  - External dependencies: News API (requires NEWS_API_KEY) and AWS Comprehend (requires AWS credentials when running detectSentiment).

## Environment variables (required)

- `NEWS_API_KEY`  API key for the news provider (NewsAPI.org). Example placeholder in `sentiment-news-api/.env.example`.
- AWS credentials  when you call AWS Comprehend from your local machine or during deployment, the AWS SDK will need credentials (configure via `~/.aws/credentials` or environment vars `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`).

Important: DO NOT commit real keys. Use `sentiment-news-api/.env.example` as a template and keep `.env` ignored.

## Security measures applied

- `.gitignore` updated to ignore `.env` and `.serverless/` build artifacts.
- `.env.example` added to document required keys without exposing secrets.
- Any literal API key strings in tracked files have been redacted or removed from the working tree.

If you believe a secret was committed at any point, rotate it immediately. If you want the secret fully removed from repo history, see the "History purge" section below.

## Running locally (developer flow)

Frontend:

```powershell
cd sentiment-news-app
npm install
npm run dev
```

API (quick local test):

```powershell
cd sentiment-news-api
npm install
# copy example env
copy .env.example .env
# set NEWS_API_KEY in .env
# If you want to test AWS Comprehend locally, ensure AWS credentials are configured
# Then invoke locally via Serverless (optional)
# npm i -g serverless
# sls offline
```

Alternative quick test (no serverless): create a tiny Node script that imports `handler` and calls it with a mocked event (set `process.env.NEWS_API_KEY` first).

## Tests and benchmarking (next steps)

Planned work (I'll implement these next as you requested):

1. Unit tests
   - API: test handler's flow using mocked HTTP responses (mock axios) and mocked AWS Comprehend (mock AWS SDK). Focus on:
     - happy path (3 articles -> 3 sentiment responses)
     - missing API key -> error
     - NewsAPI returning empty articles -> empty results
   - Frontend utils: test `checkDailyUsageLimit` and `incrementUsageCount` behavior using jsdom/localStorage mocks.

2. Search speed benchmark
   - Create a small Node script that repeats the API search endpoint 100x (or configurable), measures average and 95th percentile latency, and outputs results. Use natively-timed HTTP calls (axios) and sample concurrency.

I'll add a testing scaffold (Jest + ts-jest for TypeScript) and a `bench/search-speed.js` script in the next change.

## History purge (optional, destructive)

If you want every trace of a secret removed from repository history, we can run `git filter-repo` or BFG on a mirror clone and force-push the cleaned history. This rewrites commit SHAs and requires coordination (all collaborators must re-clone or reset their local repos). I will not do this without explicit confirmation.

## Where to find things

- Frontend entry: `sentiment-news-app/src/app/page.tsx`
- API handler: `sentiment-news-api/handler.ts`
- Example env: `sentiment-news-api/.env.example`

## Contact / ownership

Repository ownership and contributor links have been updated to repository owner details.

---

If you'd like, I'll now:
- Add the unit test scaffold and a couple of unit tests (API happy path + missing key),
- Add the search speed benchmark script and a short runner, and
- Purge secrets from history if you confirm and accept a force-push.

Tell me which of those to do next and I will implement them and push changes to `upload-to-messi-b11`.
