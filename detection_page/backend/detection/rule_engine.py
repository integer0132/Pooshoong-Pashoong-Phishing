def aggregate_results(results: dict) -> dict:
    modules = []
    result_priority = {"정상": 0, "의심": 1, "악성": 2}
    display_name = {
        "url": "URL 분석",
        "html_js": "HTML/JS 분석",
        "dom": "DOM 분석",
        "wasm": "WASM 분석",
        "blacklist": "블랙리스트 분석"
    }

    max_level = 0
    collected_reasons = []

    for key, value in results.items():
        result = value.get("result", "정상")
        reasons = value.get("reason", [])

        modules.append({
            "module": display_name.get(key, key),
            "result": result,
            "reasons": reasons
        })

        level = result_priority.get(result, 0)
        max_level = max(max_level, level)

        if level == 1:  # 의심만 수집
            collected_reasons.extend(reasons)

    final_result = ["정상", "의심", "악성"][max_level]

    # === summary.message 생성
    if final_result == "악성":
        message = "이미 보고된 피싱 사이트입니다."
    elif final_result == "의심":
        unique_points = list({r.split("→")[0].strip() for r in collected_reasons})
        message = f"{len(collected_reasons)}개의 의심 활동이 감지되었습니다: " + ", ".join(unique_points)
    else:
        message = "Credential Harvesting 활동이 감지되지 않았습니다."

    return {
        "summary": {
            "overall_result": final_result,
            "message": message
        },
        "modules": modules
    }
