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
from datetime import datetime  # FIXED: Added import

from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict
import static_ffmpeg

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# ---------------------------------------------------------------------
# Configuration: Gemini 2.5 Flash Lite for LLM, Ollama for Embeddings
# ---------------------------------------------------------------------
USE_GEMINI_API = True  # Force use of Gemini API instead of Ollama for LLM

# Ollama Configuration for Embeddings
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

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

    # Gemini Configuration (REQUIRED for LLM)
    gemini_api_key: str = "AQ.Ab8RN6LRCyCveOXOfmbpbpGofO_WqyYEjtRRjhGjNvGvpClqRw"  # Your Vertex AI API key
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_location: str = "us-central1"  # or your preferred region
    gemini_project: str = ""

    # Ollama Configuration for Embeddings
    ollama_host: str = "http://localhost:11434"
    ollama_embed_model: str = "nomic-embed-text"

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
# Ollama Embedding Client (New - for local embeddings)
# ---------------------------------------------------------------------
class OllamaEmbeddingClient:
    """Client for Ollama embedding API using nomic-embed-text or similar."""

    def __init__(self, host: str = "http://localhost:11434", model: str = "nomic-embed-text"):
        self.host = host.rstrip('/')
        self.model = model
        self.embedding_dim = 768  # nomic-embed-text outputs 768 dimensions

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings using Ollama's /api/embeddings endpoint.
        Supports batch processing by making individual calls (Ollama handles one at a time).
        """
        embeddings = []

        for i, text in enumerate(texts):
            try:
                url = f"{self.host}/api/embeddings"
                payload = {
                    "model": self.model,
                    "prompt": text
                }

                response = requests.post(url, json=payload, timeout=60)
                response.raise_for_status()

                data = response.json()
                if "embedding" in data:
                    embeddings.append(data["embedding"])
                    logger.info(f"  Embedded chunk {i+1}/{len(texts)}")
                else:
                    logger.warning(f"No embedding in response for chunk {i+1}: {data}")
                    embeddings.append([0.0] * self.embedding_dim)

            except requests.exceptions.RequestException as e:
                logger.error(f"Ollama embedding error for chunk {i+1}: {e}")
                embeddings.append([0.0] * self.embedding_dim)

        return embeddings

    def get_embedding_dim(self) -> int:
        return self.embedding_dim


# ---------------------------------------------------------------------
# Gemini API Client (For LLM - unchanged)
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


# Initialize clients
gemini_client = GeminiClient(
    api_key=settings.gemini_api_key,
    model=settings.gemini_model,
    location=settings.gemini_location
)

ollama_embed_client = OllamaEmbeddingClient(
    host=settings.ollama_host,
    model=settings.ollama_embed_model
)

# ---------------------------------------------------------------------
# RAG: pgvector Vector Store with Separate Documents Table
# ---------------------------------------------------------------------
class PgVectorStore:
    """Manages pgvector database operations for RAG with separate documents and chunks tables."""

    def __init__(self):
        self.conn = None
        self.embedding_dim = ollama_embed_client.get_embedding_dim()  # 768 for nomic-embed-text
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

    def create_tables(self):
        """Create separate tables for documents (metadata) and chunks (vectors)."""

        # Documents table - stores document metadata
        create_documents_table_sql = """
                                     CREATE TABLE IF NOT EXISTS documents (
                                                                              id SERIAL PRIMARY KEY,
                                                                              source_uri TEXT NOT NULL UNIQUE,
                                                                              display_name TEXT,
                                                                              file_type TEXT,
                                                                              total_pages INTEGER DEFAULT 0,
                                                                              total_chunks INTEGER DEFAULT 0,
                                                                              metadata JSONB DEFAULT '{}',
                                                                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                     );

                                     -- Index on source_uri for fast lookups
                                     CREATE INDEX IF NOT EXISTS idx_documents_source_uri
                                         ON documents(source_uri); \
                                     """

        # Chunks table - stores text chunks with embeddings
        create_chunks_table_sql = f"""
        CREATE TABLE IF NOT EXISTS document_chunks (
            id SERIAL PRIMARY KEY,
            document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            embedding VECTOR({self.embedding_dim}),
            chunk_index INTEGER DEFAULT 0,
            page_number INTEGER DEFAULT 0,
            metadata JSONB DEFAULT '{{}}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- HNSW index for fast similarity search
        CREATE INDEX IF NOT EXISTS idx_chunks_embedding
        ON document_chunks
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);

        -- Index for filtering by document
        CREATE INDEX IF NOT EXISTS idx_chunks_document_id
        ON document_chunks(document_id);
        """

        with self.conn.cursor() as cur:
            cur.execute(create_documents_table_sql)
            cur.execute(create_chunks_table_sql)
            self.conn.commit()
            logger.info("✓ Documents and chunks tables created with HNSW index")

    def insert_document(self, source_uri: str, display_name: str, file_type: str,
                        total_pages: int, total_chunks: int, metadata: dict = None) -> int:
        """Insert document metadata and return document_id."""
        insert_sql = """
                     INSERT INTO documents (source_uri, display_name, file_type, total_pages, total_chunks, metadata)
                     VALUES (%s, %s, %s, %s, %s, %s)
                         ON CONFLICT (source_uri) 
            DO UPDATE SET
                         display_name = EXCLUDED.display_name,
                                            total_pages = EXCLUDED.total_pages,
                                            total_chunks = EXCLUDED.total_chunks,
                                            metadata = EXCLUDED.metadata,
                                            updated_at = CURRENT_TIMESTAMP
                                            RETURNING id; \
                     """

        with self.conn.cursor() as cur:
            cur.execute(insert_sql, (source_uri, display_name, file_type, total_pages, total_chunks, json.dumps(metadata or {})))
            doc_id = cur.fetchone()[0]
            self.conn.commit()
            return doc_id

    def insert_chunks(self, document_id: int, chunks_data: List[tuple]) -> List[int]:
        """
        Insert chunks with embeddings into PostgreSQL.
        chunks_data: List of (content, embedding_vector, chunk_index, page_number, metadata)
        """
        insert_sql = """
                     INSERT INTO document_chunks
                         (document_id, content, embedding, chunk_index, page_number, metadata)
                     VALUES %s
                         RETURNING id; \
                     """

        # Format: (document_id, content, embedding::vector, chunk_index, page_number, metadata)
        formatted_data = [
            (document_id, content, f"[{','.join(map(str, embedding))}]", chunk_idx, page_num, json.dumps(meta or {}))
            for content, embedding, chunk_idx, page_num, meta in chunks_data
        ]

        with self.conn.cursor() as cur:
            execute_values(
                cur,
                insert_sql,
                formatted_data,
                template="(%s, %s, %s::vector, %s, %s, %s)",
                fetch=True
            )
            ids = [row[0] for row in cur.fetchall()]
            self.conn.commit()

            # Update total_chunks in documents table
            cur.execute(
                "UPDATE documents SET total_chunks = %s WHERE id = %s",
                (len(chunks_data), document_id)
            )
            self.conn.commit()

        return ids

    def delete_document_by_source(self, source_uri: str) -> tuple[bool, Optional[int]]:
        """Delete document and all its chunks by source URI (cascade delete)."""
        logger.info(f"[DELETE] Starting delete operation for source_uri: '{source_uri}'")

        with self.conn.cursor() as cur:
            # First get the document ID before deleting
            logger.info(f"[DELETE] Executing SELECT to find document ID for source_uri: '{source_uri}'")
            cur.execute("SELECT id FROM documents WHERE source_uri = %s", (source_uri,))
            result = cur.fetchone()

            logger.info(f"[DELETE] SELECT result: {result}")

            if not result:
                logger.warning(f"[DELETE] No document found with source_uri: '{source_uri}'")
                # Let's check what documents exist
                cur.execute("SELECT source_uri FROM documents LIMIT 5")
                existing = cur.fetchall()
                logger.info(f"[DELETE] Existing documents in DB: {[r[0] for r in existing]}")
                return False, None

            doc_id = result[0]
            logger.info(f"[DELETE] Found document ID: {doc_id}")

            # Count chunks before deletion for logging
            cur.execute("SELECT COUNT(*) FROM document_chunks WHERE document_id = %s", (doc_id,))
            chunk_count = cur.fetchone()[0]
            logger.info(f"[DELETE] Document has {chunk_count} chunks that will be cascade deleted")

            # Delete will cascade to chunks due to ON DELETE CASCADE
            # Use RETURNING to get the ID back, but check rowcount properly
            logger.info(f"[DELETE] Executing DELETE for source_uri: '{source_uri}'")
            cur.execute("DELETE FROM documents WHERE source_uri = %s RETURNING id", (source_uri,))
            deleted_row = cur.fetchone()
            self.conn.commit()

            logger.info(f"[DELETE] DELETE result (deleted_row): {deleted_row}")

            # If we got a row back, deletion was successful
            success = deleted_row is not None
            logger.info(f"[DELETE] Deletion successful: {success}, deleted_doc_id: {doc_id}")

            return success, doc_id

    def get_document_by_source(self, source_uri: str) -> Optional[Dict]:
        """Get document metadata by source URI."""
        with self.conn.cursor() as cur:
            cur.execute(
                "SELECT id, source_uri, display_name, file_type, total_pages, total_chunks, created_at FROM documents WHERE source_uri = %s",
                (source_uri,)
            )
            row = cur.fetchone()
            if row:
                return {
                    "id": row[0],
                    "source_uri": row[1],
                    "display_name": row[2],
                    "file_type": row[3],
                    "total_pages": row[4],
                    "total_chunks": row[5],
                    "created_at": row[6]
                }
            return None

    def similarity_search(self, query_embedding: List[float], top_k: int = 5,
                          document_id: Optional[int] = None) -> List[Dict]:
        """Retrieve relevant chunks using cosine similarity, optionally filtered by document."""
        vector_str = f"[{','.join(map(str, query_embedding))}]"

        if document_id:
            # Search within specific document
            search_sql = """
                         SELECT
                             dc.id,
                             dc.document_id,
                             d.source_uri,
                             d.display_name,
                             dc.content,
                             dc.chunk_index,
                             dc.page_number,
                             1 - (dc.embedding <=> %s::vector) as similarity_score
                         FROM document_chunks dc
                                  JOIN documents d ON dc.document_id = d.id
                         WHERE dc.document_id = %s
                         ORDER BY dc.embedding <=> %s::vector
                             LIMIT %s; \
                         """
            params = (vector_str, document_id, vector_str, top_k)
        else:
            # Search across all documents
            search_sql = """
                         SELECT
                             dc.id,
                             dc.document_id,
                             d.source_uri,
                             d.display_name,
                             dc.content,
                             dc.chunk_index,
                             dc.page_number,
                             1 - (dc.embedding <=> %s::vector) as similarity_score
                         FROM document_chunks dc
                                  JOIN documents d ON dc.document_id = d.id
                         ORDER BY dc.embedding <=> %s::vector
                             LIMIT %s; \
                         """
            params = (vector_str, vector_str, top_k)

        with self.conn.cursor() as cur:
            cur.execute(search_sql, params)
            rows = cur.fetchall()

        return [
            {
                "chunk_id": row[0],
                "document_id": row[1],
                "source_uri": row[2],
                "display_name": row[3],
                "content": row[4],
                "chunk_index": row[5],
                "page_number": row[6],
                "similarity_score": float(row[7])
            }
            for row in rows
        ]

    def list_documents(self) -> List[Dict]:
        """List all documents with metadata."""
        with self.conn.cursor() as cur:
            cur.execute("""
                        SELECT id, source_uri, display_name, file_type, total_pages, total_chunks, created_at
                        FROM documents
                        ORDER BY created_at DESC
                        """)
            rows = cur.fetchall()

        return [
            {
                "id": row[0],
                "source_uri": row[1],
                "display_name": row[2],
                "file_type": row[3],
                "total_pages": row[4],
                "total_chunks": row[5],
                "created_at": row[6]
            }
            for row in rows
        ]


# ---------------------------------------------------------------------
# RAG: Document Processor using LangChain + Ollama Embeddings
# ---------------------------------------------------------------------
class DocumentProcessor:
    """Handles document processing using LangChain loaders and Ollama embeddings."""

    def __init__(self):
        self.embed_client = ollama_embed_client
        logger.info("✓ Using Ollama for embeddings (%s)", settings.ollama_embed_model)

        # LangChain text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def load_document(self, file_path: str) -> List[Document]:
        """Load document using LangChain loaders (PDF or text)."""
        file_ext = Path(file_path).suffix.lower()

        try:
            if file_ext == '.pdf':
                # Use LangChain PyPDFLoader - extracts text only
                loader = PyPDFLoader(file_path, extract_images=False)
                documents = loader.load()
                logger.info(f"✓ Loaded PDF with {len(documents)} pages")
                return documents
            elif file_ext in ['.txt', '.md']:
                loader = TextLoader(file_path, encoding='utf-8')
                documents = loader.load()
                return documents
            elif file_ext == '.json':
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    # Convert JSON to text representation
                    text_content = json.dumps(content, indent=2)
                    return [Document(page_content=text_content, metadata={"source": file_path})]
            else:
                raise ValueError(f"Unsupported file extension: {file_ext}")

        except Exception as e:
            logger.error(f"Document loading failed: {e}")
            raise

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks using LangChain text splitter."""
        if not documents:
            return []

        chunks = self.text_splitter.split_documents(documents)
        logger.info(f"✓ Split into {len(chunks)} chunks")
        return chunks

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Ollama (nomic-embed-text)."""
        return self.embed_client.get_embeddings(texts)


class RAGService:
    """Complete RAG pipeline with LangChain + pgvector + Ollama embeddings + Gemini LLM."""

    def __init__(self):
        self.db = PgVectorStore()
        self.processor = DocumentProcessor()
        # Ensure tables exist on startup
        self.db.create_tables()

    def upload_document(self, file_path: str, display_name: Optional[str] = None) -> Dict:
        """
        Upload pipeline: Load with LangChain -> Split -> Embed with Ollama -> Store in pgvector.
        Stores documents and chunks in separate tables.
        """
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

        source_uri = os.path.basename(file_path)
        display_name = display_name or source_uri
        file_ext = Path(file_path).suffix.lower()

        # 1. Load document using LangChain (extracts text only from PDF)
        try:
            documents = self.processor.load_document(file_path)
            if not documents:
                raise ValueError("No content extracted from document")
        except Exception as e:
            logger.error(f"Loading error: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to load document: {str(e)}")

        # 2. Split into chunks using LangChain
        chunks = self.processor.split_documents(documents)
        if not chunks:
            raise HTTPException(status_code=400, detail="No chunks generated from document")

        # 3. Extract texts and metadata from chunks
        texts = [chunk.page_content for chunk in chunks]
        total_pages = len(documents)

        # 4. Generate embeddings using Ollama
        logger.info(f"Generating embeddings for {len(texts)} chunks using Ollama...")
        embeddings = self.processor.generate_embeddings(texts)

        # 5. Insert document metadata first
        doc_metadata = {
            "original_path": file_path,
            "processed_at": str(datetime.now())
        }
        document_id = self.db.insert_document(
            source_uri=source_uri,
            display_name=display_name,
            file_type=file_ext.lstrip('.'),
            total_pages=total_pages,
            total_chunks=len(chunks),
            metadata=doc_metadata
        )

        # 6. Prepare chunks data with page numbers from metadata
        chunks_data = []
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            page_num = chunk.metadata.get('page', 0) if hasattr(chunk, 'metadata') else 0
            chunk_meta = {
                "source": chunk.metadata.get('source', source_uri) if hasattr(chunk, 'metadata') else source_uri
            }
            chunks_data.append((
                chunk.page_content,
                embedding,
                idx,
                page_num,
                chunk_meta
            ))

        # 7. Insert chunks
        try:
            chunk_ids = self.db.insert_chunks(document_id, chunks_data)
        except Exception as e:
            logger.error(f"Chunk insertion failed: {e}")
            # Rollback document if chunks fail
            self.db.delete_document_by_source(source_uri)
            raise HTTPException(status_code=500, detail="Failed to store document chunks")

        return {
            "document_id": document_id,
            "document_name": display_name,
            "source_uri": source_uri,
            "file_type": file_ext.lstrip('.'),
            "total_pages": total_pages,
            "chunks_uploaded": len(chunks),
            "chunk_ids": chunk_ids,
            "status": "success"
        }

    def query(self, question: str, top_k: int = 5, document_id: Optional[int] = None) -> Dict:
        """Query the RAG system using Ollama embeddings for retrieval and Gemini for generation."""
        try:
            # 1. Embed the user question using Ollama
            question_embedding = ollama_embed_client.get_embeddings([question])[0]

            # 2. Semantic Search (optionally filtered by document_id)
            results = self.db.similarity_search(question_embedding, top_k, document_id)

            if not results:
                return {
                    "answer": "I couldn't find any relevant information in the uploaded documents.",
                    "contexts": [],
                    "sources": []
                }

            # 3. Context Construction
            context_block = "\n---\n".join([r['content'] for r in results])

            # 4. Prompt Engineering for Gemini
            prompt = (
                f"You are a helpful educational assistant. Use the following snippets from "
                f"documents to answer the question. If the answer isn't in the context, say so.\n\n"
                f"CONTEXT:\n{context_block}\n\n"
                f"QUESTION: {question}\n\n"
                f"ANSWER:"
            )

            # 5. Generate answer using Gemini
            answer = gemini_client.generate(prompt, temperature=0.3)

            return {
                "answer": answer,
                "contexts": results,
                "sources": list(set([r['display_name'] for r in results])),
                "document_ids": list(set([r['document_id'] for r in results]))
            }

        except Exception as e:
            logger.error(f"RAG Query failed: {e}")
            raise HTTPException(status_code=500, detail="Search failed")

    def list_documents(self) -> List[Dict]:
        """List all uploaded documents."""
        return self.db.list_documents()

    def delete_document(self, source_uri: str) -> Dict:
        """Delete a document and all its chunks."""
        logger.info(f"[RAGService] delete_document called with source_uri: '{source_uri}'")
        deleted, doc_id = self.db.delete_document_by_source(source_uri)
        logger.info(f"[RAGService] delete_document_by_source returned: deleted={deleted}, doc_id={doc_id}")

        if deleted:
            logger.info(f"[RAGService] Document deleted successfully: '{source_uri}' (ID: {doc_id})")
            return {"status": "deleted", "document_id": doc_id, "source_uri": source_uri}

        logger.warning(f"[RAGService] Document not found for deletion: '{source_uri}'")
        raise HTTPException(status_code=404, detail=f"Document not found: {source_uri}")


# ---------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_service

    logger.info("Initializing EduQuest AI Service with Gemini 2.5 Flash Lite + Ollama Embeddings...")

    # Verify Gemini API connectivity
    try:
        test_response = gemini_client.generate("Hello", max_tokens=10)
        logger.info("✓ Gemini API connection verified")
    except Exception as e:
        logger.error(f"Gemini API connection failed: {e}")
        raise RuntimeError("Cannot connect to Gemini API. Check your API key.") from e

    # Verify Ollama connectivity
    try:
        test_embed = ollama_embed_client.get_embeddings(["test"])[0]
        logger.info(f"✓ Ollama embedding connection verified (dim: {len(test_embed)})")
    except Exception as e:
        logger.warning(f"Ollama embedding connection failed: {e}")
        logger.warning("RAG functionality will be limited without Ollama")

    # Initialize RAG service
    try:
        rag_service = RAGService()
        logger.info("✓ RAG service initialized with pgvector + LangChain + Ollama")
    except Exception as e:
        logger.warning(f"RAG service not available: {e}")
        rag_service = None

    yield

    logger.info("Shutting down")


# ---------------------------------------------------------------------
# App
# ---------------------------------------------------------------------
app = FastAPI(
    title="EduQuest AI Service with Gemini 2.5 Flash Lite + Ollama Embeddings",
    version="2.0.0",
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
    document_id: int
    document_name: str
    source_uri: str
    file_type: str
    total_pages: int
    chunks_uploaded: int
    status: str

class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    document_id: Optional[int] = Field(None, description="Optional: filter by specific document")

class RAGQueryResponse(BaseModel):
    answer: str
    contexts: list[dict]
    sources: list[str]
    document_ids: list[int]

class RAGListResponse(BaseModel):
    documents: list[dict]

class RAGDeleteRequest(BaseModel):
    source_uri: str

class RAGDeleteResponse(BaseModel):
    status: str
    document_id: Optional[int] = None
    source_uri: str

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------
def generate_with_gemini(prompt: str, temperature: float = 0.7) -> str:
    """Helper to generate text using Gemini API."""
    return gemini_client.generate(prompt, temperature=temperature)

# ---------------------------------------------------------------------
# Chat Routes (Using Gemini - unchanged)
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
# RAG Routes (Updated with separate tables and Ollama embeddings)
# ---------------------------------------------------------------------
@app.post("/rag/upload", response_model=RAGUploadResponse)
def rag_upload(req: RAGUploadRequest):
    """
    Upload a document to the RAG knowledge base using LangChain + Ollama embeddings.
    Stores document metadata and chunks in separate tables.
    """
    if rag_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service not available. Check database and Ollama configuration."
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
    Uses LangChain for processing and Ollama for embeddings.
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
    Query the RAG system: retrieves relevant documents using Ollama embeddings
    and generates answer using Gemini.
    """
    if rag_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service not available"
        )

    try:
        result = rag_service.query(req.question, req.top_k, req.document_id)
        return RAGQueryResponse(**result)
    except Exception as e:
        logger.exception("RAG query error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )

@app.get("/rag/documents", response_model=RAGListResponse)
def rag_list_documents():
    """List all uploaded documents with metadata."""
    if rag_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service not available"
        )

    try:
        documents = rag_service.list_documents()
        return RAGListResponse(documents=documents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )

