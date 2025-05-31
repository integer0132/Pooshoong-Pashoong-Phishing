import re
import ssl
import json
import socket
import tldextract
import requests
from urllib.parse import urlparse
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from Levenshtein import distance as levenshtein_distance
from jellyfish import jaro_winkler_similarity
import whois
from typing import Union

# === JSON 파일 경로 ===
LEGIT_DOMAIN_PATH = "detection/resources/domain.json"
SHORTEN_DOMAIN_PATH = "detection/resources/url_shortening.json"

# === JSON 데이터 로딩 ===
with open(LEGIT_DOMAIN_PATH, encoding='utf-8') as f:
    LEGIT_DOMAINS = json.load(f)

with open(SHORTEN_DOMAIN_PATH, encoding='utf-8') as f:
    SHORTENED_DOMAINS = set(json.load(f))

# === 피싱 키워드 목록 ===
PHISHING_KEYWORDS = [
    "login", "secure", "signin", "banking", "update", "verify",
    "account", "webscr", "ebayisapi", "paypal", "password"
]

# === 도메인 추출 ===
def extract_domain(url: str) -> str:
    try:
        extracted = tldextract.extract(url)
        return f"{extracted.domain}.{extracted.suffix}".lower()
    except Exception:
        return url

# === 단축 URL 여부 판별 ===
def is_shortened_url(url: str) -> bool:
    try:
        domain = extract_domain(url)
        return domain in SHORTENED_DOMAINS
    except Exception:
        return False

# === 단축 URL 리디렉션 ===
def resolve_short_url(url: str) -> str:
    try:
        session = requests.Session()
        session.headers.update({'User-Agent': 'Mozilla/5.0'})
        response = session.head(url, allow_redirects=True, timeout=5)
        return response.url
    except Exception as e2:
        return url

# === 피싱 키워드 탐지 ===
def detect_phishing_keywords(url: str) -> list:
    lowered = url.lower()
    return [kw for kw in PHISHING_KEYWORDS if kw in lowered]

# === 유사 도메인 탐지 ===
def detect_similar_domain(domain: str) -> Union[str, None]:
    domain = domain.lower()

    if domain in [d.lower() for d in LEGIT_DOMAINS]:
        return None

    for legit in LEGIT_DOMAINS:
        legit = legit.lower()
        seq_ratio = SequenceMatcher(None, domain, legit).ratio()
        lev_dist = levenshtein_distance(domain, legit)
        jaro_score = jaro_winkler_similarity(domain, legit)
        if seq_ratio > 0.75 or lev_dist <= 2 or jaro_score > 0.90:
            return legit
    return None

# === WHOIS 도메인 등록일 확인 ===
def check_whois_age(domain: str) -> Union[str, None]:
    try:
        w = whois.whois(domain)
        creation = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
        if creation and (datetime.now() - creation < timedelta(days=30)):
            return creation.date().isoformat()
    except:
        return "fail"
    return None

# === SSL 인증서 확인 ===
def check_ssl_certificate(domain: str) -> bool:
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                return bool(ssock.getpeercert())
    except:
        return False

# === URL 분석 ===
def analyze_url(url: str) -> dict:
    result = {
        "original_url": url,
        "final_url": url,
        "result": "정상",
        "reason": []
    }

    # 1. 단축 URL 처리
    if is_shortened_url(url):
        resolved_url = resolve_short_url(url)
        result["final_url"] = resolved_url
    else:
        resolved_url = url

    # 2. 분석 대상 도메인 추출
    domain = extract_domain(resolved_url)
    parsed_scheme = urlparse(resolved_url).scheme

    # 3. 키워드 탐지
    keywords_found = []
    if domain not in LEGIT_DOMAINS:
        keywords_found = detect_phishing_keywords(resolved_url)
        if keywords_found:
            result["reason"].append(f"피싱 키워드 포함: {', '.join(keywords_found)}")

    # 4. 유사 도메인 탐지
    similar = detect_similar_domain(domain)
    if similar:
        result["reason"].append(f"공식 도메인 '{similar}'과 유사한 도메인 사용")

    # 5. WHOIS 등록일
    age_info = check_whois_age(domain)
    if age_info == "fail":
        result["reason"].append("WHOIS 정보 확인 실패")
    elif age_info:
        result["reason"].append(f"최근 생성된 도메인 (등록일: {age_info})")

    # 6. SSL 인증서 확인
    if parsed_scheme == "http":
        result["reason"].append("SSL 인증서 없음 (비보안 HTTP 사용)")
    elif not check_ssl_certificate(domain):
        result["reason"].append("SSL 인증서 없음 또는 연결 실패")

    # 7. 최종 결과 판정
    if any(keyword in r for r in result["reason"] for keyword in ["유사", "실패", "없음", "등록일"]):
        result["result"] = "의심"
    else:
        result["result"] = "정상"
        if not result["reason"]:
            result["reason"].append("URL 분석상 문제 없음")


    return result
