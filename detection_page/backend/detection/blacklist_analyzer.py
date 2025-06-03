import os
import requests
import threading
import time
import logging
from datetime import datetime

# === 로깅 설정 ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# === 환경 변수로 설정된 GSB API 키 사용 ===
GOOGLE_API_KEY = os.getenv("GSB_API_KEY")
GSB_LOOKUP_URL = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_API_KEY}"

# === 글로벌 블랙리스트 캐시 ===
phishtank_data = set()
openphish_data = set()
blacklist_lock = threading.Lock()


def check_gsb(url: str) -> bool:
    try:
        payload = {
            "client": {"clientId": "capstoneproject", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["SOCIAL_ENGINEERING"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}],
            },
        }

        response = requests.post(GSB_LOOKUP_URL, json=payload, timeout=3)
        if response.status_code == 200:
            data = response.json()
            return bool(data.get("matches"))
    except Exception as e:
        logger.warning(f"[GSB] 검사 실패: {e}")
    
    return False


# === PhishTank 검사 ===
def load_phishtank():
    global phishtank_data
    try:
        response = requests.get("https://data.phishtank.com/data/online-valid.json", timeout=10)
        if response.status_code == 200:
            entries = response.json()
            with blacklist_lock:
                phishtank_data = {entry["url"].strip().lower().rstrip("/") for entry in entries}
    except Exception as e:
        logger.warning(f"[PhishTank] 로딩 실패: {e}")


def is_phishtank_url(url: str) -> bool:
    with blacklist_lock:
        return url.strip().lower().rstrip("/") in phishtank_data


# === OpenPhish 검사 ===
def load_openphish():
    global openphish_data
    try:
        response = requests.get("https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt", timeout=10)
        if response.status_code == 200:
            lines = response.text.strip().splitlines()
            with blacklist_lock:
                openphish_data = {line.strip().lower().rstrip("/") for line in lines if line.strip()}
    except Exception as e:
        logger.warning(f"[OpenPhish] 로딩 실패: {e}")


def is_openphish_url(url: str) -> bool:
    with blacklist_lock:
        return url.strip().lower().rstrip("/") in openphish_data


# === 블랙리스트 통합 검사 ===
def analyze_blacklist(url: str) -> dict:
    result = {"result": "정상", "reason": []}

    if check_gsb(url):
        result["result"] = "악성"
        result["reason"].append("Blacklist: Google Safe Browsing 등록 URL")

    if is_phishtank_url(url):
        result["result"] = "악성"
        result["reason"].append("Blacklist: PhishTank 등록 URL")

    if is_openphish_url(url):
        result["result"] = "악성"
        result["reason"].append("Blacklist: OpenPhish 등록 URL")

    if not result["reason"]:
        result["reason"].append("Blacklist: 등록된 URL 아님")

    return result


# === 백그라운드 업데이트 스레드 (24시간 간격) ===
def update_loop():
    while True:
        print(f"[{datetime.now().isoformat()}] 블랙리스트 업데이트 중...")
        load_phishtank()
        load_openphish()
        print(f"[{datetime.now().isoformat()}] 블랙리스트 업데이트 완료")
        time.sleep(60 * 60 * 24)  # 24시간


# === 시작 시 로딩 + 백그라운드 스레드 실행 ===
def start_blacklist_updater():
    load_phishtank()
    load_openphish()
    thread = threading.Thread(target=update_loop, daemon=True)
    thread.start()
