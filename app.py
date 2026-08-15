import os
import time
import asyncio
import io
from typing import Optional, Tuple
import gradio as gr
import uvicorn
from gtts import gTTS

# ZeroGPU decorator support
try:
    import spaces
    has_zerogpu = True
except ImportError:
    has_zerogpu = False
    class spaces:
        @staticmethod
        def GPU(func=None, **kwargs):
            if func is not None and callable(func):
                return func
            def wrapper(f):
                return f
            return wrapper

# Patch gradio_client schema parsing bug for boolean additionalProperties
try:
    import gradio_client.utils
    _orig_json_schema = gradio_client.utils._json_schema_to_python_type
    def _safe_json_schema(schema, defs=None):
        if not isinstance(schema, dict):
            return "Any"
        try:
            return _orig_json_schema(schema, defs)
        except Exception:
            return "Any"
    gradio_client.utils._json_schema_to_python_type = _safe_json_schema

    _orig_get_type = gradio_client.utils.get_type
    def _safe_get_type(schema):
        if isinstance(schema, bool) or not isinstance(schema, dict):
            return "bool"
        try:
            return _orig_get_type(schema)
        except Exception:
            return "bool"
    gradio_client.utils.get_type = _safe_get_type
except Exception:
    pass

from fastapi.middleware.cors import CORSMiddleware

# Import FastAPI backend application and helper functions
from backend.server import (
    app as fastapi_app,
    execute_rag_pipeline,
    call_sarvam_stt_harness,
    run_benchmark_endpoint,
    initialize_resources,
    table,
    embed_model,
    GUARDRAIL_DISTANCE_THRESHOLD
)

LANGUAGES = [
    ("🌐 English (Indian)", "en-IN"),
    ("🇮🇳 Hindi (हिन्दी)", "hi-IN"),
    ("🇮🇳 Tamil (தமிழ்)", "ta-IN"),
    ("🇮🇳 Telugu (తెలుగు)", "te-IN"),
    ("🇮🇳 Bengali (বাংলা)", "bn-IN"),
    ("🇮🇳 Marathi (मराठी)", "mr-IN"),
    ("🇮🇳 Gujarati (ગુજરાતી)", "gu-IN"),
    ("🇮🇳 Kannada (ಕನ್ನಡ)", "kn-IN"),
    ("🇮🇳 Malayalam (മലയാളം)", "ml-IN"),
    ("🇮🇳 Punjabi (ਪੰਜਾਬੀ)", "pa-IN"),
    ("🇮🇳 Odia (ଓଡ଼ିଆ)", "od-IN"),
]

LANG_MAP = {label: code for label, code in LANGUAGES}

@spaces.GPU
def run_gradio_rag(
    query_text: str,
    audio_file: Optional[str],
    language_label: str
):
    """Gradio handler for text or voice queries with ZeroGPU acceleration."""
    lang_code = LANG_MAP.get(language_label, "en-IN")
    
    # 1. Process Voice if provided
    transcript = query_text.strip() if query_text else ""
    stt_latency = 0.0

    if audio_file and os.path.exists(audio_file):
        try:
            with open(audio_file, "rb") as f:
                audio_bytes = f.read()
            stt_start = time.perf_counter()
            transcript = asyncio.run(call_sarvam_stt_harness(audio_bytes, lang_code))
            stt_latency = round((time.perf_counter() - stt_start) * 1000, 2)
        except Exception as e:
            transcript = f"Error processing audio: {e}"

    if not transcript:
        return (
            "⚠️ Please enter a question or record an audio clip.",
            "N/A",
            "No telemetry available.",
            None
        )

    # 2. Run RAG Pipeline
    response = asyncio.run(execute_rag_pipeline(transcript, stt_ms=stt_latency))

    # 3. Format Citations
    citations_md = "### 📚 Retrieved Citations & Knowledge Passages\n\n"
    if response.citations:
        for idx, c in enumerate(response.citations):
            citations_md += (
                f"**[{idx+1}] {c.chunk_strategy.replace('_', ' ').title()}** (Distance: `{c.distance}`)\n"
                f"> {c.chunk_text}\n\n"
            )
    else:
        citations_md += "_No citations matched (or guardrail triggered)._\n"

    # 4. Format Telemetry
    m = response.metrics
    telemetry_md = f"""
### ⚡ Sub-200ms Telemetry Breakdown
| Stage | Latency | Status |
| :--- | :--- | :--- |
| **STT (Sarvam Saaras)** | `{m.stt_ms:.1f} ms` | {'✅ Streamed' if m.stt_ms > 0 else '⚡ Bypassed'} |
| **Vector Retrieval (LanceDB)** | `{m.retrieval_ms:.1f} ms` | ✅ IVF-PQ Multi-Strategy |
| **Safety & Grounding Guardrail** | `{m.guardrail_ms:.3f} ms` | {'🛡️ Refused' if response.refused else '✅ Pass'} |
| **LLM Generation (Groq LLaMA-3)** | `{m.generation_ms:.1f} ms` | ⚡ Accelerated |
| **Core RAG Total** | **`{m.total_ms:.1f} ms`** | {'🎯 Sub-200ms Target Compliant' if m.total_ms <= 200 else '⚡ Fast'} |

- **Confidence Score**: `{response.confidence_score * 100:.1f}%`
- **Grounded Status**: `{'✅ Yes' if response.grounded else '❌ Unverified'}`
"""

    # 5. Generate TTS Audio output
    audio_output_path = None
    if response.answer and not response.refused:
        try:
            tts_lang = lang_code.split("-")[0]
            tts = gTTS(text=response.answer, lang=tts_lang, slow=False)
            output_buffer = io.BytesIO()
            tts.write_to_fp(output_buffer)
            output_buffer.seek(0)
            
            temp_audio = f"/tmp/tts_{int(time.time()*1000)}.mp3" if os.name != 'nt' else f"temp_tts_{int(time.time()*1000)}.mp3"
            with open(temp_audio, "wb") as f:
                f.write(output_buffer.read())
            audio_output_path = temp_audio
        except Exception:
            audio_output_path = None

    return response.answer, citations_md, telemetry_md, audio_output_path


