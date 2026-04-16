from __future__ import annotations
import logging
import os
import re
import json
import random
import tempfile
import requests
import whisper

import psycopg2
from psycopg2.extras import execute_values
from typing import Any, List, Dict, Optional
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict
import static_ffmpeg
# ---------------------------------------------------------------------
# Configuration: Gemini 2.5 Flash Lite on Vertex AI
# ---------------------------------------------------------------------
USE_GEMINI_API = True  # Force use of Gemini API instead of Ollama

# Whisper model (lazy loading)
whisper_model = None

static_ffmpeg.add_paths()

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        logger.info("Loading Whisper model (base)...")
        # Forcing CPU if you don't have a dedicated NVIDIA GPU
        whisper_model = whisper.load_model("base", device="cpu")
        logger.info("Whisper model loaded")
    return whisper_model


# ---------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="eduquest_service/.env", env_file_encoding="utf-8", extra="ignore"
    )
    host: str = "0.0.0.0"
    port: int = 8000

    # Gemini Configuration (REQUIRED)
    gemini_api_key: str = "AQ.Ab8RN6LRCyCveOXOfmbpbpGofO_WqyYEjtRRjhGjNvGvpClqRw"  # Your Vertex AI API key
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_location: str = "us-central1"  # or your preferred region
    gemini_project: str = ""  # Optional: for project-specific billing

    # Legacy Ollama config (kept for compatibility, ignored if USE_GEMINI_API=True)
    model: str = "gemma3:latest"  # Fallback only

    cors_origins: list[str] = Field(default_factory=lambda: ["*"])
    log_level: str = "INFO"

    # pgvector Database Configuration
    pg_host: str = "localhost"
    pg_port: int = 5432
    pg_database: str = "eduquestdb"
    pg_user: str = "eduquestuser"
    pg_password: str = "eduquestpass"


settings = Settings()

# Validate Gemini API key
if not settings.gemini_api_key:
    raise ValueError("GEMINI_API_KEY is required. Set it in your .env file or environment.")

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("eduquest-service")

# ---------------------------------------------------------------------
# Gemini API Client
# ---------------------------------------------------------------------
class GeminiClient:
    """Client for Google Gemini 2.5 Flash Lite API on Vertex AI."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash-lite", location: str = "us-central1"):
        self.api_key = api_key
        self.model = model
        self.location = location
        self.base_url = f"https://{location}-aiplatform.googleapis.com/v1"

    def _get_endpoint(self, stream: bool = False) -> str:
        """Generate the API endpoint URL."""
        # Format: publishers/google/models/MODEL:generateContent or streamGenerateContent
        action = "streamGenerateContent" if stream else "generateContent"
        return f"{self.base_url}/publishers/google/models/{self.model}:{action}?key={self.api_key}"

    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048) -> str:
        """
        Generate content using Gemini API (non-streaming).
        """
        url = self._get_endpoint(stream=False)

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": 0.95,
                "topK": 40
            }
        }

        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()

            data = response.json()

            # Extract text from response
            # Response format: {"candidates": [{"content": {"parts": [{"text": "..."}]}}]}
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    return "".join([part.get("text", "") for part in parts])

            logger.warning(f"Unexpected Gemini response format: {data}")
            return ""

        except requests.exceptions.RequestException as e:
            logger.error(f"Gemini API error: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini API error: {str(e)}"
            )

    def generate_stream(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048):
        """
        Generate content using Gemini API (streaming).
        Yields text chunks as they arrive.
        """
        url = self._get_endpoint(stream=True)

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": 0.95,
                "topK": 40
            }
        }

        try:
            with requests.post(url, json=payload, stream=True, timeout=120) as response:
                response.raise_for_status()

                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        # Skip SSE headers
                        if line.startswith('data: '):
                            json_str = line[6:]  # Remove 'data: ' prefix

                            if json_str == '[DONE]':
                                break

                            try:
                                chunk = json.loads(json_str)
                                # Extract text from streaming chunk
                                if "candidates" in chunk and len(chunk["candidates"]) > 0:
                                    candidate = chunk["candidates"][0]
                                    if "content" in candidate and "parts" in candidate["content"]:
                                        for part in candidate["content"]["parts"]:
                                            if "text" in part:
                                                yield part["text"]
                            except json.JSONDecodeError:
                                continue

        except requests.exceptions.RequestException as e:
            logger.error(f"Gemini streaming error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini streaming error: {str(e)}"
            )

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings using Vertex AI text-embedding-005 model.
        Note: Uses separate embedding endpoint.
        """
        # Embedding model uses different endpoint
        embed_url = f"https://{self.location}-aiplatform.googleapis.com/v1/projects/{settings.gemini_project or '-'}/locations/{self.location}/publishers/google/models/text-embedding-005:predict?key={self.api_key}"

        # Batch processing (max 5 per request for embeddings)
        all_embeddings = []
        batch_size = 5

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            payload = {
                "instances": [
                    {"content": text} for text in batch
                ]
            }

            try:
                response = requests.post(embed_url, json=payload, timeout=30)
                response.raise_for_status()

                data = response.json()

                # Extract embeddings from predictions
                if "predictions" in data:
                    for pred in data["predictions"]:
                        if "embeddings" in pred and "values" in pred["embeddings"]:
                            all_embeddings.append(pred["embeddings"]["values"])
                        else:
                            logger.warning(f"Unexpected embedding format: {pred}")
                            all_embeddings.append([0.0] * 768)
                else:
                    logger.warning(f"No predictions in embedding response: {data}")
                    all_embeddings.extend([[0.0] * 768] * len(batch))

                logger.info(f"  Embedded batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")

            except requests.exceptions.RequestException as e:
                logger.error(f"Embedding API error: {e}")
                all_embeddings.extend([[0.0] * 768] * len(batch))

        return all_embeddings


