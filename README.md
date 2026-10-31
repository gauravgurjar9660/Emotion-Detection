<div align="center">

# 🎭 Emotion Lens

### Detect the feeling behind the words — powered by a BiGRU deep learning model

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-Keras-FF6F00?logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

**[🚀 Live Demo](#)** · **[📖 API Docs](#-api-reference)** · **[🐛 Report a Bug](../../issues)**

</div>

---

## ✨ Overview

**Emotion Lens** is an end-to-end NLP project that classifies any English sentence into one of **six emotions**:

| 😞 Sadness | 😀 Joy | ❤️ Love | 🤬 Anger | 😨 Fear | 😲 Surprise |
|:---:|:---:|:---:|:---:|:---:|:---:|

A Bidirectional GRU network is trained on text data, served through a **FastAPI** backend, and wrapped in a clean, animated web interface where the whole page changes colour with the emotion it detects.

## 🎯 Features

- 🧠 **BiGRU deep learning model** for emotion classification
- ⚡ **FastAPI backend** with automatic Swagger docs and a health-check endpoint
- 🎨 **Interactive frontend** (HTML, CSS, JS) with animated confidence ring, probability bars and an emotion-reactive background
- 📊 **Full probability breakdown** across all six emotions, not just the top one
- 🕘 **Recent history** of your last analyses
- 📱 **Responsive design** for desktop and mobile
- ☁️ **Ready to deploy** on Render

## 🖼️ Screenshots

> Add your screenshots here (put images in a `screenshots/` folder).

```md
![Home](screenshots/home.png)
![Result](screenshots/result.png)
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Model | TensorFlow / Keras (Bidirectional GRU) |
| Backend | FastAPI, Uvicorn, Pydantic |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Deployment | Render |

## 📂 Project Structure

```
Semantic-Project/
├── main.py                  # FastAPI app (model loading + endpoints)
├── requirements.txt         # Python dependencies
├── runtime.txt              # Python version for Render
├── Articale/
│   ├── bigru_model.keras    # Trained BiGRU model
│   └── tokenizer.pkl        # Fitted tokenizer
└── static/
    ├── index.html           # UI
    ├── style.css            # Styling & animations
    └── script.js            # API calls & interactions
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the server

```bash
uvicorn main:app --reload
```

Open **http://127.0.0.1:8000** in your browser.

## 📡 API Reference

### `GET /health`

Checks that the model and tokenizer are loaded.

```json
{
  "model_loaded": true,
  "status": "Model is Running Currently"
}
```

### `POST /predict`

**Request**

```json
{
  "text": "I can't believe I finally got the job!"
}
```

**Response**

```json
{
  "confidence": 0.94,
  "text": "I can't believe I finally got the job!",
  "emotion_prediction": "joy",
  "allprediction": {
    "sadness": 0.01,
    "joy": 0.94,
    "love": 0.02,
    "anger": 0.01,
    "fear": 0.01,
    "surprise": 0.01
  }
}
```

Interactive docs are available at **`/docs`** (Swagger UI).

## 🔄 How It Works

```
Raw text → Clean (lowercase, strip symbols) → Tokenize → Pad to 50 tokens
        → BiGRU model → Softmax probabilities → Top emotion + confidence
```

## ☁️ Deploy on Render

1. Push this project to GitHub (include `Articale/` and `static/`).
2. On Render, create a new **Web Service** and connect the repo.
3. Use these settings:

| Setting | Value |
|---------|-------|
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Environment variable | `PYTHON_VERSION = 3.11.9` |

> ⚠️ TensorFlow needs a lot of memory. The free 512 MB plan may run out of memory; use a paid instance if the service crashes on startup.

## 🔮 Future Improvements

- [ ] Support for more emotion classes
- [ ] Batch prediction endpoint
- [ ] Dark / light theme toggle
- [ ] Model comparison (BiGRU vs BiLSTM vs Transformer)

## 🤝 Contributing

Contributions, issues and feature requests are welcome. Feel free to open an issue or submit a pull request.

## 👤 Author

**Gaurav**

- GitHub:(https://github.com/gauravgurjar9660/Emotion-Detection.git)
project app link :
---

<div align="center">

⭐ If you found this project useful, please give it a star!

</div>
