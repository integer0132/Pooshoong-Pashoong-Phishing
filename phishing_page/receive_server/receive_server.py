from flask import Flask, request
import json

app = Flask(__name__)

@app.route("/submit", methods=["POST"])
def submit():
    try:
        raw_data = request.get_data(as_text=True)  # 문자열로 읽음
        data = json.loads(raw_data)                # 수동으로 JSON 파싱
        email = data.get("email")
        password = data.get("password")
        print(f"✅ Received credentials: {email} / {password}")
        return "OK", 200
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return "Bad Request", 400

if __name__ == "__main__":
    print("🚀 Listening on http://localhost:3000/submit ...")
    app.run(host="0.0.0.0", port=3000)
