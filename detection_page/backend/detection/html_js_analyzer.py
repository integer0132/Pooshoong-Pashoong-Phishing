import re
import whois
from datetime import datetime
from typing import List, Dict
from urllib.parse import urlparse

# === 민감 키워드
CREDENTIAL_KEYWORDS = [
    "password", "passwd", "pwd", "credential", "login", "username", "user", "token", "auth", "message", "info"
]

# === 외부 URL 정규표현식
URL_PATTERN = r"https?://(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,})(?::\d+)?(?:/[^\s\"\'\)\(\[\]<>{}\\]*)?"

# === 전송 API 호출 패턴
TRANSMISSION_PATTERNS = [
    r"\bfetch\s*\(\s*['\"]?\s*https?://",
    r"navigator\.sendBeacon\s*\(\s*['\"]?\s*https?://",
    r"\.open\s*\(\s*['\"](?:GET|POST|PUT|DELETE)['\"]\s*,\s*['\"]\s*https?://",
    r"\.send\s*\(\s*['\"].*(password|token|user|login).*['\"]",
    r"new\s+WebSocket\s*\(\s*['\"]\s*wss?://",
    r"\baxios\.(get|post|put|delete)\s*\(\s*['\"]\s*https?://",
    r"\$\.ajax\s*\(\s*\{\s*url\s*:\s*['\"]\s*https?://",
    r"\.src\s*=\s*['\"]\s*https?://",
    r"\.submit\s*\(",
    r'Call\s*\(\s*["\']fetch["\']',
    r'Reflect::get\s*\(\s*window\s*,\s*["\']fetch["\']',
    r"\bsendTelegramMessage\s*\(",
    r"\bsendToTelegram\s*\(",
    r"\bexfiltrate\s*\("
]

# === 동적 실행 래퍼 패턴
EVAL_WRAPPERS = ["eval", "Function", "setTimeout"]

# === 도메인 추출
def extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.lower()
    except:
        return ""

# === 최근 생성 도메인 여부
def is_domain_recent(domain: str, days_threshold=30) -> bool:
    try:
        w = whois.whois(domain)
        created = w.creation_date
        if isinstance(created, list):
            created = created[0]
        return created and (datetime.now() - created).days <= days_threshold
    except:
        return True  # 조회 실패도 위험 처리

# === 민감 키워드 포함 여부 및 목록 반환
def find_credential_keywords(text: str) -> List[str]:
    return [kw for kw in CREDENTIAL_KEYWORDS if re.search(rf"\b{re.escape(kw)}\b", text)]

# === 메인 분석 함수
def analyze_html_js(html_code: str, js_codes: List[str]) -> Dict:
    reasons = []

    # === HTML 분석
    for pattern in TRANSMISSION_PATTERNS:
        matches = re.finditer(pattern, html_code, flags=re.MULTILINE | re.DOTALL)
        for match in matches:
            matched_code = html_code[match.start():match.end() + 200]
            url_match = re.search(URL_PATTERN, matched_code)
            if url_match:
                url = url_match.group(0)
                domain = extract_domain(url)
                if is_domain_recent(domain):
                    keywords = find_credential_keywords(matched_code)
                    if keywords:
                        reasons.append(f"[HTML] 외부 전송 + 민감 키워드 ({', '.join(keywords)}) → `{domain}`")
                    else:
                        reasons.append(f"[HTML] 외부 URL 전송 (신규 도메인) - `{domain}`")

    # === JS 분석
    # === JS 분석
    for js in js_codes:
        for pattern in TRANSMISSION_PATTERNS:
            matches = re.finditer(pattern, js, flags=re.MULTILINE | re.DOTALL)
            for match in matches:
                matched_code = js[match.start():match.end() + 200]  # 전후 200자 확보

                url_match = re.search(URL_PATTERN, matched_code)
                if url_match:
                    url = url_match.group(0)
                    domain = extract_domain(url)
                    if is_domain_recent(domain):
                        keywords = find_credential_keywords(matched_code)
                        if keywords:
                            reasons.append(f"[JS] 외부 전송 + 민감 키워드 ({', '.join(keywords)}) → `{domain}`")
                        else:
                            reasons.append(f"[JS] 외부 URL 전송 (신규 도메인) - `{domain}`")

                # 동적 실행 내에서 전송 API + URL 감지
        for wrapper in EVAL_WRAPPERS:
            eval_blocks = re.findall(rf"{wrapper}\s*\(\s*['\"](.*?)['\"]", js, flags=re.DOTALL)
            for block in eval_blocks:
                for pattern in TRANSMISSION_PATTERNS:
                    if re.search(pattern, block):
                        if (url_match := re.search(URL_PATTERN, block)):
                            url = url_match.group(0)
                            domain = extract_domain(url)
                            if is_domain_recent(domain):
                                reasons.append(f"[JS] 동적 실행 내 전송 API + URL 감지 → `{url}` (via {wrapper})")

    return {
        "result": "의심" if reasons else "정상",
        "reason": reasons if reasons else ["HTML/JS 내 Credential Harvesting 징후 없음"]
    }
