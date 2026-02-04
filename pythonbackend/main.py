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
    model: str = "llama2"
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

@app.get("/api/math/generate")
def generate_math_ai(difficulty: str = "easy"):
    # 透過隨機關鍵字強制 AI 換題
    topics = ["shopping", "traveling", "farming", "coding", "cooking"]
    selected_topic = random.choice(topics)

    prompt = (
        f"Generate a NEW {difficulty} math word problem about {selected_topic}. "
        "Output ONLY JSON: {\"question\":\"...\",\"answer\":\"...\",\"explanation\":\"...\"}"
    )

    try:
        resp = ollama.chat(model=settings.model, messages=[{"role": "user", "content": prompt}])
        content = resp["message"]["content"].strip()

        # 這是關鍵：強力抓取 {}
        match = re.search(r'(\{.*\})', content, re.DOTALL)
        if match:
            return json.loads(match.group(1))

        # 如果 Llama 2 沒給 JSON 但給了長文字，手動包裝
        if len(content) > 20:
            return {"question": content, "answer": "unknown", "explanation": "Check details in question."}

        raise ValueError("AI Output too short")
    except Exception as e:
        logger.error(f"Generate Failed: {e}")
        # 保底題目也要換，不要永遠 Sarah
        return {
            "question": f"A store has {random.randint(20,50)} eggs and sells 12. How many are left?",
            "answer": "unknown", # 這裡可以寫活
            "explanation": "Subtraction"
        }
@app.post("/api/math/check")
def check_math_answer(req: CheckRequest):
    logger.info("AI checking student's work...")

    prompt = (
        "You are a math tutor. Analyze the following:\n"
        f"Question: {req.question}\n"
        f"Student's Steps: {req.user_steps}\n"
        f"Student's Answer: {req.user_answer}\n"
        f"Correct Answer: {req.correct_answer}\n"
        "Rules: \n"
        "1. Check if the answer and logic are correct.\n"
        "2. Provide friendly feedback.\n"
        "3. Output format must be JSON: {\"is_correct\": true/false, \"feedback\": \"...\"}"
    )

    try:
        resp = ollama.chat(model=settings.model, messages=[{"role": "user", "content": prompt}])
        content = resp["message"]["content"].strip()
        logger.info(f"AI Check Raw Output: {content}")

        # 嘗試從內容中找出 JSON 部分
        match = re.search(r'(\{.*\})', content, re.DOTALL)
        if match:
            json_str = match.group(1)
            # 替換掉可能導致解析失敗的換行符
            json_str = json_str.replace('\n', '\\n').replace('\r', '\\r')
            try:
                return json.loads(json_str)
            except Exception:
                pass # 失敗了就進入下方的備援機制

        # --- 備援機制 (Fallback) ---
        # 如果 JSON 解析失敗，我們手動判斷對錯，並將 AI 的話全部塞進 feedback

        # 簡單數字比對作為對錯判斷
        is_right = str(req.user_answer).strip() == str(req.correct_answer).strip()

        # 清理 content 中的 Markdown 標籤，避免顯示在 Alert 上很醜
        clean_feedback = content.replace("```json", "").replace("```", "").strip()

        return {
            "is_correct": is_right,
            "feedback": clean_feedback if len(clean_feedback) > 0 else "AI 老師給出了回饋，但格式不正確。"
        }

    except Exception as e:
        logger.error(f"Critical Check failed: {e}")
        return {"is_correct": False, "feedback": "AI 老師暫時無法連線，請檢查你的答案是否正確。"}
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