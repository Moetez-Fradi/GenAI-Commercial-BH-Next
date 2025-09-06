from fastapi import FastAPI
from app.db.base import Base, engine
from app.api.routes import client as client_router
from app.api.routes import auth as auth_router
from app.api.routes.recommendation.recommendation import router as insurance_router
from app.api.routes import generate as generate_router
from app.api.routes import history as history_router
from app.api.routes import alerts as alerts_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.email import router as email_router
from app.api.routes.whatsapp import router as whatsapp_router
from app.api.routes.contracts import router as contracts_router
from app.core.tasks.alert_updater import start_scheduler, stop_scheduler

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GenAI Commercial Agent API")

origins = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(client_router.router, prefix="/clients", tags=["Clients"])
app.include_router(insurance_router, prefix="/api/recommendation", tags=["insurance"])
app.include_router(generate_router.router, prefix="/generate", tags=["generate"])
app.include_router(history_router.router, prefix="/history", tags=["History"])
app.include_router(email_router, prefix="/email", tags=["Email"])
app.include_router(whatsapp_router, prefix="/whatsapp", tags=["WhatsApp"])
app.include_router(alerts_router.router,prefix="/alerts",tags=["alerts"])
app.include_router(contracts_router, prefix="/contracts", tags=["contracts"])

# @app.on_event("startup")
# async def on_startup():
#     start_scheduler()

# @app.on_event("shutdown")
# async def on_shutdown():
#     stop_scheduler()