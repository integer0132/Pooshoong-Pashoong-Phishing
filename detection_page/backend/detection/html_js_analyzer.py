import re
import whois
from datetime import datetime
from typing import List, Dict
from urllib.parse import urlparse

# === 민감 키워드
CREDENTIAL_KEYWORDS = [
    "password", "passwd", "pwd", "credential", "login", "id", "pw",
    "username", "user", "token", "auth", "message", "info"
]

# === 외부 URL 정규표현식
URL_PATTERN = r"https?://(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,})(?::\d+)?(?:/[^\s\"\'\)\(\[\]<>{}\\]*)?"

# === 전송 API 호출 함수만 추출 (괄호 열기까지 탐지)
TRANSMISSION_FUNCTIONS = [
    r"\bfetch\s*\(",
    r"navigator\.sendBeacon\s*\(",
    r"\.open\s*\(",
    r"\.send\s*\(",
    r"new\s+WebSocket\s*\(",
    r"\baxios\.(get|post|put|delete)\s*\(",
    r"\$\.ajax\s*\(",
    r"\.submit\s*\(",
    r"\bsendTelegramMessage\s*\(",
    r"\bsendToTelegram\s*\(",
    r"\bexfiltrate\s*\("
]

# === 동적 실행 래퍼
EVAL_WRAPPERS = ["eval", "Function", "setTimeout"]

# === 도메인 추출
def extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except:
        return ""

# === WHOIS 검사
def is_domain_recent(domain: str, days_threshold=30) -> bool:
    try:
        w = whois.whois(domain)
        created = w.creation_date
        if isinstance(created, list):
            created = created[0]
        return created and (datetime.now() - created).days <= days_threshold
    except:
        return True

# === 민감 키워드 탐지
def find_credential_keywords(text: str) -> List[str]:
    return [kw for kw in CREDENTIAL_KEYWORDS if re.search(rf"\b{re.escape(kw)}\b", text)]

# === 함수 괄호 블록 추출
def extract_function_block(code: str, start_pos: int) -> str:
    open_parens = 0
    i = start_pos
    while i < len(code):
        if code[i] == '(':
            open_parens += 1
        elif code[i] == ')':
            open_parens -= 1
            if open_parens == 0:
                return code[start_pos:i+1]
        i += 1
    return code[start_pos:]

# === 메인 분석 함수
def analyze_html_js(html_code: str, js_codes: List[str]) -> Dict:
    reasons = []

    # === HTML 분석
    for func_pattern in TRANSMISSION_FUNCTIONS:
        for match in re.finditer(func_pattern, html_code, flags=re.DOTALL):
            start = match.start()
            block = extract_function_block(html_code, start)
            if (url_match := re.search(URL_PATTERN, block)):
                url = url_match.group(0)
                domain = extract_domain(url)
                if is_domain_recent(domain):
                    reasons.append(f"[HTML] 외부 전송 API + 외부 도메인: `{url}`")
            keywords = find_credential_keywords(block)
            if keywords:
                reasons.append(f"[HTML] 전송 함수 내 민감 키워드 포함: {', '.join(keywords)}")

    # === JS 분석
    for js in js_codes:
        for func_pattern in TRANSMISSION_FUNCTIONS:
            for match in re.finditer(func_pattern, js, flags=re.DOTALL):
                start = match.start()
                block = extract_function_block(js, start)
                if (url_match := re.search(URL_PATTERN, block)):
                    url = url_match.group(0)
                    domain = extract_domain(url)
                    if is_domain_recent(domain):
                        reasons.append(f"[JS] 외부 전송 API + 외부 도메인: `{url}`")
                keywords = find_credential_keywords(block)
                if keywords:
                    reasons.append(f"[JS] 전송 함수 내 민감 키워드 포함: {', '.join(keywords)}")

        # === eval / setTimeout 등 동적 실행 내 감지
        for wrapper in EVAL_WRAPPERS:
            eval_blocks = re.findall(rf"{wrapper}\s*\(\s*['\"](.*?)['\"]", js, flags=re.DOTALL)
            for block in eval_blocks:
                for func_pattern in TRANSMISSION_FUNCTIONS:
                    if re.search(func_pattern, block):
                        if (url_match := re.search(URL_PATTERN, block)):
                            url = url_match.group(0)
                            domain = extract_domain(url)
                            if is_domain_recent(domain):
                                reasons.append(f"[JS] 동적 실행 내 전송 API + 신규 도메인 감지: `{url}` (via {wrapper})")
                        keywords = find_credential_keywords(block)
                        if keywords:
                            reasons.append(f"[JS] 동적 실행 내 민감 키워드 포함 (via {wrapper}): {', '.join(keywords)}")

    return {
        "result": "의심" if reasons else "정상",
        "reason": reasons if reasons else ["HTML/JS 내 Credential Harvesting 징후 없음"]
    }