@app.post("/rag/delete", response_model=RAGDeleteResponse)
def rag_delete(req: RAGDeleteRequest):
    """Delete a document and all its chunks by source URI."""
    logger.info(f"[API] rag_delete endpoint called with source_uri: '{req.source_uri}'")
    logger.info(f"[API] Request body: {req.model_dump()}")

    if rag_service is None:
        logger.error("[API] RAG service is not available")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG service not available"
        )

    try:
        result = rag_service.delete_document(req.source_uri)
        logger.info(f"[API] Delete successful, returning: {result}")
        return RAGDeleteResponse(**result)
    except HTTPException as he:
        logger.warning(f"[API] HTTPException raised during delete: {he.status_code} - {he.detail}")
        raise
    except Exception as e:
        logger.exception(f"[API] RAG delete error for source_uri: '{req.source_uri}'")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )

@app.get("/rag/status")
def rag_status():
    """Check RAG service status."""
    return {
        "rag_available": rag_service is not None,
        "using_gemini_llm": True,
        "gemini_model": settings.gemini_model,
        "using_ollama_embeddings": True,
        "ollama_host": settings.ollama_host,
        "ollama_model": settings.ollama_embed_model,
        "embedding_dim": ollama_embed_client.get_embedding_dim() if rag_service else None,
        "database": f"{settings.pg_host}:{settings.pg_port}/{settings.pg_database}" if rag_service else None,
        "tables": ["documents", "document_chunks"] if rag_service else None
    }

# ---------------------------------------------------------------------
# Math Routes (Using Gemini - unchanged)
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