# Easy-ChatGPT

A small chatbot server with a FastAPI proxy backend and a vanilla JS frontend.

## Quick start

```bash
# 1. Clone the repo
git clone <repo-url> && cd easy-chatgpt

# 2. Create config from template
cp .env.example .env

# 3. Edit .env with your API key and preferences
#    If using Ollama locally on the host, set:
#      BASE_URL=http://host.docker.internal:11434/v1
#    (Inside Docker, localhost refers to the container,
#     not your machine — use host.docker.internal instead.)

# 4. Start
docker compose up

# 5. Open http://localhost:6661
```

## Configuration

All config lives in `.env` (gitignored). Variables:

| Variable    | Description                          | Default                                     |
|-------------|--------------------------------------|---------------------------------------------|
| `BASE_URL`  | Base URL of the LLM API              | `https://openrouter.ai/api/v1`              |
| `API_KEY`   | API key for the LLM provider         | _(required)_                                |
| `MODEL`     | Model identifier                     | `qwen/qwen3-coder:free`                     |
| `PORT`      | Port the server listens on           | `6661`                                      |

## Modes

- **Baseline** — no streaming. Toggle off "Stream" in the UI.
- **Streaming** — tokens arrive live via Server-Sent Events. Toggle on (default).

## Development (without Docker)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit .env
python main.py
```
