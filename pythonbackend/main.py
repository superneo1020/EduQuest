from __future__ import annotations
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

import ollama
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict
import whisper, tempfile, os
from fastapi import UploadFile, File
import librosa
import numpy as np
import json
import re
import random

whisper_model = None

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        logger.info("Loading Whisper model...")
        whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded")
    return whisper_model

# ---------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )
    host: str = "0.0.0.0"
    port: int = 8000
    model: str = "gemma3"
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])
    log_level: str = "INFO"


settings = Settings()
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("llama-service")

# ---------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Ensuring model %s is available …", settings.model)
    try:
        ollama.pull(settings.model)
    except Exception as e:
        logger.error("Could not pull model: %s", e)
        raise RuntimeError(f"Model {settings.model} unavailable") from e
    logger.info("Model %s ready", settings.model)
    yield
    logger.info("Shutting down")


# ---------------------------------------------------------------------
# App
# ---------------------------------------------------------------------
app = FastAPI(
    title="Local LLaMA-2 API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------
class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10_000)


class ChatResponse(BaseModel):
    response: str

class MathProblem(BaseModel):
    """數學應用題回傳格式"""
    question: str
    options: list[str]
    answer: str
    explanation: str

class CheckRequest(BaseModel):
    question: str
    user_steps: str
    user_answer: str
    correct_answer: Any

class SessionRecord(BaseModel):
    history: list[dict]
# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def chat_sync(prompt: str) -> str:
    try:
        resp = ollama.chat(
            model=settings.model,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp["message"]["content"]
    except Exception as exc:
        logger.exception("ollama error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model inference failed",
        ) from exc


# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest) -> ChatResponse:
    logger.info("Prompt: %s", req.prompt[:50])
    answer = chat_sync(req.prompt)
    logger.info("Answer: %s", answer[:50])
    return ChatResponse(response=answer)


# ---------------------------------------------------------------------
# Streaming endpoint (optional)
# ---------------------------------------------------------------------
from fastapi.responses import StreamingResponse

@app.post("/chat/stream")
def chat_stream(req: ChatRequest) -> StreamingResponse:
    def event_generator():
        stream = ollama.chat(
            model=settings.model,
            messages=[{"role": "user", "content": req.prompt}],
            stream=True,
        )
        for chunk in stream:
            yield f"data: {chunk['message']['content']}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )

@app.get("/api/math/batch_generate")
def batch_generate_math(difficulty: str = "easy", count: int = 10):
    rules = {
        "easy": "addition and subtraction within 100.",
        "medium": "multiplication and division within 200.",
        "hard": "complex two-step operations (e.g. 14 * 5 + 22) with results within 1000."
    }

    prompt = (
        f"Generate {count} math problems for {difficulty} level. Rule: {rules.get(difficulty)}\n"
        "Return ONLY a JSON array of objects: [{\"question\": \"...\", \"answer\": \"...\"}]\n"
        "The 'answer' field must be a string containing only the integer result."
    )

    try:
        resp = ollama.chat(model=settings.model, messages=[{"role": "user", "content": prompt}])
        content = resp["message"]["content"].strip()

        # 使用正則表達式抓取 JSON 部分，避免 AI 廢話
        match = re.search(r'(\[.*\])', content, re.DOTALL)
        if match:
            return json.loads(match.group(1))

        # 如果格式不對，拋出錯誤觸發前端 Fallback
        raise ValueError("AI output format invalid")
    except Exception as e:
        logger.error(f"AI Generation Error: {e}")
        # 保底題目
        return [{"question": "5 + 5", "answer": "10"}] * count

@app.get("/api/math/generate")
def generate_math_ai(difficulty: str = "easy"):
    topics = ["shopping", "traveling", "farming", "coding", "cooking"]
    selected_topic = random.choice(topics)


    if difficulty == "hard":
        diff_rule = "Create a problem with 3 numbers and two operations (e.g., multiply then add). Answer must be a whole number."
    elif difficulty == "medium":
        diff_rule = "Create a multiplication or division problem. Answer must be a whole number."
    else:
        diff_rule = "Create a simple addition or subtraction problem."

    prompt = (
        f"Generate a {difficulty} math problem about {selected_topic}.\n"
        f"Rule: {diff_rule}\n"
        "Return ONLY a JSON object with keys 'question', 'answer', and 'explanation'.\n"
        "Example: {\"question\": \"...\", \"answer\": \"10\", \"explanation\": \"...\"}"
    )

    try:
        resp = ollama.chat(
            model=settings.model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1}
        )
        content = resp["message"]["content"].strip()
        logger.info(f"AI Raw Output ({difficulty}): {content}")

        start = content.find('{')
        end = content.rfind('}')

        if start != -1 and end != -1:
            json_str = content[start:end+1]

            json_str = re.sub(r'[\n\r]', ' ', json_str)
            json_str = re.sub(r',\s*}', '}', json_str)  # Remove trailing commas
            json_str = re.sub(r',\s*]', ']', json_str)  # Remove trailing commas in arrays
            json_str = re.sub(r'\s+', ' ', json_str)    # Normalize whitespace
            json_str = json_str.strip()

            logger.info(f"Cleaned JSON string: {json_str}")

            try:
                data = json.loads(json_str)

                data["answer"] = str(data.get("answer", "0"))
                return data
            except json.JSONDecodeError as e:
                logger.error(f"JSON Parse Error: {e}")

    except Exception as e:
        logger.error(f"AI Fetch Error: {e}")


    return {
        "question": f"A {selected_topic} worker works 8 hours a day for 5 days. How many hours in total?",
        "answer": "40",
        "explanation": "8 * 5 = 40"
    }
