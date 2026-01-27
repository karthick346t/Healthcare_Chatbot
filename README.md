# 🏥 Healthcare Chatbot

An intelligent healthcare assistant powered by **RAG (Retrieval-Augmented Generation)**, a modern web stack, and cloud storage.

This project integrates **Backend APIs**, **Frontend UI**, and **AI-based embeddings** to deliver a smart healthcare chatbot experience.

---

## 📦 Tech Stack

* **Frontend**: Vite + React
* **Backend**: Node.js, Express
* **Database**: MongoDB
* **AI / RAG**: Python, FAISS, Embeddings
* **Cloud Storage**: AWS S3
* **Package Manager**: pnpm

---

## 🔽 Clone the Repository

```bash
git clone https://github.com/MOKI1110/Healthcare-Chatbot.git
cd Healthcare-Chatbot
```

---

## ⚙️ Backend Setup

### 1️⃣ Install Required Tools

```bash
pip install python-dotenv
npm install -g pnpm
```

---

### 2️⃣ Create `.env` File

```powershell
New-Item -Name ".env" -ItemType File
```

Add the following configuration:

```env
NODE_ENV=development
OPENROUTER_API_KEY=

M2M_SERVER=http://localhost:8000/translate

MONGO_URI=mongodb://127.0.0.1:27017/

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=healthcare-chatbot-history
```

> ⚠️ Make sure MongoDB is running locally.

---

### 3️⃣ Install Backend Dependencies

```bash
pnpm install --ignore-scripts
pnpm install mongoose
```

---

### 4️⃣ Start Backend Server

```bash
pnpm run dev
```

Backend will run on:
**[http://localhost:4000](http://localhost:4000)**

---

## 🎨 Frontend Setup

### 1️⃣ Install Environment Support

```bash
pip install python-dotenv
```

---

### 2️⃣ Create `.env` File

```powershell
New-Item -Name ".env" -ItemType File
```

Add:

```env
VITE_API_URL=http://localhost:4000
```

---

### 3️⃣ Install & Run Frontend

```bash
npm install
npm run dev
```

Frontend will run on:
**[http://localhost:5173](http://localhost:5173)**

---

## 🧠 RAG (Retrieval-Augmented Generation) Setup

### 1️⃣ Create & Activate Virtual Environment

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

---

### 2️⃣ Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

### 3️⃣ Build FAISS Index

```bash
python embeddings/03_build_faiss_index.py
```

---

### 4️⃣ Export Node Embeddings

```bash
python export_node_embeddings.py
```

---

## 📂 Final Step (IMPORTANT)

After completing the RAG setup:

Move the folder:

```
backend/data/
```

Into:

```
backend/src/
```

This step is required for the backend to correctly access the generated embeddings.

---

## ✅ Project Checklist

* ✔ Backend running
* ✔ Frontend connected
* ✔ RAG embeddings generated
* ✔ MongoDB configured
* ✔ AWS S3 configured

---

## 🤝 Contributing

Contributions are welcome!
Feel free to open issues or submit pull requests.

---

## ⭐ Support

If you like this project, please give it a **⭐ star** on GitHub — it really helps!

---