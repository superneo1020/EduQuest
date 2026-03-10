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
import threading
import time

whisper_model = None
math_queues = {
    "easy": [],
    "medium": [],
    "hard": []
}

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
logger = logging.getLogger("gemma-service")

# ---------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Ensuring model %s is available …", settings.model)
    ollama.pull(settings.model)

    # 確保執行緒啟動
    for diff in ["easy", "medium", "hard"]:
        logger.info(f"Spawning thread for {diff}")
        threading.Thread(target=refill_queue, args=(diff,), daemon=True).start()
    yield


# ---------------------------------------------------------------------
# App
# ---------------------------------------------------------------------
app = FastAPI(
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
# Math Logic (核心生成)
# ---------------------------------------------------------------------
def generate_math_ai_logic(difficulty: str = "easy"):
    # 限制解釋長度，防止模型因為輸出過長而截斷 JSON
    prompt = (
        f"Create ONE {difficulty} math problem. "
        "Strictly return ONLY a JSON object. "
        "Format: {\"question\": \"string\", \"answer\": \"string\", \"explanation\": \"string\"}. "
        "No conversational text, no backticks, no markdown. "
        "Keep the explanation concise (under 50 words)."
    )

    try:
        resp = ollama.chat(
            model=settings.model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.7, "num_predict": 400}
        )
        content = resp["message"]["content"].strip()

        # 尋找第一個 { 到最後一個 }
        start = content.find('{')
        end = content.rfind('}')

        if start != -1 and end != -1:
            json_str = content[start:end+1]
            try:
                data = json.loads(json_str)
                return data
            except json.JSONDecodeError:
                # 嘗試簡單修正：補上缺失的結尾
                if not json_str.endswith('}'):
                    json_str += '}'
                    return json.loads(json_str)

        logger.error(f"Failed to extract JSON from: {content}")
        return None
    except Exception as e:
        logger.error(f"Generation error: {e}")
        return None

is_refilling = {"easy": False, "medium": False, "hard": False}
def refill_queue(difficulty: str = "easy"):
    global math_queues, is_refilling
    if is_refilling[difficulty]: return

    is_refilling[difficulty] = True
    logger.info(f"Starting background refill for: {difficulty}") # 新增這行
    try:
        while len(math_queues[difficulty]) < 5:
            logger.info(f"Refilling {difficulty} queue... Current size: {len(math_queues[difficulty])}")
            new_prob = generate_math_ai_logic(difficulty)
            if new_prob:
                math_queues[difficulty].append(new_prob)
            else:
                logger.error(f"Failed to generate {difficulty} problem. Retrying in 5s...")
                time.sleep(5) # 失敗時暫停久一點
    finally:
        is_refilling[difficulty] = False
    logger.info(f"{difficulty.capitalize()} queue refill complete.")


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

@app.post("/api/math/init_session")
def init_session(difficulty: str):
    global math_queues
    if difficulty not in math_queues: difficulty = "easy"

    math_queues[difficulty] = []
    logger.info(f"Generating 10 {difficulty} problems...")

    # 這裡直接循環生成，不要再開 Thread，因為這是一個初始化請求
    for _ in range(10):
        problem = generate_math_ai_logic(difficulty)
        if problem:
            problem["difficulty"] = difficulty
            math_queues[difficulty].append(problem)

    return {"status": "success", "count": len(math_queues[difficulty])}

@app.get("/api/math/generate")
def get_math_on_demand(difficulty: str = "easy"):
    # 增加 Log，看看是否有確實進入此函式
    logger.info(f"--- 請求生成題目: {difficulty} ---")
    problem = generate_math_ai_logic(difficulty)

    if problem:
        problem["difficulty"] = difficulty
        logger.info(f"--- 生成成功: {problem['question'][:30]}... ---")
        return problem

    logger.error("--- 生成失敗，返回 500 ---")
    raise HTTPException(status_code=500, detail="Failed to generate question")

@app.post("/api/math/check")
def check_math_answer(req: CheckRequest):
    clean_user = str(req.user_answer).strip().lower().replace(" ", "")
    clean_correct = str(req.correct_answer).strip().lower().replace(" ", "")

    # 先做硬核判斷
    is_correct_logic = (clean_user == clean_correct)

    # 強化 Prompt，要求 AI 必須解釋「為什麼」
    prompt = (
        f"Math Teacher Mode. \n"
        f"Question: {req.question}\n"
        f"Student Answer: {req.user_answer}\n"
        f"Correct Answer: {req.correct_answer}\n"
        "--- TASK ---\n"
        "1. Compare values. \n"
        "2. If wrong, explain the subtraction/addition error step-by-step.\n"
        "3. If right, give a short praise.\n"
        "--- OUTPUT FORMAT (STRICT JSON) ---\n"
        "{\"is_correct\": bool, \"feedback\": \"Your explanation here\"}"
    )

    try:
        resp = ollama.chat(
            model=settings.model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.3} # 判斷時保持低隨機性
        )
        content = resp["message"]["content"].strip()
        match = re.search(r'(\{.*\})', content, re.DOTALL)

        if match:
            result = json.loads(match.group(1))
            # 修正：確保 feedback 欄位一定存在
            if "feedback" not in result:
                result["feedback"] = "Good attempt!" if is_correct_logic else f"The answer should be {req.correct_answer}."
            return result

    except Exception as e:
        logger.error(f"Check error: {e}")

    # 保底回傳
    return {
        "is_correct": is_correct_logic,
        "feedback": f"The correct calculation is: {req.question.replace('?', '')} = {req.correct_answer}"
    }

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
