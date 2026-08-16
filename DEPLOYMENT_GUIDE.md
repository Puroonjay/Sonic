# 🚀 Sonic Deployment Guide: Hugging Face Spaces (Gradio & ZeroGPU) + Vercel

This guide provides end-to-end instructions for deploying **Sonic — Multilingual Voice AI**:
- **Backend & Model Engine**: Hugging Face Spaces (**Gradio SDK with ZeroGPU / 16 GB RAM**)
- **Frontend Web App**: Vercel (Next.js Edge CDN)
- **Zero-Downtime Keep-Alive**: cron-job.org (Optional 24/7 uptime)

---

## 📦 Part 1: Deploy Backend to Hugging Face Spaces (Gradio + ZeroGPU)

### Step 1: Create a New Space on Hugging Face
1. Log in to [Hugging Face](https://huggingface.co/).
2. Go to **[Create a New Space](https://huggingface.co/new-space)**.
3. Configure your Space settings:
   - **Space name**: `sonic-backend` (or any custom name)
   - **License**: `mit`
   - **Space SDK**: Select **Gradio**
   - **Space Hardware**: Select **ZeroGPU** (or **CPU basic · 2 vCPU · 16 GB RAM** — *Free*)
   - **Visibility**: **Public** (required so Vercel can connect to the endpoints)
4. Click **Create Space**.

---

### Step 2: Configure Environment Secrets on Hugging Face
1. In your Hugging Face Space, click **Settings** (top right) -> **Variables and secrets**.
2. Under **Secrets**, add the following 3 secrets:
   - `SARVAM_API_KEY`: Your Sarvam AI API Key
   - `GROQ_API_KEY`: Your Groq Cloud API Key
   - `GUARDRAIL_DISTANCE_THRESHOLD`: `0.55`

---

### Step 3: Push Sonic to Hugging Face Space

Run these commands in your local PowerShell terminal:

```powershell
# 1. Add your Hugging Face Space as a git remote (replace with your HF username and space name)
git remote add space https://huggingface.co/spaces/<YOUR_HF_USERNAME>/sonic-backend

# 2. Stage all files (includes app.py, requirements.txt, and lancedb_msmarco/)
git add .
git commit -m "Deploy Sonic ZeroGPU Gradio Backend & LanceDB vector store"

# 3. Push to your Hugging Face Space
git push space main -f
```

> 💡 *Authentication Note: When prompted for credentials, use your Hugging Face username and your **Hugging Face User Access Token** (generate one with Write permissions at [hf.co/settings/tokens](https://huggingface.co/settings/tokens)) as your password.*

---

### Step 4: Verify Backend Health
Once Hugging Face finishes building (~1–2 minutes), your Space provides:
1. **Interactive Gradio & ZeroGPU Web UI**: `https://huggingface.co/spaces/<YOUR_HF_USERNAME>/sonic-backend`
2. **Direct API Domain**: `https://<YOUR_HF_USERNAME>-sonic-backend.hf.space`
3. **Health Check Endpoint**: `https://<YOUR_HF_USERNAME>-sonic-backend.hf.space/api/health`
4. **Interactive Swagger Docs**: `https://<YOUR_HF_USERNAME>-sonic-backend.hf.space/docs`

---

## ⚡ Part 2: Deploy Next.js Frontend to Vercel

### Step 1: Import Project to Vercel
1. Go to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Select your GitHub repository (`Puroonjay/Sonic`).
3. Framework Preset: **Next.js** (auto-detected).
4. Root Directory: `./` (leave default).

---

### Step 2: Configure Vercel Environment Variables
Under **Environment Variables**, add the following:

| Key | Value Example |
| :--- | :--- |
| `NEXT_PUBLIC_HTTP_BACKEND_URL` | `https://<YOUR_HF_USERNAME>-sonic-backend.hf.space` |
| `NEXT_PUBLIC_WS_BACKEND_URL` | `wss://<YOUR_HF_USERNAME>-sonic-backend.hf.space/ws/rag` |

---

### Step 3: Click Deploy
Vercel will build and deploy the Next.js app in ~30 seconds, giving you a custom `https://sonic-*.vercel.app` URL.

---

## ⏰ Part 3: (Optional) Keep-Alive with cron-job.org

To prevent cold starts and guarantee instant responses during judging:

1. Go to [cron-job.org](https://cron-job.org/).
2. Create a new cron job:
   - **URL**: `https://<YOUR_HF_USERNAME>-sonic-backend.hf.space/api/health`
   - **Schedule**: Every **15 minutes** (or 10 minutes)
   - **Method**: `GET`
3. Save the job.

---

## 🧪 Verification Checklist

- [ ] Open `https://<YOUR_HF_USERNAME>-sonic-backend.hf.space/api/health` in browser — should return `{"status": "healthy", "table_connected": true, ...}`
- [ ] Open your Vercel deployment URL `https://sonic-*.vercel.app`
- [ ] Test real-time Indic voice query via microphone
- [ ] Observe ultra-fast latency metrics in the Speed Streak HUD!