@app.post("/api/math/check")
def check_math_answer(req: CheckRequest):
    logger.info("AI checking student's work...")

    # 1. 強化指令，叫 AI 不要廢話
    prompt = (
        "You are a math tutor. Analyze this:\n"
        f"Question: {req.question}\n"
        f"Student's Answer: {req.user_answer}\n"
        f"Correct Answer: {req.correct_answer}\n"
        "--- RULES ---\n"
        "1. Response MUST be a JSON object.\n"
        "2. NO introductory text, NO 'Correct!' mark, NO markdown code blocks.\n"
        "3. Format: {\"is_correct\": true/false, \"feedback\": \"...\"}"
    )

    try:
        resp = ollama.chat(model=settings.model, messages=[{"role": "user", "content": prompt}])
        content = resp["message"]["content"].strip()

        # 2. 這是核心：更強大的過濾網
        # 尋找第一個 '{' 和最後一個 '}' 之間的所有內容
        match = re.search(r'(\{.*\})', content, re.DOTALL)

        if match:
            json_str = match.group(1)
            # 處理掉 AI 有時候會噴出的非法換行符
            json_str = json_str.replace('\n', ' ').replace('\r', ' ')

            try:
                # 嘗試解析
                result = json.loads(json_str)
                # 即使解析成功，我們也要檢查 feedback 裡面有沒有 AI 偷塞的 "Correct!" 字眼
                # 如果有，把它們清理掉，只留重點
                clean_feedback = re.sub(r'^(✅ Correct!|❌ Incorrect!|Correct!|Incorrect!)\s*', '', result['feedback'])
                result['feedback'] = clean_feedback
                return result
            except Exception as e:
                logger.error(f"JSON Parse Error: {e}")

        # --- Fallback (保底機制) ---
        # 如果 Regex 沒抓到，或者 JSON 壞了，我們手動做一個 JSON 傳回前端
        is_right = str(req.user_answer).strip() == str(req.correct_answer).strip()

        # 把 AI 噴出來的廢話洗掉，只拿有用的文字
        simple_feedback = content.split('}')[-1] if '}' in content else content
        simple_feedback = simple_feedback.replace("✅ Correct!", "").replace("❌ Incorrect!", "").strip()

        return {
            "is_correct": is_right,
            "feedback": simple_feedback if len(simple_feedback) > 5 else "Check your calculation steps again."
        }

    except Exception as e:
        logger.error(f"Check failed: {e}")
        return {"is_correct": False, "feedback": "AI server is busy. Please check manually."}

@app.post("/api/math/final_report")
def generate_final_report(req: SessionRecord):
    correct_count = sum(1 for h in req.history if h['is_correct'])

    prompt = (
        f"The student finished {len(req.history)} math problems and got {correct_count} correct.\n"
        f"History: {json.dumps(req.history)}\n"
        "Write a short, encouraging summary (max 80 words) in English. "
        "Mention their strengths and one area to improve."
    )

    try:
        resp = ollama.chat(model=settings.model, messages=[{"role": "user", "content": prompt}])
        return {"summary": resp["message"]["content"].strip(), "accuracy": (correct_count/len(req.history))*100}
    except:
        return {"summary": "Great job! Keep practicing.", "accuracy": 0}
@app.post("/stt")
def speech_to_text(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name

        try:
            # Load audio using librosa (no ffmpeg required)
            audio, sr = librosa.load(tmp_path, sr=16000)

            # Whisper expects audio in float32 format between -1 and 1
            audio = audio.astype(np.float32)
            if audio.max() > 1.0:
                audio = audio / (audio.max() + 1e-9)

            # Use Whisper's transcribe with audio array directly
            model = get_whisper_model()
            result = model.transcribe(audio, language="en")

            os.remove(tmp_path)

            logger.info("STT result: %s", result["text"][:50])
            return {"text": result["text"].strip()}

        except Exception as e:
            logger.exception("STT processing failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Speech recognition failed: {str(e)}"
            ) from e
    except Exception as e:
        logger.exception("STT failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech recognition failed: {str(e)}"
        ) from e