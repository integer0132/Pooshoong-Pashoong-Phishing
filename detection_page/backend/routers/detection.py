from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import asyncio

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
async def detect(
    url: str = Form(...),
    files: List[UploadFile] = File(...)
):
    # 최소 요구되는 입력값 검증
    if not url or url.strip() == "":
        raise HTTPException(status_code=400, detail="URL은 필수입니다.")

    html_code = None
    js_codes = []
    wasm_bytes = None

    for file in files:
        filename = file.filename.lower()
        content = await file.read()

        if filename.endswith(".html"):
            html_code = content.decode('utf-8', errors='ignore')
        elif filename.endswith(".js"):
            js_codes.append(content.decode('utf-8', errors='ignore'))
        elif filename.endswith(".wasm"):
            wasm_bytes = content

    if html_code is None:
        raise HTTPException(status_code=400, detail="HTML 파일은 필수입니다.")

    # 병렬 분석 태스크 정의
    html_js_task = asyncio.to_thread(
        html_js_analyzer.analyze_html_js, html_code, js_codes
    ) if js_codes else asyncio.to_thread(lambda: {
        "result": "정상",
        "reason": ["JS 파일 없음"]
    })

    url_task = asyncio.to_thread(url_analyzer.analyze_url, url)
    
    blacklist_task = asyncio.to_thread(blacklist_analyzer.analyze_blacklist, url)

    wasm_task = asyncio.to_thread(
        wasm_analyzer.analyze_wasm, wasm_bytes
    ) if wasm_bytes else asyncio.to_thread(lambda: {
        "result": "정상",
        "reason": ["WASM 파일 없음"]
    })

    dom_task = asyncio.to_thread(dom_analyzer.analyze_dom, html_code)

    # 병렬 실행
    html_js_result, url_result, blacklist_result, wasm_result, dom_result = await asyncio.gather(
        html_js_task, url_task, blacklist_task, wasm_task, dom_task
    )

    # 결과 통합
    final_result = rule_engine.aggregate_results({
        "html_js": html_js_result,
        "url": url_result,
        "blacklist": blacklist_result,
        "wasm": wasm_result,
        "dom": dom_result
    })

    return JSONResponse(content=final_result)
