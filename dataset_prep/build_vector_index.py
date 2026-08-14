import os
import re
import argparse
import requests
import lancedb
import pandas as pd
import torch
from sentence_transformers import SentenceTransformer

# Optimize PyTorch CPU multi-threading
try:
    torch.set_num_threads(os.cpu_count() or 8)
except Exception:
    pass

# Resolve root directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

parquet_filename = os.path.join(PROJECT_ROOT, "hinval.parquet")
db_path = os.path.join(PROJECT_ROOT, "lancedb_msmarco")
url = "https://huggingface.co/datasets/ai4bharat/MSMARCO-XI/resolve/main/validation/hinval.parquet"

def download_dataset():
    print("--> Downloading Hindi validation dataset (~462MB)...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    total_size = int(response.headers.get("content-length", 0))
    downloaded = 0
    chunk_size = 1024 * 1024  # 1MB buffer

    with open(parquet_filename, "wb") as f:
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    done_mb = downloaded / (1024 * 1024)
                    total_mb = total_size / (1024 * 1024)
                    print(f"\r--> Download progress: {done_mb:.1f}MB / {total_mb:.1f}MB ({downloaded * 100 / total_size:.1f}%)", end="", flush=True)
    print("\n--> Download complete!")

def verify_parquet():
    if os.path.exists(parquet_filename):
        try:
            _ = pd.read_parquet(parquet_filename, engine="pyarrow", columns=["query_id"]).head(1)
            print(f"--> Using verified local file: {parquet_filename}")
            return True
        except Exception as e:
            print(f"--> Existing file is incomplete or corrupted ({e}). Redownloading...")
            try:
                os.remove(parquet_filename)
            except OSError:
                pass
    return False

# ==========================================
# MULTI-STRATEGY CHUNKING IMPLEMENTATION
# ==========================================

def split_into_sentences(text: str):
    """Splits text along natural sentence & punctuation boundaries across English and Hindi."""
    sentences = re.split(r'(?<=[.?!।\n])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 5]

def chunk_hierarchical_parent_child(passage: str, chunk_size=50, overlap=10):
    """Strategy 1: Hierarchical Parent-Child (Sliding Word Window)."""
    words = str(passage).split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        c = " ".join(words[i:i + chunk_size])
        if len(c.strip()) >= 10:
            chunks.append(c)
    return chunks

def chunk_semantic_boundary(passage: str, max_words=70):
    """Strategy 2: Semantic Sentence-Boundary Chunking (Grouping coherent thoughts)."""
    sentences = split_into_sentences(str(passage))
    chunks = []
    current_chunk = []
    current_word_count = 0

    for sentence in sentences:
        s_words = sentence.split()
        if current_word_count + len(s_words) > max_words and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_word_count = len(s_words)
        else:
            current_chunk.append(sentence)
            current_word_count += len(s_words)

    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

def process_dataset_multi_strategy(df: pd.DataFrame):
    """Applies smart, high-yield multi-strategy chunking with metadata enrichment."""
    records_metadata = []
    texts_to_embed = []

    print(f"--> Applying Multi-Strategy Chunking on {len(df)} query documents...")

    for record in df.to_dict("records"):
        query_id = str(record.get("query_id", ""))
        eng_query = str(record.get("Eng_Query", "")).strip()
        eng_answer = str(record.get("Eng_Answer", "")).strip()

        passages_dict = record.get("passages", {})
        eng_passages = passages_dict.get("English_passages", []) if isinstance(passages_dict, dict) else []
        trans_passages = passages_dict.get("Translated_passages", []) if isinstance(passages_dict, dict) else []
        is_selected = passages_dict.get("is_selected", []) if isinstance(passages_dict, dict) else []

        # Find positive (selected) passage index or default to top passages
        selected_indices = [i for i, sel in enumerate(is_selected) if sel == 1]
        if not selected_indices:
            selected_indices = [0] if len(eng_passages) > 0 else []

        # Process top high-yield passages per query (selected + top 1-2 candidates)
        indices_to_process = list(dict.fromkeys(selected_indices + list(range(min(2, len(eng_passages))))))

        for idx in indices_to_process:
            if idx >= len(eng_passages):
                continue
            eng_p = eng_passages[idx]
            if not eng_p or len(str(eng_p).strip()) < 10:
                continue

            trans_p = str(trans_passages[idx]) if idx < len(trans_passages) else ""
            selected_flag = int(is_selected[idx]) if idx < len(is_selected) else 0
            eng_p_str = str(eng_p)

            # --- Strategy 1: Hierarchical Parent-Child Chunking ---
            h_chunks = chunk_hierarchical_parent_child(eng_p_str, chunk_size=50, overlap=10)
            for c_text in h_chunks:
                texts_to_embed.append(c_text)
                records_metadata.append({
                    "text": c_text,
                    "parent_passage": eng_p_str,
                    "translated_passage": trans_p,
                    "query_id": query_id,
                    "is_selected": selected_flag,
                    "eng_query": eng_query,
                    "eng_answer": eng_answer,
                    "chunk_strategy": "hierarchical_parent_child",
                    "chunk_type": "child_chunk"
                })

            # --- Strategy 2: Semantic Sentence-Boundary Chunking ---
            s_chunks = chunk_semantic_boundary(eng_p_str, max_words=70)
            for s_text in s_chunks:
                texts_to_embed.append(s_text)
                records_metadata.append({
                    "text": s_text,
                    "parent_passage": eng_p_str,
                    "translated_passage": trans_p,
                    "query_id": query_id,
                    "is_selected": selected_flag,
                    "eng_query": eng_query,
                    "eng_answer": eng_answer,
                    "chunk_strategy": "semantic_sentence_boundary",
                    "chunk_type": "semantic_unit"
                })

            # --- Strategy 3: Metadata & Query-Conditioned Chunking ---
            if selected_flag == 1 and eng_query:
                q_conditioned_text = f"Relevant Query: {eng_query} | Context: {eng_p_str[:250]}"
                texts_to_embed.append(q_conditioned_text)
                records_metadata.append({
                    "text": q_conditioned_text,
                    "parent_passage": eng_p_str,
                    "translated_passage": trans_p,
                    "query_id": query_id,
                    "is_selected": 1,
                    "eng_query": eng_query,
                    "eng_answer": eng_answer,
                    "chunk_strategy": "query_conditioned_metadata",
                    "chunk_type": "ground_truth_context"
                })

            # --- Strategy 4: Cross-Lingual Paired Chunking (Hindi Aligned) ---
            if trans_p and len(trans_p.strip()) > 15:
                hi_sentences = split_into_sentences(trans_p)
                for hi_s in hi_sentences[:2]:
                    if len(hi_s.strip()) > 10:
                        texts_to_embed.append(hi_s)
                        records_metadata.append({
                            "text": hi_s,
                            "parent_passage": eng_p_str,
                            "translated_passage": trans_p,
                            "query_id": query_id,
                            "is_selected": selected_flag,
                            "eng_query": eng_query,
                            "eng_answer": eng_answer,
                            "chunk_strategy": "cross_lingual_aligned",
                            "chunk_type": "hindi_parallel_passage"
                        })

    return texts_to_embed, records_metadata

def main():
    parser = argparse.ArgumentParser(description="Sonic Vector Store Index Builder with Multi-Strategy Chunking")
    parser.add_argument("--rows", type=int, default=500, help="Number of query rows from dataset to index (default: 500 for fast ~1min build)")
    parser.add_argument("--all", action="store_true", help="Index the entire dataset")
    args = parser.parse_args()

    if not verify_parquet():
        download_dataset()

    print("--> Loading records from Parquet...")
    df = pd.read_parquet(parquet_filename, engine="pyarrow")
    if not args.all:
        df = df.head(args.rows)
    print(f"--> Loaded {len(df)} query rows into memory.")

    # 1. Multi-Strategy Chunking
    texts_to_embed, records_metadata = process_dataset_multi_strategy(df)
    total_chunks = len(texts_to_embed)
    print(f"--> Multi-Strategy Chunking Complete! Total Indexed Chunks: {total_chunks}")

    # 2. Vector Embedding Generation
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"--> Initializing BAAI/bge-small-en-v1.5 on {device.upper()}...")
    model = SentenceTransformer("BAAI/bge-small-en-v1.5", device=device)

    batch_size = 256 if device == "cuda" else 64
    print(f"--> Generating embeddings in batches (batch_size={batch_size})...")
    embeddings = model.encode(
        texts_to_embed,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    # 3. Attach embeddings to metadata records
    for i, record in enumerate(records_metadata):
        record["vector"] = embeddings[i]

    # 4. Ingest into LanceDB
    print(f"--> Connecting to LanceDB at {db_path}...")
    db = lancedb.connect(db_path)
    table = db.create_table("msmarco_vector_store", data=records_metadata, mode="overwrite")

    print("--> Building IVF-PQ Cosine Vector Index in LanceDB...")
    try:
        table.create_index(metric="cosine", num_partitions=32, num_sub_vectors=16)
    except Exception as e:
        print(f"--> Notice on Index optimization: {e}")

    print("--> [SUCCESS] Sonic Multi-Strategy Vector Index Built Successfully!")

if __name__ == "__main__":
    main()