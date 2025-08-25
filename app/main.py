from fastapi import FastAPI
from app.db.base import Base, engine
from app.models import client as client_model
from app.api.routes import client as client_router
from app.api.routes import auth as auth_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GenAI Commercial Agent API")

# Routers
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(client_router.router, prefix="/clients", tags=["Clients"])
