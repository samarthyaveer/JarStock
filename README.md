# JarStock

Mini stock data intelligence dashboard built for the internship assignment.

## What it does
- Fetches 1y historical OHLCV data via yfinance.
- Cleans and stores data in SQLite with precomputed metrics.
- Exposes REST APIs for prices, summary, insights, metrics, comparison, and movers.
- Provides a minimal React dashboard with charts, filters, comparison, and top movers.

## Tech stack
- Backend: FastAPI, SQLAlchemy, Pandas, yfinance
- Database: SQLite
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Charts: lightweight-charts

## Local setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://127.0.0.1:5173

Copy env examples if needed:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## API overview
- GET /companies
- GET /data/{symbol}?range=30d|90d|1y|max
- GET /summary/{symbol}
- GET /insights/{symbol}
- GET /metrics/{symbol}?range=30d|90d|1y|max
- GET /compare?symbol1=AAA&symbol2=BBB&range=30d|90d|1y|max
- GET /market/top-gainers?limit=5
- GET /market/top-losers?limit=5

Swagger docs are available at /docs.

## Assignment coverage
- Data collection and cleaning: yfinance + Pandas with date normalization and missing value handling.
- Calculated metrics: daily return, 7-day MA, volatility, momentum.
- 52-week high/low: summary endpoint.
- Custom metric: volatility and momentum.
- Comparison: correlation endpoint and compare chart.
- Visualization: chart, filters, movers, and comparison in the UI.
- Optional ML: simple prediction line (linear regression on recent closes).

## Notes
- Data is fetched on backend startup and cached in SQLite.
- Set JARSTOCK_REFRESH_ON_STARTUP=1 to refresh stored data.
- Set JARSTOCK_SYMBOLS="AAPL,MSFT" to customize symbols.

## Deployment

### Frontend (Vercel)
- Root directory: `frontend`
- Build command: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE_URL=https://<your-backend-url>`

### Backend (Render or Railway)
FastAPI runs as a long-lived service; Vercel is not recommended for this backend unless you convert to serverless functions.

Render example:
- Root directory: repo root
- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT --app-dir backend`
- Add env vars from `backend/.env.example` if needed
