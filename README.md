---
title: Sonic Sub-200ms Multilingual Voice AI
emoji: ⚡
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: 5.15.0
app_file: app.py
pinned: false
license: mit
---

# Sonic: Sub-200ms Multilingual Voice AI Engine

**Developed by Team WeHustlers**

---

Sonic is a low-latency, voice-enabled Retrieval-Augmented Generation (RAG) system built on the **MSMARCO-XI** Indic dataset. The pipeline accepts voice queries across 10+ Indian languages, transcribes them via Sarvam AI, retrieves relevant context using a multi-strategy LanceDB vector index, applies multi-tier guardrails, and generates concise, grounded answers with a median target latency of sub-200ms.

```
[Voice Input] -> [Sarvam AI STT] -> [LanceDB Multi-Strategy Index] -> [Multi-Tier Guardrails] -> [Groq LLaMA-3] -> [Next.js UI]
```

---

## Benchmark Results

Tested across 30+ sequential queries using the automated test harness:

| Metric | Measured Value | Target | Status |
| :--- | :--- | :--- | :--- |
| **P50 Latency (Median)** | **188.02 ms** | < 200 ms | **PASS** |
| **P70 Latency** | **200.08 ms** | ~200 ms | **PASS** |
| **P100 Latency (Worst-case)** | **374.26 ms** | Baseline | **PASS** |
| **Vector Retrieval Time** | **~48.9 ms** | - | - |
| **Guardrail Overhead** | **< 0.1 ms** | - | - |
| **Sub-200ms Compliance** | **~83.3%** | - | - |

---

## Quickstart & Execution Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- Active API keys for Sarvam AI and Groq

### 1. Environment Setup

Clone the repository and install dependencies:

```bash
# Clone repository
git clone https://github.com/Puroonjay/Sonic.git
cd Sonic

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows PowerShell
# source venv/bin/activate    # On Linux / macOS

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```ini
SARVAM_API_KEY=your_sarvam_api_key
GROQ_API_KEY=your_groq_api_key
GUARDRAIL_DISTANCE_THRESHOLD=0.55
```

### 3. Build the Vector Index

Run the multi-strategy chunking and indexing script (downloads `hinval.parquet` from Hugging Face if not already present):

```bash
# Fast build (500 representative query rows, ~6,300 indexed chunks)
python dataset_prep/build_vector_index.py --rows 500

# Full dataset build (5,000 query rows, ~238,000 indexed chunks)
python dataset_prep/build_vector_index.py --all
```

### 4. Start the Backend Service

In your first terminal:

```bash
uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`
- Streaming WebSocket: `ws://localhost:8000/ws/rag`

### 5. Start the Frontend Studio

In a second terminal:

```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 6. Run the Latency Benchmark Suite

To execute the automated latency test and generate statistical percentiles:

```bash
python backend/benchmark.py
```

---

## Architecture & Technical Implementation

### 1. Speech-to-Text Integration
- Real-time audio streaming from the client browser using the Web Audio API (`MediaRecorder`).
- Backend transcription powered by **Sarvam AI** (`saaras:v3`) with low-latency binary WebSocket transfer.
- Supports 10+ Indic languages: Hindi, Indian English, Gujarati, Marathi, Tamil, Telugu, Bengali, Kannada, Malayalam, Punjabi, Odia.

### 2. Multi-Strategy Chunking Pipeline
Rather than a single naive fixed-size split, the dataset is indexed using 4 complementary strategies:
1. **Hierarchical Parent-Child**: 50-word sliding child chunks with 10-word overlap for high-precision vector matching, paired with full parent passage context for generation.
2. **Semantic Sentence Boundary**: Splitting along natural linguistic boundaries and punctuation (`.`, `?`, `!`, `।`, `\n`).
3. **Query-Conditioned Metadata**: Prepending ground-truth search queries to passages to maximize semantic recall for user intent.
4. **Cross-Lingual Aligned**: Parallel bilingual alignment linking Hindi translations with English parent contexts.

### 3. Model Harness & Error Recovery
- **Structured Schemas**: Fully validated with Pydantic (`StructuredRAGResponse`, `RetrievedCitation`, `LatencyMetrics`).
- **Resilience**: Async exponential backoff retries (`@async_retry`) on network flakiness.
- **Failover**: Automatic model fallback (`llama-3.1-8b-instant` -> `llama-3.3-70b-versatile` -> `gemma2-9b-it`).
- **Citation Inspection**: Full provenance tracking in the UI displaying child match, parent text, strategy name, and cosine distance.

### 4. Multi-Tier Guardrails
- **Tier 1 (Safety Filter)**: Pre-retrieval heuristic filter blocking toxic, dangerous, or malicious prompts.
- **Tier 2 (Vector Distance Threshold)**: Fast rejection (< 1ms) for queries falling outside the semantic space of the knowledge base.
- **Tier 3 (Context Groundedness Check)**: Post-generation hallucination verification ensuring responses are directly supported by retrieved evidence.

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx              # Root Next.js layout & metadata
│   ├── page.tsx                # Studio UI with voice recorder & inspector
│   └── globals.css             # Base styles & Tailwind setup
├── backend/
│   ├── server.py               # FastAPI & WebSocket server
│   ├── benchmark.py            # Latency benchmark suite (P50/P70/P100)
│   └── requirements.txt        # Python backend dependencies
├── dataset_prep/
│   └── build_vector_index.py   # Multi-strategy chunking & LanceDB indexer
├── src/
│   ├── components/
│   │   └── LatencyDashboard.tsx# Percentile gauges & live telemetry
│   └── hooks/
│       └── useVoiceRAG.ts      # Audio capture & WebSocket communication
├── .env                        # Environment configuration
├── README.md                   # Project documentation
└── RUN_GUIDE.md                # Quickstart instructions
```

---

## Team WeHustlers
Project created and maintained by **Team WeHustlers**.
