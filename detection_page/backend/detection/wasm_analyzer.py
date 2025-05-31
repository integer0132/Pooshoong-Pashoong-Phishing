import subprocess
import tempfile
import os
import re
import whois
from urllib.parse import urlparse
from datetime import datetime, timedelta
from typing import List, Union

# === 탐지 키워드: 외부 통신 및 민감 정보 ===
SUSPICIOUS_KEYWORDS = [
    "password", "login", "credentials", "postMessage",
    "fetch", "XMLHttpRequest", "sendBeacon", "WebSocket",
    "document.cookie", "eval"
]

# === 난독화 또는 인코딩 패턴 ===
SUSPICIOUS_ENCODING_PATTERNS = [
    r"base64[^\\s]{0,10}decode",   # base64Decode, base64_decode
    r"atob\(",                     # JS base64 decoding
    r"[A-Za-z0-9+/=]{30,}",         # 긴 base64 문자열
    r"fromCharCode",
    r"charCodeAt",
    r"btoa"
]

# === URL 패턴 정규표현식 ===
URL_PATTERN = r"https?://[^\s\"\'\)\(]+"  # 공백/따옴표 등으로 끝나는 모든 URL

# === 의심 URL 패턴 ===
SUSPICIOUS_URL_PATTERNS = [
    r"https?://(?:\d{1,3}\.){3}\d{1,3}(:[0-9]+)?(/[^\s]*)?",
    r"https?://[a-zA-Z0-9\-\.]+\.(?!com|net|org|co.kr|ac.kr|or.kr|go.kr|edu|gov|jp|de)([a-z]{2,})(:[0-9]+)?(/[^\s]*)?",  # 의심 TLD
]

# === WHOIS 검사 ===
def is_domain_recent(domain: str) -> bool:
    try:
        w = whois.whois(domain)
        creation = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
        if creation and (datetime.now() - creation < timedelta(days=30)):
            return True
    except:
        return True  # 검사 실패 시 의심 처리
    return False

# === 단일 WASM 분석 ===
def analyze_single_wasm(wasm_bytes: bytes, page_domain: str = None) -> dict:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wasm") as f:
        f.write(wasm_bytes)
        wasm_path = f.name

    reasons = []

    try:
        result = subprocess.run(["wasm2wat", wasm_path], capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            return {
                "result": "의심",
                "reason": [f"wasm2wat 변환 실패: {result.stderr.strip()}"]
            }

        wat_text = result.stdout

        # 키워드 탐지
        found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in wat_text]
        if found_keywords:
            reasons.append(f"WASM 내 의심 키워드 포함: {', '.join(found_keywords)}")

        # 인코딩/난독화 탐지
        for pattern in SUSPICIOUS_ENCODING_PATTERNS:
            if re.search(pattern, wat_text):
                reasons.append(f"WASM 내 인코딩/난독화 패턴 감지 (패턴: {pattern})")
                break

        # 3. URL 추출 후 도메인 비교 및 WHOIS
        urls = re.findall(URL_PATTERN, wat_text)
        for url in urls:
            parsed = urlparse(url)
            domain = parsed.hostname

            if domain:
                domain = domain.lower()
                if page_domain and domain != page_domain.lower():
                    reasons.append(f"WASM 내 외부 서버 전송 URL 감지: {url}")
                    # 의심 URL 패턴과 비교
                    for pattern in SUSPICIOUS_URL_PATTERNS:
                        if re.match(pattern, url, re.IGNORECASE):
                            reasons.append(f"WASM 내 의심 URL 감지: {url}")
                            break
                    if is_domain_recent(domain):
                        reasons.append(f"의심 URL 도메인 최근 생성됨 (WHOIS): {url}")

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
        if single_result["result"] == "의심":
            result["reason"].extend(single_result["reason"])

    if result["reason"]:
        result["result"] = "의심"
    else:
        result["reason"].append("WASM 분석상 문제 없음")

    return result
