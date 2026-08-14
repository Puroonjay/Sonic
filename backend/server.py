import time
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import lancedb
from sentence_transformers import SentenceTransformer
import requests
import os

app = FastAPI(title="SonicRAG Sub-200ms Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to LanceDB & Embedding Model
db = lancedb.connect("./lancedb_msmarco")
table = db.open_table("msmarco_vector_store")
embed_model = SentenceTransformer("BAAI/bge-small-en-v1.5")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "YOUR_SARVAM_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_GROQ_KEY")

GUARDRAIL_DISTANCE_THRESHOLD = 0.55

@app.websocket("/ws/rag")
async def websocket_rag_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("--> Frontend Client Connected")

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            start_total = time.perf_counter()

            # 1. STT Phase (Sarvam AI / Speech API)
            stt_start = time.perf_counter()
            stt_res = requests.post(
                "https://api.sarvam.ai/speech-to-text",
                headers={"api-subscription-key": SARVAM_API_KEY},
                files={"file": ("audio.wav", audio_bytes, "audio/wav")},
                data={"model": "saaras:v3", "language_code": "hi-IN"}
            )
            transcript = stt_res.json().get("transcript", "")
            stt_ms = round((time.perf_counter() - stt_start) * 1000, 2)

            if not transcript.strip():
                continue

            # 2. Vector DB Lookup (LanceDB)
            retrieval_start = time.perf_counter()
            query_vector = embed_model.encode(transcript).tolist()
            results = table.search(query_vector).limit(3).to_pandas()
            retrieval_ms = round((time.perf_counter() - retrieval_start) * 1000, 2)

            # 3. Guardrail Check
            guardrail_start = time.perf_counter()
            top_distance = results["_distance"].iloc[0] if not results.empty else 1.0
            is_off_topic = top_distance > GUARDRAIL_DISTANCE_THRESHOLD
            guardrail_ms = round((time.perf_counter() - guardrail_start) * 1000, 2)

            if is_off_topic:
                total_ms = round((time.perf_counter() - start_total) * 1000, 2)
                payload = {
                    "transcript": transcript,
                    "answer": "This question is off-topic or missing from the MSMARCO-XI dataset.",
                    "grounded": False,
                    "refused": True,
                    "metrics": {
                        "stt_ms": stt_ms,
                        "retrieval_ms": retrieval_ms,
                        "guardrail_ms": guardrail_ms,
                        "generation_ms": 0.0,
                        "total_ms": total_ms
                    }
                }
                await websocket.send_text(json.dumps(payload))
                continue

            # 4. LLM Generation (Groq / Fast Tokens)
            gen_start = time.perf_counter()
            context = "\n".join(results["parent_passage"].tolist())
            prompt = f"Answer using ONLY context:\nContext:\n{context}\n\nQuestion: {transcript}\nAnswer:"

            llm_res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": "llama3-8b-8192",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 100
                }
            )
            answer = llm_res.json()["choices"][0]["message"]["content"]
            generation_ms = round((time.perf_counter() - gen_start) * 1000, 2)

            total_ms = round((time.perf_counter() - start_total) * 1000, 2)

            payload = {
                "transcript": transcript,
                "answer": answer,
                "grounded": True,
                "refused": False,
                "metrics": {
                    "stt_ms": stt_ms,
                    "retrieval_ms": retrieval_ms,
                    "guardrail_ms": guardrail_ms,
                    "generation_ms": generation_ms,
                    "total_ms": total_ms
                }
            }
            await websocket.send_text(json.dumps(payload))

    except WebSocketDisconnect:
        print("--> Client Disconnected")