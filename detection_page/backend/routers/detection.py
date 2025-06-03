from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
import asyncio
import requests
import logging
from urllib.parse import urlparse
from playwright.async_api import async_playwright
from uuid import uuid4
from datetime import datetime, timedelta

from detection import (
    html_js_analyzer,
    url_analyzer,
    blacklist_analyzer,
    wasm_analyzer,
    dom_analyzer,
    rule_engine
)

router = APIRouter()
logger = logging.getLogger(__name__)

# === 캐시: task_id => 분석 결과 ===
task_cache = {}
CACHE_TTL_SECONDS = 300  # 5분

def save_task_result(task_id, result):
    task_cache[task_id] = {
        "timestamp": datetime.utcnow(),
        "result": result
    }

def get_task_result(task_id):
    task = task_cache.get(task_id)
    if not task:
        return None
    if datetime.utcnow() - task["timestamp"] > timedelta(seconds=CACHE_TTL_SECONDS):
        del task_cache[task_id]
        return None
    return task["result"]

def cleanup_expired_tasks():
    now = datetime.utcnow()
    expired = [k for k, v in task_cache.items() if now - v["timestamp"] > timedelta(seconds=CACHE_TTL_SECONDS)]
    for k in expired:
        del task_cache[k]

# === /detect ===
@router.post("/detect")
async def detect(url: str = Form(...)):
    cleanup_expired_tasks()
    if not url.strip():
        raise HTTPException(status_code=400, detail="URL은 필수입니다.")

    url_result = await asyncio.to_thread(url_analyzer.analyze_url, url)
    final_url = url_result.get("final_url", url)
    page_domain = urlparse(final_url).hostname or ""

    try:
        resp = requests.get(final_url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        html_code = resp.text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"HTML 로딩 실패: {str(e)}")

    js_codes, wasm_files = [], []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            resource_urls = {"js": set(), "wasm": set()}

            page.on("request", lambda request: (
                resource_urls["js"].add(request.url) if request.url.endswith(".js")
                else resource_urls["wasm"].add(request.url) if request.url.endswith(".wasm")
                else None
            ))

            try:
                await page.goto(final_url, timeout=15000)
                await page.wait_for_timeout(5000)
            except Exception as e:
                logger.warning(f"[!] 페이지 로딩 실패: {e}")

            await browser.close()

        headers = {"User-Agent": "Mozilla/5.0"}
        for js_url in resource_urls["js"]:
            try:
                resp = requests.get(js_url, headers=headers, timeout=5)
                js_codes.append(resp.text)
            except Exception: pass
        for wasm_url in resource_urls["wasm"]:
            try:
                resp = requests.get(wasm_url, headers=headers, timeout=5)
                wasm_files.append(resp.content)
            except Exception: pass

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JS/WASM 수집 실패: {str(e)}")

    html_js_task = asyncio.to_thread(html_js_analyzer.analyze_html_js, html_code, js_codes) if js_codes else asyncio.to_thread(lambda: {"result": "정상", "reason": ["JS 파일 없음"]})
    dom_task = asyncio.to_thread(dom_analyzer.analyze_dom, final_url)
    wasm_task = asyncio.to_thread(wasm_analyzer.analyze_wasm, wasm_files, page_domain) if wasm_files else asyncio.to_thread(lambda: {"result": "정상", "reason": ["WASM 파일 없음"]})
    blacklist_task = asyncio.to_thread(blacklist_analyzer.analyze_blacklist, final_url)

    html_js_result, dom_result, wasm_result, blacklist_result = await asyncio.gather(
        html_js_task, dom_task, wasm_task, blacklist_task
    )

    task_id = str(uuid4())
    final_result = rule_engine.aggregate_results({
        "url": url_result,
        "html_js": html_js_result,
        "dom": dom_result,
        "wasm": wasm_result,
        "blacklist": blacklist_result
    })

    save_task_result(task_id, final_result)
    return JSONResponse(content={"task_id": task_id, "result": final_result})

# === /detect/result/{task_id} ===
@router.get("/detect/result/{task_id}")
def detect_result(task_id: str):
    cleanup_expired_tasks()
    result = get_task_result(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="분석 결과 없음 또는 만료됨")
    return JSONResponse(content=result)
