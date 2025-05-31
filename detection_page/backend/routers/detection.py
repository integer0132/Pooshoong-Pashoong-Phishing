from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
import asyncio
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

from detection import (
    html_js_analyzer,
    url_analyzer,
    blacklist_analyzer,
    wasm_analyzer,
    dom_analyzer,
    rule_engine
)

router = APIRouter()

@router.post("/detect")
async def detect(url: str = Form(...)):
    if not url.strip():
        raise HTTPException(status_code=400, detail="URL은 필수입니다.")

    url_result = await asyncio.to_thread(url_analyzer.analyze_url, url)
    final_url = url_result.get("final_url", url)

    try:
        resp = requests.get(final_url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        html_code = resp.text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"HTML 로딩 실패: {str(e)}")

    js_codes = []
    wasm_files = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            resource_urls = {"js": set(), "wasm": set()}

            def on_request(request):
                req_url = request.url
                if req_url.endswith(".js"):
                    resource_urls["js"].add(req_url)
                elif req_url.endswith(".wasm"):
                    resource_urls["wasm"].add(req_url)

            page.on("request", on_request)

            try:
                page.goto(final_url, timeout=15000)
                page.wait_for_timeout(5000)
            except Exception as e:
                print(f"[!] 페이지 로딩 실패: {e}")

            browser.close()

        headers = {"User-Agent": "Mozilla/5.0"}

        for js_url in resource_urls["js"]:
            try:
                resp = requests.get(js_url, headers=headers, timeout=5)
                resp.raise_for_status()
                js_codes.append(resp.text)
            except Exception as e:
                print(f"[✗] JS 로딩 실패: {js_url} - {e}")

        for wasm_url in resource_urls["wasm"]:
            try:
                resp = requests.get(wasm_url, headers=headers, timeout=5)
                resp.raise_for_status()
                wasm_files.append(resp.content)
            except Exception as e:
                print(f"[✗] WASM 로딩 실패: {wasm_url} - {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JS/WASM 수집 실패: {str(e)}")

    html_js_task = asyncio.to_thread(
        html_js_analyzer.analyze_html_js, html_code, js_codes
    ) if js_codes else asyncio.to_thread(lambda: {
        "result": "정상",
        "reason": ["JS 파일 없음"]
    })

    dom_task = asyncio.to_thread(dom_analyzer.analyze_dom, html_code)

    wasm_task = asyncio.to_thread(
        wasm_analyzer.analyze_wasm, wasm_files
    ) if wasm_files else asyncio.to_thread(lambda: {
        "result": "정상",
        "reason": ["WASM 파일 없음"]
    })

    blacklist_task = asyncio.to_thread(blacklist_analyzer.analyze_blacklist, final_url)

    html_js_result, dom_result, wasm_result, blacklist_result = await asyncio.gather(
        html_js_task, dom_task, wasm_task, blacklist_task
    )

    final_result = rule_engine.aggregate_results({
        "url": url_result,
        "html_js": html_js_result,
        "dom": dom_result,
        "wasm": wasm_result,
        "blacklist": blacklist_result
    })

    return JSONResponse(content=final_result)
