# JarStock

Compact stock intelligence dashboard with a FastAPI backend and a React frontend.

## Highlights
- Market snapshot, price history, movers, comparison, and insights.
- SQLite cache with background refresh to reduce rate limits.
- Clean, responsive UI with charts and quick filters.

## How it works
- Pulls OHLCV data (yfinance) and cleans it with Pandas.
- Stores prices + metrics in SQLite for fast reads.
- Serves REST endpoints for the UI and lightweight charts.
- Falls back to a stored snapshot if live data is blocked.

## Insights
- Metrics: daily return, 7-day MA, volatility, momentum.
- Insight label + risk level derived from recent metrics.
- Optional prediction line (linear regression on recent closes).

## Quickstart

Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open http://127.0.0.1:5173

Env files (optional):
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## API (core)
- GET /companies
- GET /market/snapshot
- GET /data/{symbol}?range=30d|90d|1y|max
- GET /summary/{symbol}
- GET /insights/{symbol}
- GET /metrics/{symbol}?range=30d|90d|1y|max
- GET /compare?symbol1=AAA&symbol2=BBB&range=30d|90d|1y|max
- GET /market/top-gainers?limit=5
- GET /market/top-losers?limit=5
- POST /refresh/market
- POST /refresh/{symbol}

Docs: /docs

## Environment
See backend/.env.example and frontend/.env.example. Common ones:
- JARSTOCK_SYMBOLS
- JARSTOCK_REFRESH_ON_STARTUP
- JARSTOCK_YF_DISABLE / JARSTOCK_YF_PROXY
- VITE_API_BASE_URL

## Deployment
Frontend (Vercel): root = frontend, build = npm run build, output = dist.

Backend (Render):
- Build: pip install -r backend/requirements.txt
- Start: uvicorn main:app --host 0.0.0.0 --port $PORT --app-dir backend
