from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="CampusPrice AI & Decision Support Engine",
    description="6-layer pricing, combo cannibalisation, student affordability, and simulation engine (PS 2.4)",
    version="1.0.0"
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "CampusPrice AI Decision Engine",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": True
    }
