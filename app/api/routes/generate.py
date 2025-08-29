import os
from typing import List, Optional
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.concurrency import run_in_threadpool

load_dotenv()

client = OpenAI(
    base_url=os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"),
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

app = FastAPI()

DEFAULT_SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT"
)

MODEL_DEFAULT = "meta-llama/llama-3-8b-instruct"


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


@app.post("/chat")
async def chat(req: ChatRequest):
    # choose model and prompt
    model = req.model or MODEL_DEFAULT
    system_prompt = req.system_prompt if req.system_prompt is not None else DEFAULT_SYSTEM_PROMPT

    # convert pydantic Message -> dict
    incoming = [m.dict() for m in req.messages]

    if not any(m.get("role") == "system" for m in incoming) and system_prompt:
        messages = [{"role": "system", "content": system_prompt}] + incoming
    else:
        messages = incoming

    answer = await run_in_threadpool(sync_generate, messages, model, req.temperature, req.max_tokens)

    return {"reply": answer}
