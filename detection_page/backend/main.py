from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import detection
from dotenv import load_dotenv
import os
import uvicorn

# Load environment variables from .env file
load_dotenv()

# 🔹 블랙리스트 자동 업데이트 시작
from detection import blacklist_module
blacklist_module.start_blacklist_updater()

app = FastAPI(
    title="Credential Harvesting Phishing Detection API",
    version="1.0.0",
    description="WASM 및 JS 기반 피싱 사이트 탐지 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시 ["https://yourfrontend.com"] 등으로 제한 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detection.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}

# 실행 진입점
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
