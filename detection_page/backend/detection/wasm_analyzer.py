import subprocess
import tempfile
import os
import re
import whois
import tldextract
from urllib.parse import urlparse
from datetime import datetime, timedelta
from typing import List, Union

# === 탐지 키워드: 외부 통신 및 민감 정보 ===
SUSPICIOUS_KEYWORDS = [
    "password", "login", "credentials", "postMessage",
    "fetch", "XMLHttpRequest", "sendBeacon", "WebSocket",
    "document.cookie", "eval", "syscall/js.ValueOf", "js.Global().Call", "js.Global().Get",
    "js.Global().New", "js.Global().Set", "js_sys::Reflect", "js_sys::Function", "js_sys::Promise",
    "wasm_bindgen::JsValue", "wasm_bindgen::closure",
    "web_sys::window", "web_sys::Document", "web_sys::Navigator", "web_sys::Fetch",
]

# === 난독화 또는 인코딩 패턴 ===
SUSPICIOUS_ENCODING_PATTERNS = [
    (r"base64[^\\s]{0,10}decode", "base64 디코딩 함수"),   # base64Decode, base64_decode
    (r"atob\(", "base64 디코딩 함수"),                    # JS base64 decoding
    (r"fromCharCode", "문자 코드 기반 디코딩"),
    (r"charCodeAt", "문자 코드 기반 인코딩"),
    (r"btoa", "base64 인코딩 함수")
]

# === URL 패턴 정규표현식 ===
URL_PATTERN = r"https?://[^\s\"\'\)\(]+"  # 공백/따옴표 등으로 끝나는 모든 URL

SAFE_TLDS = {
    "com", "net", "org", "co.kr", "ac.kr", "or.kr",
    "go.kr", "edu", "gov", "jp", "de", "kr"
}

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
        for pattern, description in SUSPICIOUS_ENCODING_PATTERNS:
            if re.search(pattern, wat_text):
                reasons.append(f"WASM 내 인코딩/난독화 패턴 감지 (패턴: {description})")
                break

        # 3. URL 추출 후 도메인 비교 및 WHOIS
        urls = re.findall(URL_PATTERN, wat_text)
        for url in urls:
            parsed = urlparse(url)
            domain = parsed.hostname

            if domain:
                domain = domain.lower()
                if page_domain and domain != page_domain.lower():
                    reasons.append(f"WASM 내 외부 서버 URL 감지: {url}")

                    # IP 주소 또는 localhost
                    if re.match(r"(?:\d{1,3}\.){3}\d{1,3}", domain) or domain == "localhost":
                        reasons.append(f"WASM 내 의심 URL 감지 (IP/로컬): {url}")
                    # 비표준 TLD
                    else:
                        ext = tldextract.extract(domain)
                        tld = ext.suffix
                        if tld not in SAFE_TLDS:
                            reasons.append(f"WASM 내 의심 URL 감지 (비표준 TLD): {url}")

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
