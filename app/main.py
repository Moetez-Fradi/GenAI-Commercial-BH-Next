from fastapi import FastAPI
from app.db.base import Base, engine
from app.models import client as client_model
from app.api.routes import client as client_router
from app.api.routes import auth as auth_router
from app.api.routes.recommendation.recommendation import router as insurance_router
from fastapi.middleware.cors import CORSMiddleware

#Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GenAI Commercial Agent API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

#Routers
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(client_router.router, prefix="/clients", tags=["Clients"])
app.include_router(
    insurance_router,
    prefix="/api/recommendation",
    tags=["insurance"]
)