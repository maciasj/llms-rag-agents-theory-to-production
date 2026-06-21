from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "https://openrouter.ai/api/v1")
API_KEY = os.getenv("API_KEY")
MODEL = os.getenv("MODEL", "qwen/qwen3-coder:free")
PORT = int(os.getenv("PORT", "6661"))

if not API_KEY:
    raise RuntimeError("API_KEY is not set in .env")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatResponse(BaseModel):
    reply: str
    usage: Usage

app = FastAPI(title="Easy-ChatGPT Proxy")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def index():
    return FileResponse("static/index.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    payload = {
        "model": MODEL,
        "messages": [m.model_dump() for m in req.messages],
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{BASE_URL}/chat/completions",
            json=payload,
            headers=headers,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    choice = data["choices"][0]
    reply = choice["message"]["content"]
    usage = Usage(**data["usage"])
    return ChatResponse(reply=reply, usage=usage)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)