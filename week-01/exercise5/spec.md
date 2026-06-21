# EASY-CHATGPT — Build Spec

Objective: A small but real chatbot server. 
Frontend talks to a FastAPI proxy; the proxy talks to
the LLM. The frontend NEVER calls the model directly.

This document is the target I am steering the coding agent (OpenCode) toward.
I wrote it; I will read everything the agent produces against it.

## Architecture (non-negotiable shape — reused in Week 2)

```
Browser (vanilla JS/HTML/CSS)
        |  HTTP (fetch)
        v
FastAPI backend  ---- proxy ---->  LLM via OpenAI-compatible API (OpenRouter)
        ^                                  |
        |<---------- response -------------|
```

- The frontend sends the user's message to FastAPI.
- FastAPI calls the LLM over the OpenAI-compatible Chat Completions endpoint.
- FastAPI returns the answer to the frontend.
- Switching the model/provider is a CONFIG change only (.env), never a code change.

## Config — .env only (never hardcoded, never committed)

```
BASE_URL=https://openrouter.ai/api/v1
API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
MODEL=qwen/qwen3-coder:free
PORT=6661
```

- `.env` MUST be in `.gitignore`.
- Provide a `.env.example` with placeholder values (this one IS committed).
- Backend reads config from environment at startup. No secrets in source.

## Endpoint used

- `POST {BASE_URL}/chat/completions`
- Header: `Authorization: Bearer {API_KEY}`
- Body includes `model`, `messages`, and (for streaming) `stream: true`.
- Use the OpenAI Python client pointed at BASE_URL, OR plain httpx — agent's call,
  but it must be the OpenAI-COMPATIBLE chat/completions shape.

## Required features

1. **FastAPI proxy backend**
   - Endpoint e.g. `POST /api/chat` that accepts the conversation (list of messages)
     and returns the model's reply.
   - Reads BASE_URL / API_KEY / MODEL from env.

2. **Frontend — vanilla JS + HTML + CSS only**
   - NO React, NO Svelte, NO framework, NO TypeScript.
   - A chat window: input box, send button, message history.
   - Multi-turn: keeps the conversation and sends the full history each turn.
   - **Renders model replies as Markdown** (code blocks, lists, headings formatted,
     not raw). A small JS Markdown lib (e.g. marked) loaded via CDN is fine.

3. **Context view**
   - Shows WHAT IS ACTUALLY SENT to the model (the messages array) for the current turn.
   - Shows token usage returned by the API (prompt/completion/total).
   - I should watch the conversation grow and the token count climb turn by turn.

4. **Runs from `docker compose up`**
   - User edits `.env`, runs `docker compose up`, app serves on port **6661**.
   - `docker-compose.yml` + `Dockerfile` included.
   - A `README.md` explaining: clone, copy .env.example to .env, fill it, compose up.

## Versions (build up — today: Baseline)

- **Baseline (TODAY):** no streaming. FastAPI calls the LLM, waits for the whole
  answer, returns it. Chat window shows it when it arrives.
 

## Definition of done (Baseline)

- [ ] Open the page in a browser.
- [ ] Hold a multi-turn conversation with the model.
- [ ] Context view shows the messages sent + token usage, growing each turn.
- [ ] `.env` holds all config; `.env` is gitignored; `.env.example` is committed.
- [ ] A teammate can clone the repo, edit `.env`, run `docker compose up`, and reach
      the same working app on port 6661 — on the FIRST try. (This is the real bar.)

 