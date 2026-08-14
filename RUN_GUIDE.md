# SonicRAG Run Guide

Simple step-by-step instructions to run the project.

---

## Step 1: Open PowerShell and Activate Python

Open PowerShell in the project folder and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
```

---

## Step 2: Install Requirements (First Time Only)

```powershell
pip install -r backend/requirements.txt
npm install
```

---

## Step 3: Set Your API Keys (Optional)

If you have Sarvam AI and Groq API keys, set them:

```powershell
$env:SARVAM_API_KEY="your_sarvam_api_key"
$env:GROQ_API_KEY="your_groq_api_key"
```

---

## Step 4: Build the Vector Database (Run Once)

This builds the search index from the dataset:

```powershell
python dataset_prep/build_vector_index.py --rows 5000
```

Wait until it says complete.

---

## Step 5: Start the Backend Server

In your first terminal window:

```powershell
uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```

---

## Step 6: Start the Frontend Website

Open a second PowerShell window, go to the project folder, and run:

```powershell
npm run dev
```

Open your browser and go to:
http://localhost:3000

---

## Step 7: Get Latency Numbers for Submission (P50 / P70 / P100)

To generate the latency benchmark report for your hackathon submission, run:

```powershell
python backend/benchmark.py
```

This will print your P50, P70, and P100 latency numbers and save them to BENCHMARK_REPORT.md.
