import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from db import SessionLocal, engine
from routes.analysis import router as analysis_router
from routes.companies import router as companies_router
from routes.stocks import router as stocks_router
from services.data_service import bootstrap_data

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="JarStock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    models.Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        bootstrap_data(db)


app.include_router(companies_router)
app.include_router(stocks_router)
app.include_router(analysis_router)


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "JarStock API"}
