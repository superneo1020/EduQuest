from __future__ import annotations
import logging
import os
from contextlib import asynccontextmanager
from typing import Any
import asyncio
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
math_problems_cache: Dict[str, List[Dict]] = {
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
    model: str = "gemma4:e2b"
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
    asyncio.create_task(preload_math_task())
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

class GameScoreData(BaseModel):
    user_id: int
    game_scores: list[dict]  # [{"game_type": "MATH", "score": 85, "difficulty": "MEDIUM", "created_at": "2024-01-01"}]

class LearningSuggestions(BaseModel):
    suggestions: list[dict]  # [{"type": "weakness", "title": "...", "description": "..."}]
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

def generate_single_problem_sync(difficulty: str) -> Optional[Dict]:
    topics = ["shopping", "traveling", "farming", "coding", "cooking"]
    selected_topic = random.choice(topics)

    # 這裡放你原本的 diff_rule 判斷...
    if difficulty == "hard":
        diff_rule = "3 numbers and two operations (e.g. multiply then add)."
    elif difficulty == "medium":
        diff_rule = "multiplication or division problem."
    else:
        diff_rule = "simple addition or subtraction problem."

    prompt = (
        f"Generate ONE {difficulty} math problem about {selected_topic}.\n"
        f"Rule: {diff_rule}\n"
        "Return ONLY a JSON object: {\"question\": \"...\", \"answer\": \"10\", \"explanation\": \"...\"}"
    )

    try:
        resp = ollama.chat(model=settings.model, messages=[{"role": "user", "content": prompt}], options={"temperature": 0.1})
        content = resp["message"]["content"].strip()
        match = re.search(r'(\{.*\})', content, re.DOTALL)
        if match:
            data = json.loads(match.group(1))
            data["answer"] = str(data.get("answer", "0"))
            return data
    except Exception as e:
        logger.error(f"Pre-gen single error: {e}")
    return None

async def preload_math_task():
    logger.info("🚀 [Background] 啟動 AI 題庫預熱...")
    difficulties = ["easy", "medium", "hard"]

    for diff in difficulties:
        for i in range(15): # 每個難度生 15 題
            # 使用 run_in_executor 避免同步的 ollama.chat 卡住異步循環
            loop = asyncio.get_event_loop()
            problem = await loop.run_in_executor(None, generate_single_problem_sync, diff)

            if problem:
                math_problems_cache[diff].append(problem)
                if (i + 1) % 5 == 0:
                    logger.info(f"📦 {diff} 題庫已準備: {i+1}/15")

            # 給 CPU 喘息時間，避免 gemma 燒掉
            await asyncio.sleep(0.5)

    logger.info("✅ [Background] 所有難度題庫預熱完成！")


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
async def get_math_problem(difficulty: str = "easy"):
    """取題：優先從快取拿，秒回"""
    if math_problems_cache[difficulty]:
        return math_problems_cache[difficulty].pop(0)

    # 沒題時才現場生
    return generate_single_problem_sync(difficulty)

@app.post("/api/math/check")
async def check_math_answer(req: CheckRequest):
    """判定答案：純 Python 比對，解決『轉很久』的問題"""
    logger.info("⚡ 進行快速本地比對...")
    try:
        # 清理並統一轉為 float 比對
        u_ans = float(re.sub(r'[^\d.]', '', str(req.user_answer)))
        c_ans = float(re.sub(r'[^\d.]', '', str(req.correct_answer)))
        is_right = u_ans == c_ans
    except:
        is_right = str(req.user_answer).strip() == str(req.correct_answer).strip()

    return {
        "is_correct": is_right,
        "feedback": "Correct!" if is_right else "Incorrect."
    }

@app.post("/api/math/explain")
async def explain_math_error(req: CheckRequest):
    """解釋：只有錯了才叫 AI，前端不應等這步完成才關 Loading"""
    logger.info("💡 AI 正在生成錯誤解釋...")
    prompt = (
        f"Question: {req.question}\n"
        f"Correct Answer: {req.correct_answer}\n"
        f"Student Answer: {req.user_answer}\n"
        "Briefly explain the mistake in one sentence."
    )
    try:
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(
            None,
            lambda: ollama.chat(
                model=settings.model,
                messages=[{"role": "user", "content": prompt}],
                options={"num_predict": 50}
            )
        )
        return {"explanation": resp["message"]["content"].strip()}
    except:
        return {"explanation": "Please review your steps."}

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
@app.post("/api/learning/suggestions")
def generate_learning_suggestions(req: GameScoreData):
    logger.info("Generating learning suggestions for user %s...", req.user_id)
    
    # Analyze game scores to create learning suggestions
    prompt = (
        f"Analyze the following game scores for user {req.user_id} and provide personalized learning suggestions:\n"
        f"Game Scores: {json.dumps(req.game_scores)}\n\n"
        "Based on these scores, identify:\n"
        "1. Strengths (subjects/games where user performs well)\n"
        "2. Weaknesses (subjects/games where user struggles)\n"
        "3. Learning patterns and trends\n"
        "4. Specific recommendations for improvement\n\n"
        "Return ONLY a JSON array of suggestion objects with this format:\n"
        "[{\"type\": \"strength|weakness|recommendation\", \"title\": \"...\", \"description\": \"...\", \"priority\": \"high|medium|low\"}]\n"
        "Keep descriptions concise and actionable. Focus on educational improvement."
    )
    
    try:
        resp = ollama.chat(model=settings.model, messages=[{"role": "user", "content": prompt}])
        content = resp["message"]["content"].strip()
        
        # Extract JSON from response
        match = re.search(r'(\[.*\])', content, re.DOTALL)
        if match:
            suggestions = json.loads(match.group(1))
            return LearningSuggestions(suggestions=suggestions)
        
        # Fallback if parsing fails
        fallback_suggestions = [
            {"type": "recommendation", "title": "Continue Learning", "description": "Keep practicing to improve your skills", "priority": "medium"}
        ]
        return LearningSuggestions(suggestions=fallback_suggestions)
        
    except Exception as e:
        logger.error(f"Learning suggestions generation failed: {e}")
        fallback_suggestions = [
            {"type": "recommendation", "title": "Try Different Games", "description": "Explore various game types to find your strengths", "priority": "low"}
        ]
        return LearningSuggestions(suggestions=fallback_suggestions)

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