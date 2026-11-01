<div align="center">

# 🛡️ ReconPulse

<p align="center">
  <strong>An AI-powered web reconnaissance, vulnerability enumeration, and remediation platform.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38Bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

</div>

---

## 🚀 Key Features

* **Asynchronous Endpoint Enumeration:** High-performance concurrent scanning of sensitive paths using `asyncio` and `httpx`.
* **Security Header Auditing:** Identifies missing or misconfigured HTTP security headers.
* **Gemini AI Integration:** Generates executive risk summaries, attacker exploit scenarios, and developer-focused code patches with built-in retry logic.
* **Professional PDF Reporting:** Generates downloadable, styled PDF audit reports via `ReportLab`.
* **Modern React Frontend:** Clean, responsive dashboard built with React and Tailwind CSS.

---

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, Uvicorn, Pydantic, HTTPX, ReportLab, Google GenAI SDK (`google-genai`).
* **Frontend:** React, Vite, Tailwind CSS.

---

## ⚙️ Getting Started

<details>
<summary><b>1. Backend Setup (fastapi_backend)</b></summary>

```bash
cd fastapi_backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt