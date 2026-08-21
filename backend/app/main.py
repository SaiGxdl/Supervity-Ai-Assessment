import dotenv
dotenv.load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="Real-Time Exception Resolution Workbench API",
    description="Supervity FDE Assessment - Problem 9 (FastAPI Backend)",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (usually localhost:5173 or localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Real-Time Exception Resolution Workbench API",
        "docs": "/docs"
    }
