# Sentiment News API

This small service fetches news using an external news API and returns sentiment analysis. Keep credentials out of source control.

Environment
----------

Required environment variables:

- `NEWS_API_KEY` — API key for the news provider used by this service.

Local development
-----------------

1. Copy the example env file and fill in your real key:

```powershell
cd sentiment-news-api
cp .env.example .env
# On Windows PowerShell if cp isn't available, use:
# copy .env.example .env
```

2. Edit `.env` and set `NEWS_API_KEY` to your key.

3. Run the service as documented in the project root (install dependencies and run the serverless/local runner if applicable).

Security notes
--------------

- Do NOT commit your real `.env` file. A `.env.example` is provided with placeholders.
- If a secret was committed previously, rotate it immediately and consider removing it from git history.

Example `.env` (already in `.env.example`):

```
NEWS_API_KEY=your_news_api_key_here
```

If you'd like, I can add instructions to use GitHub Actions or a secrets manager to provide the key at deploy time.
