# 🚀 AWS Deployment Guide (The "Failsafe" Method)

This guide assumes you are running a fresh **AWS EC2 Ubuntu 22.04 LTS (t3.large)** instance.
We have updated the code to make this process simpler.

---

## 🏗️ Phase 1: Server Setup

Run these commands in your AWS Terminal (EC2 Connect or SSH).

### 1. Update & Install Tools
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip build-essential python3-venv
```

### 2. Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 3. Install MongoDB 7.0
```bash
sudo apt-get install gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 🛠️ Phase 2: Code & RAG Setup

### 1. Clone Repository
```bash
git clone https://github.com/karthick346t/Healthcare_Chatbot.git
cd Healthcare_Chatbot
```

### 2. Run Python RAG Pipeline (The "Wait" Part)
*Note: We run this from the `rag` folder, but it will automatically save data to `backend/data`.*

```bash
cd rag
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate Embeddings (This takes time!)
python embeddings/03_build_faiss_index.py
python export_node_embeddings.py

# Done with python
deactivate
cd .. 
```
_Verify: You should now see a `data` folder inside `backend` with `.jsonl` files._

---

## 🚀 Phase 3: Build & Launch

### 1. Configure Backend Keys
```bash
cd backend
nano .env
```
**Paste your keys here:**
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/healthcare_bot
OPENROUTER_API_KEY=sk-or-your-key-here
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=healthcare-chatbot-history
```
_(Save: Ctrl+X, Y, Enter)_

### 2. "Magic" Build
We created a script to properly compile the frontend and backend together.
```bash
cd ..
node build_deploy.js
```
*Wait for "✅ BUILD COMPLETE"*

### 3. Start Application
```bash
cd backend
pm2 start dist/server.js --name "healthcare-bot"
pm2 save
pm2 startup
```

### 4. Verify
Open your browser to:
`http://<YOUR_AWS_PUBLIC_IP>:4000`

---

## 🔒 Security Group Rules (Inbound)
Make sure these ports are open in AWS:
*   **SSH (22)**: For your terminal access.
*   **TCP (4000)**: For the Web App (Source: 0.0.0.0/0).
