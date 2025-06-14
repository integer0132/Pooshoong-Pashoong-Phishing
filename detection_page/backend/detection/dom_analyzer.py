from playwright.sync_api import sync_playwright
from typing import Dict

def analyze_dom(url: str) -> Dict:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
            })
            page.goto(url, timeout=30000, wait_until="networkidle")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)

            script = """
            () => {
                return new Promise((resolve) => {
                    const added = [];
                    const observer = new MutationObserver((mutations) => {
                        for (const m of mutations) {
                            for (const node of m.addedNodes) {
                                if (node.tagName && ['FORM', 'INPUT'].includes(node.tagName)) {
                                    let info = { tag: node.tagName, html: node.outerHTML || null };
                                    added.push(info);
                                }
                            }
                        }
                        if (added.length > 0) {
                            observer.disconnect();
                            resolve(added);
                        }
                    });

                    observer.observe(document.body, { childList: true, subtree: true });
                    setTimeout(() => resolve(added), 5000);
                });
            }
            """

            result = page.evaluate(script)
            browser.close()

            if result:
                return {
                    "result": "의심",
                    "reason": [f"동적 DOM 생성 감지: {len(result)}개 요소 생성됨", *(f"[{r['tag']}] {r['html'][:80]}..." for r in result)]
                }
            else:
                return {
                    "result": "정상",
                    "reason": ["5초간 동적 DOM 생성 요소 없음"]
                }

    except Exception as e:
        return {
            "result": "의심",
            "reason": [f"DOM 분석 실패: {str(e)}"]
        }
