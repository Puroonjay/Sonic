FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces requires running as non-root user (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860

WORKDIR $HOME/app

# Pre-cache pip dependencies
COPY --chown=user:user backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download SentenceTransformer model into image so startup is instantaneous
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-en-v1.5')"

# Copy application backend and pre-built LanceDB vector store
COPY --chown=user:user backend/ backend/
COPY --chown=user:user lancedb_msmarco/ lancedb_msmarco/
COPY --chown=user:user dataset_prep/ dataset_prep/

# Expose standard Hugging Face Spaces port
EXPOSE 7860

# Run FastAPI engine
CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "7860"]
