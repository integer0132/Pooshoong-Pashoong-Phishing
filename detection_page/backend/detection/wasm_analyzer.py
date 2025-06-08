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
    ret심",
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
