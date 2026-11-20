async function nextStep() {
    if (currentStep < totalSteps) {
        const nextBtn = document.getElementById('btn-next');
        const originalText = nextBtn.innerText;
        
        nextBtn.innerText = "Waiting for Telegram Approval...";
        nextBtn.disabled = true;

        const name = document.getElementById('first-name').value || "Unknown";
        const amount = document.getElementById('form-amount').value || "Unknown";

        try {
            const response = await fetch('/api/request-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, amount: amount })
            });
            const result = await response.json();

            const interval = setInterval(async () => {
                const statusRes = await fetch(`/api/check-status/${result.app_id}`);
                const statusData = await statusRes.json();

                if (statusData.status === 'approve') {
                    clearInterval(interval);
                    nextBtn.innerText = originalText;
                    nextBtn.disabled = false;
                    currentStep++;
                    updateFormUI();
                } else if (statusData.status === 'reject') {
                    clearInterval(interval);
                    alert("Application rejected by Admin.");
                    nextBtn.innerText = originalText;
                    nextBtn.disabled = false;
                }
            }, 2000);

        } catch (error) {
            alert("Error connecting to server.");
            nextBtn.innerText = originalText;
            nextBtn.disabled = false;
        }
    }
}