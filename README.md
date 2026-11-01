<div align="center">

# 🛡️ ReconPulse

<p align="center">
  <strong>Full-Stack AI-Powered Web Reconnaissance & Vulnerability Assessment Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38Bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

<p align="center">
  ReconPulse automates web application reconnaissance, detects missing security headers and exposed endpoints, generates AI-driven exploit analysis with remediation code, and exports professional PDF security reports.
</p>

</div>

---

## 🚀 Key Features

* ⚡ **Asynchronous Endpoint Enumeration:** High-speed concurrent endpoint probing using `asyncio` and `httpx` with `asyncio.Semaphore` rate limiting.
* 🛡️ **HTTP Security Header Auditing:** Instant inspection of essential response headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
* 🤖 **Gemini AI Vulnerability Intelligence:** Automated risk scoring, real-world CTF/exploit scenario generation, and ready-to-paste code patches using Google GenAI SDK (`gemini-3.8-flash`) with exponential backoff & jitter 503 retry mechanisms.
* 📄 **Automated PDF Export:** Instant generation of styled, dynamic security assessment reports using `ReportLab`.
* 🎨 **Interactive React Dashboard:** Modern, responsive UI built with Vite, React, and Tailwind CSS, providing visual severity breakdowns and real-time scanning feedback.

---

## 🛠️ Tech Stack

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>Backend Engine</h3>
      <ul>
        <li><strong>Language:</strong> Python 3.10+</li>
        <li><strong>Framework:</strong> FastAPI, Uvicorn</li>
        <li><strong>Async Network I/O:</strong> <code>httpx</code>, <code>asyncio</code></li>
        <li><strong>AI Model Engine:</strong> Google GenAI SDK (<code>google-genai</code>)</li>
        <li><strong>PDF Generation:</strong> ReportLab</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Frontend Client</h3>
      <ul>
        <li><strong>Framework:</strong> React (Vite)</li>
        <li><strong>Styling:</strong> Tailwind CSS</li>
        <li><strong>State Management:</strong> React Hooks (<code>useState</code>, <code>useMemo</code>)</li>
        <li><strong>Icons:</strong> Inline SVG Icon System</li>
      </ul>
    </td>
  </tr>
</table>

---

## 📁 Project Architecture

```text
ReconPulse/
├── fastapi_backend/
│   ├── main.py            # FastAPI endpoints, scanner logic, AI retry & PDF generator
│   ├── requirements.txt   # Backend dependencies
│   └── .env               # Environment credentials (GEMINI_API_KEY)
└── frontend/
    ├── src/
    │   ├── App.jsx        # Dashboard UI component
    │   ├── main.jsx       # React application entry
    │   └── index.css      # Tailwind styling directives
    ├── package.json       # Node.js dependencies
    └── vite.config.js     # Vite dev server configuration