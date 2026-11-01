import os
import asyncio
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from google import genai
from google.genai import types
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from dotenv import load_dotenv
import io

load_dotenv()

app = FastAPI(title="ReconPulse API", version="1.1.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client (reads GEMINI_API_KEY from environment)
ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

REQUIRED_SECURITY_HEADERS = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy"
]

# Comprehensive wordlist for endpoint enumeration
COMPREHENSIVE_ENDPOINTS = [
    # Environment & Configs
    "/.env", "/config.json", "/config.yml", "/settings.py", "/web.config", "/crossdomain.xml",
    # Version Control & Artifacts
    "/.git/HEAD", "/.git/config", "/.gitignore", "/.svn/entries", "/.hg",
    # Backup & Archives
    "/backup.zip", "/backup.tar.gz", "/db.sql", "/dump.sql", "/backup.sql", "/old",
    # API Documentation & Interfaces
    "/api/v1/", "/swagger.json", "/swagger-ui.html", "/openapi.json", "/graphql", "/api-docs",
    # Admin & Panels
    "/admin", "/admin/login", "/administrator", "/dashboard", "/manage", "/panel", "/phpmyadmin",
    # Common Web Files
    "/robots.txt", "/sitemap.xml", "/phpinfo.php", "/test.php", "/README.md"
]

# --- Data Models ---
class ScanRequest(BaseModel):
    target_url: str
    custom_endpoints: List[str] = []

class Finding(BaseModel):
    category: str
    issue: str
    severity: str
    details: str

class ScanResult(BaseModel):
    target_url: str
    missing_headers: List[str]
    exposed_endpoints: List[Dict[str, Any]]
    findings: List[Finding]
    ai_analysis: str = ""


# --- Core Recon Engines ---
async def check_security_headers(client: httpx.AsyncClient, target_url: str) -> tuple[List[str], List[Finding]]:
    missing = []
    findings = []
    try:
        response = await client.get(target_url, follow_redirects=True, timeout=5.0)
        headers = response.headers
        
        for header in REQUIRED_SECURITY_HEADERS:
            if header.lower() not in [h.lower() for h in headers.keys()]:
                missing.append(header)
                findings.append(Finding(
                    category="Header Security",
                    issue=f"Missing Header: {header}",
                    severity="Medium" if header in ["Content-Security-Policy", "Strict-Transport-Security"] else "Low",
                    details=f"The HTTP response does not enforce the {header} security directive."
                ))
    except Exception as e:
        findings.append(Finding(
            category="Connectivity",
            issue="Failed Target Reachability",
            severity="High",
            details=str(e)
        ))
    return missing, findings


async def enumerate_endpoints(client: httpx.AsyncClient, base_url: str, custom_paths: List[str]) -> tuple[List[Dict[str, Any]], List[Finding]]:
    exposed = []
    findings = []
    base_url = base_url.rstrip("/")
    
    all_paths = list(set(COMPREHENSIVE_ENDPOINTS + custom_paths))
    semaphore = asyncio.Semaphore(10)

    async def probe(path: str):
        url = f"{base_url}{path}"
        async with semaphore:
            try:
                # Use GET to inspect headers and body content
                res = await client.get(url, follow_redirects=False, timeout=4.0)
                
                # Check if it's a true HTTP 200 and NOT an HTML fallback page (Soft 404)
                content_type = res.headers.get("content-type", "").lower()
                is_html = "text/html" in content_type

                if res.status_code == 200 and not is_html:
                    entry = {"endpoint": path, "status_code": res.status_code}
                    exposed.append(entry)
                    
                    if path in ["/.env", "/.git/HEAD", "/db.sql", "/config.json"]:
                        findings.append(Finding(
                            category="Information Disclosure",
                            issue=f"Sensitive File Accessible: {path}",
                            severity="Critical",
                            details=f"Publicly accessible sensitive endpoint verified with content-type: {content_type}."
                        ))
                elif res.status_code in [301, 302, 403]:
                    exposed.append({"endpoint": path, "status_code": res.status_code})
                    
            except (asyncio.CancelledError, httpx.RequestError):
                pass

    try:
        await asyncio.gather(*(probe(ep) for ep in all_paths))
    except asyncio.CancelledError:
        pass
        
    return exposed, findings
# --- Gemini LLM Integration Engine ---
def generate_ai_remediation(target_url: str, findings: List[Finding]) -> str:
    if not findings:
        return "No major security misconfigurations were detected during this scan."

    prompt = f"""
You are a senior Application Security Specialist auditing a target web application: {target_url}.
Review the following technical findings discovered by ReconPulse scanner:

{findings}

Provide a structured, developer-focused analysis:
1. Executive Risk Summary: Summarize the overall security posture in 2 sentences.
2. Exploit Scenario: Briefly explain how an attacker could leverage these specific gaps in a CTF or real-world scenario.
3. Code Remediation: Provide clear, patched code snippets (e.g., Express.js / FastAPI / Nginx config) to remediate the missing headers and exposed endpoints.
"""
    try:
        response = ai_client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.3)
        )
        return response.text
    except Exception as e:
        return f"AI Analysis Unavailable: {str(e)}"


# --- PDF Generation Engine ---
def build_pdf_report(scan_data: ScanResult) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=20, leading=24, textColor=colors.HexColor('#1E293B'))
    heading_style = ParagraphStyle('HeadingStyle', parent=styles['Heading2'], fontSize=14, leading=18, textColor=colors.HexColor('#0F172A'), spaceBefore=12, spaceAfter=6)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#334155'))

    story = []

    # Document Header
    story.append(Paragraph("ReconPulse — Security Assessment Report", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"<b>Target URL:</b> {scan_data.target_url}", body_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=15))

    # Findings Table
    story.append(Paragraph("Discovered Vulnerabilities & Misconfigurations", heading_style))
    table_data = [["Severity", "Category", "Issue Details"]]
    
    for f in scan_data.findings:
        sev_color = "#DC2626" if f.severity in ["High", "Critical"] else "#D97706"
        table_data.append([
            Paragraph(f"<font color='{sev_color}'><b>{f.severity}</b></font>", body_style),
            Paragraph(f.category, body_style),
            Paragraph(f"<b>{f.issue}</b><br/>{f.details}", body_style)
        ])

    t = Table(table_data, colWidths=[70, 110, 360]) 
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # Gemini AI Analysis Section
    story.append(Paragraph("Gemini AI Impact Analysis & Remediation Advice", heading_style))
    ai_text_formatted = scan_data.ai_analysis.replace('\n', '<br/>')
    story.append(Paragraph(ai_text_formatted, body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer


# --- API Routes ---
@app.post("/api/v1/scan", response_model=ScanResult)
async def perform_scan(request: ScanRequest):
    url = request.target_url
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    async with httpx.AsyncClient() as client:
        missing_headers, header_findings = await check_security_headers(client, url)
        exposed_endpoints, ep_findings = await enumerate_endpoints(client, url, request.custom_endpoints)

    all_findings = header_findings + ep_findings
    ai_remediation = generate_ai_remediation(url, all_findings)

    return ScanResult(
        target_url=url,
        missing_headers=missing_headers,
        exposed_endpoints=exposed_endpoints,
        findings=all_findings,
        ai_analysis=ai_remediation
    )


@app.post("/api/v1/report/pdf")
async def generate_pdf(scan_data: ScanResult):
    try:
        pdf_buffer = build_pdf_report(scan_data)
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=reconpulse_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build PDF report: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)