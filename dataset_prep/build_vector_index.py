import lancedb
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
import os

print("--> Downloading MSMARCO-XI dataset split...")
# Pulling 50,000 records for fast indexing
dataset = load_dataset("ai4bharat/MSMARCO-XI", "hi", split="train[:50000]")

print("--> Loading embedding model (bge-small-en-v1.5)...")
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

db_path = "./lancedb_msmarco"
db = lancedb.connect(db_path)

data_records = []

print("--> Chunking and generating vector embeddings...")
for record in dataset:
    query_id = record.get("query_id")
    english_passages = record.get("passages", {}).get("English_passages", [])
    
    for idx, eng_p in enumerate(english_passages):
        if not eng_p or len(eng_p.strip()) < 10:
            continue
            
        # Parent-Child Chunking Strategy (60 token windows with 10 token overlap)
        words = eng_p.split()
        chunk_size = 60
        overlap = 10
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk_text = " ".join(words[i:i + chunk_size])
            if len(chunk_text.strip()) < 10:
                continue
                
            vector = model.encode(chunk_text).tolist()
            
            data_records.append({
                "vector": vector,
                "text": chunk_text,
                "parent_passage": eng_p,
                "query_id": str(query_id),
                "chunk_strategy": "child_window_60"
            })

print(f"--> Persisting {len(data_records)} chunks to LanceDB...")
table = db.create_table("msmarco_vector_store", data=data_records, mode="overwrite")
table.create_index(metric="cosine", num_partitions=64, num_sub_vectors=16)

print("--> Indexing complete! Ready for sub-20ms vector searches.")