def run_benchmark_gradio(sample_count: int = 15):
    """Run automated benchmark suite directly inside Gradio."""
    res = asyncio.run(run_benchmark_endpoint(sample_count=sample_count))
    return f"""
## 🏆 Sonic Benchmark Results ({res.total_queries} Queries)

| Percentile Metric | Latency | Target Compliance |
| :--- | :--- | :--- |
| **P50 (Median Total)** | **`{res.p50_total_ms:.1f} ms`** | 🎯 {'Sub-200ms PASS' if res.p50_total_ms <= 200 else 'Fast'} |
| **P70 Total** | **`{res.p70_total_ms:.1f} ms`** | ⚡ |
| **P90 Total** | **`{res.p90_total_ms:.1f} ms`** | ⚡ |
| **P100 (Max)** | **`{res.p100_total_ms:.1f} ms`** | ⚡ |

---

### 📊 Stage Breakdown Averages
- **Avg Retrieval**: `{res.avg_retrieval_ms:.1f} ms`
- **Avg Guardrail**: `{res.avg_guardrail_ms:.3f} ms`
- **Avg Generation**: `{res.avg_generation_ms:.1f} ms`
- **Avg Core RAG Total**: **`{res.avg_total_ms:.1f} ms`**
- **Sub-200ms Compliance Rate**: **`{res.sub_200ms_compliance_rate:.1f}%`**
- **Grounded Responses**: `{res.grounded_count} / {res.total_queries}`
"""

# Build Gradio UI
custom_theme = gr.themes.Soft(
    primary_hue="emerald",
    secondary_hue="cyan",
    neutral_hue="slate"
)

with gr.Blocks(theme=custom_theme, title="Sonic — Sub-200ms Multilingual Voice AI") as demo:
    gr.Markdown(
        """
        # ⚡ Sonic — Sub-200ms Multilingual Voice AI
        **Team WeHustlers** | *HH Goa 2026 Task 2: Voice-Enabled RAG*
        
        > 🚀 **API & Vercel Endpoints Ready**: This Space serves the full REST (`/api/*`) and WebSocket (`/ws/rag`) backend for our Next.js frontend on Vercel while providing ZeroGPU hardware acceleration.
        """
    )

    with gr.Tabs():
        with gr.TabItem("🎙️ Interactive Voice & Text Studio"):
            with gr.Row():
                with gr.Column(scale=1):
                    lang_dropdown = gr.Dropdown(
                        choices=[label for label, _ in LANGUAGES],
                        value="🌐 English (Indian)",
                        label="Select Indic Language"
                    )
                    text_input = gr.Textbox(
                        placeholder="Type your question (Hindi, Gujarati, Tamil, Telugu, English...)",
                        label="Text Question",
                        lines=2
                    )
                    audio_input = gr.Audio(
                        sources=["microphone", "upload"],
                        type="filepath",
                        label="Or Speak via Microphone"
                    )
                    submit_btn = gr.Button("🚀 Run Sub-200ms Query", variant="primary")

                with gr.Column(scale=1):
                    answer_output = gr.Textbox(label="Sonic Answer", lines=3)
                    audio_output = gr.Audio(label="Voice Narration", autoplay=True)
                    telemetry_output = gr.Markdown("### ⚡ Telemetry will appear here")
                    citations_output = gr.Markdown("### 📚 Citations will appear here")

            submit_btn.click(
                fn=run_gradio_rag,
                inputs=[text_input, audio_input, lang_dropdown],
                outputs=[answer_output, citations_output, telemetry_output, audio_output]
            )

        with gr.TabItem("📊 Automated Latency Benchmark"):
            gr.Markdown("Run live P50/P70/P90/P100 latency benchmarks across the multilingual MSMARCO-XI dataset.")
            sample_slider = gr.Slider(minimum=5, maximum=25, value=15, step=5, label="Number of Benchmark Samples")
            bench_btn = gr.Button("⚡ Start Automated Benchmark", variant="secondary")
            bench_output = gr.Markdown("Click button to run benchmark...")
            bench_btn.click(fn=run_benchmark_gradio, inputs=[sample_slider], outputs=[bench_output])

        with gr.TabItem("ℹ️ System Architecture & API Endpoints"):
            gr.Markdown(
                """
                ### 🔌 Active Backend Endpoints
                - **REST Query**: `POST /api/query`
                - **REST Voice**: `POST /api/voice`
                - **Indic TTS**: `POST /api/tts`
                - **Health Diagnostic**: `GET /api/health`
                - **Benchmark Suite**: `GET /api/benchmark`
                - **Streaming WebSocket**: `WS /ws/rag`
                - **Interactive Swagger Docs**: `GET /docs`
                
                ### ⚡ Hardware Specs
                - **ZeroGPU Acceleration**: Enabled
                - **Vector DB**: LanceDB IVF-PQ Table (`msmarco_vector_store`)
                - **Embedding Model**: `BAAI/bge-small-en-v1.5`
                - **Inference**: Groq LLaMA-3 Sub-200ms
                """
            )

# Override get_api_info to return safely and bypass schema crawler
demo.get_api_info = lambda: {"named_endpoints": {}, "unnamed_endpoints": {}}

# Mount Gradio onto root fastapi_app so /api/* and /ws/* routes take top priority
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    # Pre-warm resources before starting web server
    asyncio.run(initialize_resources())
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
