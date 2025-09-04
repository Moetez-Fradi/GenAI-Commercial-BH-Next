import os
from typing import List, Optional
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from fastapi.concurrency import run_in_threadpool
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.services.history_service import upsert_history, add_message_to_recommendation
from app.schemas.history import HistoryCreate, HistoryMessageCreate

load_dotenv()

client = OpenAI(
    base_url=os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"),
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

router = APIRouter()

DEFAULT_SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT"
)

MODEL_DEFAULT = "meta-llama/llama-4-maverick:free"


class Message(BaseModel):
    role: str  
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    system_prompt: Optional[str] = None    
    model: Optional[str] = None
    temperature: Optional[float] = 1.0
    max_tokens: Optional[int] = 512


def sync_generate(messages: List[dict], model: str, temperature: float, max_tokens: int) -> str:
    """
    Blocking call to the LLM. Called via run_in_threadpool from async endpoint.
    """
    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    try:
        return resp.choices[0].message.content
    except Exception:
        return str(resp)


@router.post("/")
async def chat(req: ChatRequest):
    model = req.model or MODEL_DEFAULT
    system_prompt = req.system_prompt if req.system_prompt is not None else DEFAULT_SYSTEM_PROMPT

    incoming = [m.dict() for m in req.messages]

    if not any(m.get("role") == "system" for m in incoming) and system_prompt:
        messages = [{"role": "system", "content": system_prompt}] + incoming
    else:
        messages = incoming

    answer = await run_in_threadpool(sync_generate, messages, model, req.temperature, req.max_tokens)

    print("LLM response:", answer)

    return {"reply": answer}
@router.post("/send")
async def chat_and_save(
    ref_personne: str,
    product: str,
    channel: str,
    req: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a message with the LLM and also save it to the history table.
    """
    model = req.model or MODEL_DEFAULT
    system_prompt = req.system_prompt if req.system_prompt is not None else DEFAULT_SYSTEM_PROMPT
    incoming = [m.dict() for m in req.messages]

    if not any(m.get("role") == "system" for m in incoming) and system_prompt:
        messages = [{"role": "system", "content": system_prompt}] + incoming
    else:
        messages = incoming

    answer = await run_in_threadpool(sync_generate, messages, model, req.temperature, req.max_tokens)

    history_in = HistoryCreate(
        ref_personne=ref_personne,
        name=None,
        rank=None,
        recommendations=[]
    )
    upsert_history(db, history_in)

    msg = HistoryMessageCreate(
        id=str(uuid.uuid4()),
        channel=channel,
        content=answer,
        sentAt=datetime.utcnow(),
    )
    updated_history = add_message_to_recommendation(db, ref_personne, product, msg)
    if not updated_history:
        raise HTTPException(status_code=500, detail="Failed to save history")

    return {"reply": answer, "history": updated_history}