# Initialize Gemini client
gemini_client = GeminiClient(
    api_key=settings.gemini_api_key,
    model=settings.gemini_model,
    location=settings.gemini_location
)

# ---------------------------------------------------------------------
# RAG: pgvector Vector Store
# ---------------------------------------------------------------------
class PgVectorStore:
    """Manages pgvector database operations for RAG."""

    def __init__(self):
        self.conn = None
        self.embedding_dim = 768  # Gemini embeddings are 768-dim
        self._connect()
        self._setup_extensions()

    def _connect(self):
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(
                host=settings.pg_host,
                port=settings.pg_port,
                database=settings.pg_database,
                user=settings.pg_user,
                password=settings.pg_password
            )
            self.conn.autocommit = False
            logger.info(f"✓ Connected to PostgreSQL at {settings.pg_host}")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise

    def _setup_extensions(self):
        """Enable pgvector extension."""
        with self.conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            self.conn.commit()
            logger.info("✓ pgvector extension enabled")

    def create_documents_table(self):
        """Create table for storing documents with vector embeddings."""
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            source_uri TEXT NOT NULL,
            display_name TEXT,
            content TEXT NOT NULL,
            embedding VECTOR({self.embedding_dim}),
            chunk_index INTEGER DEFAULT 0,
            total_chunks INTEGER DEFAULT 1,w
            metadata JSONB DEFAULT '{{}}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create HNSW index for fast similarity search
        CREATE INDEX IF NOT EXISTS idx_documents_embedding
        ON documents
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);

        -- Create index on source_uri for filtering
        CREATE INDEX IF NOT EXISTS idx_documents_source
        ON documents(source_uri);
        """

        with self.conn.cursor() as cur:
            cur.execute(create_table_sql)
            self.conn.commit()
            logger.info("✓ Documents table created with HNSW index")

    def delete_documents_by_source(self, source_uri: str):
        """Delete all documents from a specific source."""
        with self.conn.cursor() as cur:
            cur.execute(
                "DELETE FROM documents WHERE source_uri = %s",
                (source_uri,)
            )
            deleted = cur.rowcount
            self.conn.commit()
            return deleted

    def insert_chunks(self, chunks_data: List[tuple]) -> List[int]:
        """
        Insert chunks with embeddings into PostgreSQL.
        chunks_data: List of (source_uri, display_name, content, embedding_vector, chunk_index, total_chunks)
        """
        insert_sql = """
                     INSERT INTO documents
                     (source_uri, display_name, content, embedding, chunk_index, total_chunks)
                     VALUES %s
                         RETURNING id; \
                     """

        with self.conn.cursor() as cur:
            execute_values(
                cur,
                insert_sql,
                chunks_data,
                template="(%s, %s, %s, %s::vector, %s, %s)",
                fetch=True
            )
            ids = [row[0] for row in cur.fetchall()]
            self.conn.commit()

        return ids

    def similarity_search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
        """Retrieve relevant chunks using cosine similarity."""
        vector_str = f"[{','.join(map(str, query_embedding))}]"

        search_sql = """
                     SELECT
                         id,
                         source_uri,
                         display_name,
                         content,
                         chunk_index,
                         1 - (embedding <=> %s::vector) as similarity_score
                     FROM documents
                     ORDER BY embedding <=> %s::vector
                         LIMIT %s; \
                     """

        with self.conn.cursor() as cur:
            cur.execute(search_sql, (vector_str, vector_str, top_k))
            rows = cur.fetchall()

        return [
            {
                "id": row[0],
                "source_uri": row[1],
                "display_name": row[2],
                "content": row[3],
                "chunk_index": row[4],
                "similarity_score": float(row[5])
            }
            for row in rows
        ]

# ---------------------------------------------------------------------
# RAG: Document Processor (Using Gemini Embeddings)
# ---------------------------------------------------------------------
class DocumentProcessor:
    """Handles document chunking and embedding generation using Gemini/Vertex AI."""

    def __init__(self):
        self.client = gemini_client
        logger.info("✓ Using Gemini/Vertex AI for embeddings (text-embedding-005)")

    def chunk_document(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split document into overlapping chunks."""
        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(start + chunk_size, text_length)
            # Try to break at a sentence or word boundary
            if end < text_length:
                for i in range(min(end, text_length - 1), start, -1):
                    if text[i] in '.!?\n' and i - start > chunk_size * 0.5:
                        end = i + 1
                        break

            chunks.append(text[start:end].strip())
            start = end - overlap

        return chunks

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using the standard Google AI API (Fixes 403 error)."""
        # Standard URL for API Key usage
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.gemini_api_key}"

        all_embeddings = []
        for text in texts:
            payload = {
                "model": "models/text-embedding-004",
                "content": {
                    "parts": [{"text": text}]
                }
            }
            try:
                response = requests.post(url, json=payload, timeout=30)
                response.raise_for_status()
                data = response.json()

                if "embedding" in data:
                    all_embeddings.append(data["embedding"]["values"])
                else:
                    logger.error(f"Unexpected response: {data}")
                    # Fallback to zero-vector to prevent crash
                    all_embeddings.append([0.0] * 768)

            except Exception as e:
                logger.error(f"❌ Embedding API error: {e}")
                raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

        return all_embeddings

class RAGService:
    """Complete RAG pipeline with pgvector backend."""

    def __init__(self):
        self.db = PgVectorStore()
        # Ensure the table and pgvector extension exist on startup
        self.db.create_documents_table()

    def _extract_pdf_text(self, file_path: str) -> str:
        """Helper to extract text from PDF using pdfplumber."""
        import pdfplumber
        text_content = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(page_text)
            return "\n\n".join(text_content)
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            raise ValueError(f"Could not read PDF: {str(e)}")

    def upload_document(self, file_path: str, display_name: Optional[str] = None) -> Dict:
        """
        Refined upload pipeline: Extract -> Smart Chunk -> Batch Embed -> SQL Insert.
        """
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

        file_ext = Path(file_path).suffix.lower()
        # Use a consistent naming convention for the source
        source_uri = os.path.basename(file_path)
        display_name = display_name or source_uri

        # 1. Extraction
        try:
            if file_ext == '.pdf':
                text = self._extract_pdf_text(file_path)
            elif file_ext in ['.txt', '.md', '.json']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                raise ValueError(f"Unsupported extension: {file_ext}")
        except Exception as e:
            logger.error(f"Extraction error: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Document is empty")

        # 2. Smart Chunking (Recursive-style overlap)
        # We split by double newline first to preserve paragraphs
        raw_chunks = text.split("\n\n")
        chunks = []
        current_chunk = ""
        max_chars = 1000

        for part in raw_chunks:
            if len(current_chunk) + len(part) < max_chars:
                current_chunk += part + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = part + "\n\n"
        if current_chunk:
            chunks.append(current_chunk.strip())

        # 3. Batch Embeddings (Prevents overloading the API)
        logger.info(f"Generating embeddings for {len(chunks)} chunks...")
        embeddings = gemini_client.get_embeddings(chunks)

        # 4. Prepare and Insert
        chunks_data = []
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            # Format as Postgres-friendly vector string
            vector_str = f"[{','.join(map(str, embedding))}]"
            chunks_data.append((
                source_uri,
                display_name,
                chunk,
                vector_str,
                idx,
                len(chunks)
            ))

        # Perform the DB operation
        try:
            # Optional: Clear old version of this specific file
            self.db.delete_documents_by_source(source_uri)
            self.db.insert_chunks(chunks_data)
        except Exception as e:
            logger.error(f"Database insertion failed: {e}")
            raise HTTPException(status_code=500, detail="Database save failed")

        return {
            "document_name": display_name,
            "chunks_uploaded": len(chunks),
            "status": "success"
        }

    def query(self, question: str, top_k: int = 5) -> Dict:
        """Enhanced query logic with context construction."""
        try:
            # 1. Embed the user question
            question_embedding = gemini_client.get_embeddings([question])[0]

            # 2. Semantic Search
            results = self.db.similarity_search(question_embedding, top_k)

            if not results:
                return {"answer": "I couldn't find any relevant information in the uploaded documents.", "sources": []}

            # 3. Context Construction
            context_block = "\n---\n".join([r['content'] for r in results])

            # 4. Prompt Engineering
            prompt = (
                f"You are a helpful educational assistant. Use the following snippets from "
                f"documents to answer the question. If the answer isn't in the context, say so.\n\n"
                f"CONTEXT:\n{context_block}\n\n"
                f"QUESTION: {question}\n\n"
                f"ANSWER:"
            )

            answer = gemini_client.generate(prompt, temperature=0.3)

            return {
                "answer": answer,
                "contexts": results,
                "sources": list(set([r['display_name'] for r in results]))
            }
        except Exception as e:
            logger.error(f"RAG Query failed: {e}")
            raise HTTPException(status_code=500, detail="Search failed")

# ---------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_service

    logger.info("Initializing EduQuest AI Service with Gemini 2.5 Flash Lite...")

    # Verify Gemini API connectivity
    try:
        test_response = gemini_client.generate("Hello", max_tokens=10)
        logger.info("✓ Gemini API connection verified")
    except Exception as e:
        logger.error(f"Gemini API connection failed: {e}")
        raise RuntimeError("Cannot connect to Gemini API. Check your API key.") from e

    # Initialize RAG service
    try:
        rag_service = RAGService()
        logger.info("✓ RAG service initialized with pgvector")
    except Exception as e:
        logger.warning(f"RAG service not available: {e}")
        rag_service = None

    yield

    logger.info("Shutting down")

# ---------------------------------------------------------------------
# App
# ---------------------------------------------------------------------
app = FastAPI(
    title="EduQuest AI Service with Gemini 2.5 Flash Lite",
    version="1.0.0",
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
    game_scores: list[dict]

class LearningSuggestions(BaseModel):
    suggestions: list[dict]

class AvatarRequest(BaseModel):
    avatar: str

class AvatarResponse(BaseModel):
    avatar: str

# RAG Schemas
class RAGUploadRequest(BaseModel):
    file_path: str = Field(..., description="Local file path to upload")
    display_name: Optional[str] = Field(None, description="Optional display name")

class RAGUploadResponse(BaseModel):
    document_name: str
    chunks_uploaded: int
    total_chunks: int
    source_uri: str

class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)

class RAGQueryResponse(BaseModel):
    answer: str
    contexts: list[dict]
    sources: list[str]

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def generate_with_gemini(prompt: str, temperature: float = 0.7) -> str:
    """Helper to generate text using Gemini API."""
    return gemini_client.generate(prompt, temperature=temperature)

# ---------------------------------------------------------------------
# Chat Routes (Using Gemini)
# ---------------------------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest) -> ChatResponse:
    logger.info("Prompt: %s", req.prompt[:50])
    answer = gemini_client.generate(req.prompt, temperature=0.7)
    logger.info("Answer: %s", answer[:50])
    return ChatResponse(response=answer)

@app.post("/chat/stream")
def chat_stream(req: ChatRequest) -> StreamingResponse:
    def event_generator():
        for chunk in gemini_client.generate_stream(req.prompt, temperature=0.7):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )

# ---------------------------------------------------------------------
# RAG Routes
# ---------------------------------------------------------------------
@app.post("/rag/upload", response_model=RAGUploadResponse)
def rag_upload(req: RAGUploadRequest):
    """
    Upload a document to the RAG knowledge base.
    Supports PDF, TXT, MD, JSON files.
    """
    if rag_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service not available. Check database configuration."
        )

    try:
        result = rag_service.upload_document(req.file_path, req.display_name)
        return RAGUploadResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.exception("RAG upload error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@app.post("/rag/upload-file")
def rag_upload_file(file: UploadFile = File(...), display_name: Optional[str] = None):
    """
    Upload a file directly via HTTP to the RAG knowledge base.
    """
    if rag_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service not available"
        )

    # Save uploaded file to temp location
    suffix = Path(file.filename).suffix if file.filename else ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name

    try:
        result = rag_service.upload_document(tmp_path, display_name or file.filename)
        return RAGUploadResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )
    finally:
        os.unlink(tmp_path)

@app.post("/rag/query", response_model=RAGQueryResponse)
def rag_query(req: RAGQueryRequest):
    """
    Query the RAG system: retrieves relevant documents and generates answer.
    """
    if rag_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service not available"
        )

    try:
        result = rag_service.query(req.question, req.top_k)
        return RAGQueryResponse(**result)
    except Exception as e:
        logger.exception("RAG query error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )

@app.get("/rag/status")
def rag_status():
    """Check RAG service status."""
    return {
        "rag_available": rag_service is not None,
        "using_gemini": True,
        "embedding_model": "text-embedding-005",
        "llm_model": settings.gemini_model,
        "database": f"{settings.pg_host}:{settings.pg_port}/{settings.pg_database}" if rag_service else None
    }

# ---------------------------------------------------------------------
# Math Routes (Using Gemini)
# ---------------------------------------------------------------------
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
        content = gemini_client.generate(prompt, temperature=0.7)
        content = content.strip()

        match = re.search(r'(\[.*\])', content, re.DOTALL)
        if match:
            return json.loads(match.group(1))

        raise ValueError("AI output format invalid")
    except Exception as e:
        logger.error(f"AI Generation Error: {e}")
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
        content = gemini_client.generate(prompt, temperature=0.1)
        content = content.strip()
        logger.info(f"AI Raw Output ({difficulty}): {content}")

        start = content.find('{')
        end = content.rfind('}')

        if start != -1 and end != -1:
            json_str = content[start:end+1]

            json_str = re.sub(r'[\n\r]', ' ', json_str)
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            json_str = re.sub(r'\s+', ' ', json_str)
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
        content = gemini_client.generate(prompt, temperature=0.1)
        content = content.strip()

        match = re.search(r'(\{.*\})', content, re.DOTALL)

        if match:
            json_str = match.group(1)
            json_str = json_str.replace('\n', ' ').replace('\r', ' ')

            try:
                result = json.loads(json_str)
                clean_feedback = re.sub(r'^(✅ Correct!|❌ Incorrect!|Correct!|Incorrect!)\s*', '', result['feedback'])
                result['feedback'] = clean_feedback
                return result
            except Exception as e:
                logger.error(f"JSON Parse Error: {e}")

        is_right = str(req.user_answer).strip() == str(req.correct_answer).strip()
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
        summary = gemini_client.generate(prompt, temperature=0.7)
        return {"summary": summary.strip(), "accuracy": (correct_count/len(req.history))*100}
    except:
        return {"summary": "Great job! Keep practicing.", "accuracy": 0}

@app.post("/api/learning/suggestions")
def generate_learning_suggestions(req: GameScoreData):
    logger.info("Generating learning suggestions for user %s...", req.user_id)

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
        content = gemini_client.generate(prompt, temperature=0.7)
        content = content.strip()

        match = re.search(r'(\[.*\])', content, re.DOTALL)
        if match:
            suggestions = json.loads(match.group(1))
            return LearningSuggestions(suggestions=suggestions)

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
async def speech_to_text(file: UploadFile = File(...)):
    """
    Windows-optimized STT: Solves the 'End of File' and 'Locked File' errors.
    """
    tmp_path = None
    try:
        # Create a persistent temp file path
        # We don't use the 'with' block here to ensure we control exactly
        # when the file is opened and closed.
        fd, tmp_path = tempfile.mkstemp(suffix=".wav")

        try:
            # Write the uploaded content and CLOSE the file immediately
            # This 'unlocks' the file so FFmpeg can read it.
            with os.fdopen(fd, 'wb') as tmp:
                content = await file.read()
                tmp.write(content)

            # Now that the file is closed and saved to disk, Whisper can call FFmpeg safely
            model = get_whisper_model()

            # fp16=False is REQUIRED for CPU processing on Windows
            result = model.transcribe(tmp_path, fp16=False)

            return {"text": result["text"].strip()}

        finally:
            # Cleanup: Manually delete the temp file after transcription
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    except Exception as e:
        logger.error(f"STT Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Speech recognition failed: {str(e)}"
        )

# ---------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)