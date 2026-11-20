from flask import Flask, request, jsonify, send_from_directory
import requests
import uuid

app = Flask(__name__, static_folder='.', static_url_path='')

# YOUR CREDENTIALS ARE HARDCODED HERE
TELEGRAM_TOKEN = "9120980562:AAHdCkCej7QrZp9nj6VrRT5zp13sZBQ69cI"
ADMIN_CHAT_ID = "7477343871"

pending_requests = {}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/request-approval', methods=['POST'])
def request_approval():
    data = request.json
    app_id = str(uuid.uuid4())
    pending_requests[app_id] = "pending"
    
    text = f"🚨 *New Loan Application*\n\nName: {data.get('name', 'Unknown')}\nAmount: {data.get('amount', 'Unknown')}\n\nDo you approve?"
    
    keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Approve", "callback_data": f"approve_{app_id}"},
            {"text": "❌ Reject", "callback_data": f"reject_{app_id}"}
        ]]
    }
    
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    
    # Print to terminal for debugging
    print("Sending Telegram Message...")
    
    requests.post(url, json={
        "chat_id": ADMIN_CHAT_ID,
        "text": text,
        "parse_mode": "Markdown",
        "reply_markup": keyboard
    })
    
    return jsonify({"app_id": app_id})

@app.route('/api/check-status/<app_id>', methods=['GET'])
def check_status(app_id):
    status = pending_requests.get(app_id, "not_found")
    return jsonify({"status": status})

@app.route('/api/telegram-webhook', methods=['POST'])
def telegram_webhook():
    update = request.json
    print("Received Webhook Update:", update) # Debugging
    
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
    app.run(port=5000)