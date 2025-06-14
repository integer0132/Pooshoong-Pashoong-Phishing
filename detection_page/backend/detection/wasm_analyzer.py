import subprocess
import tempfile
import os
import re
import whois
import tldextract
from urllib.parse import urlparse
from datetime import datetime, timedelta
from typing import List
from collections import defaultdict
import logging

# === 로깅 설정 ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)
# === 탐지 키워드: 외부 통신 및 민감 정보 ===
SUSPICIOUS_KEYWORDS = [
    "password", "login", "credentials", "postMessage",
    "fetch", "XMLHttpRequest", "sendBeacon", "WebSocket",
    "document.cookie", "eval",
    "syscall/js.ValueOf", "js.Global().Call", "js.Global().Get",
    "js.Global().New", "js.Global().Set", "js_sys::Reflect",
    "js_sys::Function", "js_sys::Promise",
    "wasm_bindgen::JsValue", "wasm_bindgen::closure",
    "web_sys::window", "web_sys::Document", "web_sys::Navigator", "web_sys::Fetch",
    "sendToTelegram", "sendTelegramMessage", "exfiltrate"
]

# === 난독화 또는 인코딩 패턴 ===
SUSPICIOUS_ENCODING_PATTERNS = [
    (r"base64[^\\s]{0,10}decode", "base64 디코딩 함수"),
    (r"atob\(", "base64 디코딩 함수"),
    (r"fromCharCode", "문자 코드 기반 디코딩"),
    (r"charCodeAt", "문자 코드 기반 인코딩"),
    (r"btoa", "base64 인코딩 함수"),
]

# === URL 패턴 ===
URL_PATTERN = r"https?://(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,})(?::\d+)?(?:/[^\s\"\'\)\(\[\]<>{}\\]*)?"

# === WHOIS 생성일 확인 ===
def is_domain_recent(domain: str) -> bool:
    try:
        w = whois.whois(domain)
        creation = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
        if creation and (datetime.now() - creation < timedelta(days=30)):
            return True
    except:
        return True
    return False

# === URL 정리 및 도메인 추출 ===
def clean_url(url: str):
    cleaned = url.rstrip(".;,)]}>\"'")
    parsed = urlparse(cleaned)
    if parsed.hostname:
        ext = tldextract.extract(parsed.hostname.lower())
        domain = f"{ext.domain}.{ext.suffix}"
        return cleaned, domain
    return None, None

# === 단일 WASM 분석 ===
def analyze_single_wasm(wasm_bytes: bytes, page_domain: str = None) -> dict:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wasm") as f:
        f.write(wasm_bytes)
        wasm_path = f.name

    reasons = []
    found_suspicious_encoding = False

    try:
        result = subprocess.run(["wasm2wat", wasm_path], capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return {
                "result": "의심",
                "reason": [f"wasm2wat 변환 실패: {result.stderr.strip()}"]
            }

        wat_text = result.stdout

        url_hits = defaultdict(set)  # cleaned_url: set of keywords

        # 의심 키워드 탐지
        for kw in SUSPICIOUS_KEYWORDS:
            for match in re.finditer(kw, wat_text):
                context = wat_text[max(0, match.start()-150):match.end()+150]
                found_urls = re.findall(URL_PATTERN, context)
                for url in found_urls:
                    cleaned_url, domain = clean_url(url)
                    if not domain:
                        continue
                    url_hits[cleaned_url].add(kw)

        for url, keywords in url_hits.items():
            domain = clean_url(url)[1]
            tags = []

            # IP 주소
            if re.match(r"^(?:\d{1,3}\.){3}\d{1,3}$", domain):
                tags.append("IP주소 도메인")
            if is_domain_recent(domain):
                tags.append("최근 생성된 도메인 (WHOIS)")
                    
            msg = f"WASM 내 의심 키워드 {', '.join(sorted(keywords))} 인근 외부 전송 URL 감지: {url}"
            if tags:
                msg += f" [{', '.join(tags)}]"
            reasons.append(msg)

        # 난독화 탐지
        for pattern, desc in SUSPICIOUS_ENCODING_PATTERNS:
            if re.search(pattern, wat_text):
                found_suspicious_encoding = True
                encoding_reason = f"WASM 내 인코딩/난독화 패턴 감지 (패턴: {desc})"
                break

        # 판단 조건 적용
        if not reasons and found_suspicious_encoding:
            return {
                "result": "의심",
                "reason": [f"{encoding_reason} 그러나 외부 통신 또는 민감 키워드는 없음"]
            }

        if found_suspicious_encoding:
            reasons.append(encoding_reason)

        # 최종 결과
        if reasons:
            return {"result": "의심", "reason": reasons}
        else:
            return {"result": "정상", "reason": ["WASM 분석상 문제 없음"]}

    except Exception as e:
        return {"result": "의심", "reason": [f"WASM 분석 예외 발생: {str(e)}"]}

    finally:
        os.remove(wasm_path)

# === 다중 WASM 분석 ===
def analyze_wasm(wasm_files: List[bytes], page_domain: str = None) -> dict:
    if not wasm_files:
        return {"result": "정상", "reason": ["분석 대상 WASM 없음"]}

    result = {"result": "정상", "reason": []}

    for wasm in wasm_files:
        single_result = analyze_single_wasm(wasm, page_domain)
        result["reason"].extend(single_result["reason"])
        if single_result["result"] == "의심":
            result["result"] = "의심"

    if not result["reason"]:
        result["reason"].append("WASM 분석상 문제 없음")

    return result
