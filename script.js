// --- Screen Navigation ---
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function selectLanguage(lang) {
    // In a real app, this would trigger translation logic
    console.log("Language selected:", lang);
    goToScreen('screen-home');
}

// --- Loan Calculator Logic ---
const amountSlider = document.getElementById('amount-slider');
const loanAmountDisplay = document.getElementById('loan-amount-display');
const termSelect = document.getElementById('term-select');
const monthlyPaymentDisplay = document.getElementById('monthly-payment-display');

// Simple interest calculation (for demo purposes)
function updateCalculator() {
    const principal = parseInt(amountSlider.value);
    const months = parseInt(termSelect.value);
    
    // Format number with commas
    loanAmountDisplay.innerText = principal.toLocaleString();
    
    // Simple calculation: (Principal + 10% flat interest) / Months
    const totalRepayment = principal * 1.10;
    const monthly = totalRepayment / months;
    
    monthlyPaymentDisplay.innerText = Math.round(monthly).toLocaleString();
}

amountSlider.addEventListener('input', updateCalculator);
termSelect.addEventListener('change', updateCalculator);
updateCalculator(); // Initial call

// --- Multi-Step Form Logic ---
let currentStep = 1;
const totalSteps = 3;

function updateFormUI() {
    // Update step visibility
    document.querySelectorAll('.form-step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === currentStep);
    });

    // Update indicator
    document.getElementById('step-indicator').innerText = `Step ${currentStep} of ${totalSteps}`;

    // Update buttons
    document.getElementById('btn-back').style.display = currentStep === 1 ? 'none' : 'block';
    
    const nextBtn = document.getElementById('btn-next');
    const submitBtn = document.getElementById('btn-submit');

    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
        generateSummary(); // Populate summary on last step
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function nextStep() {
    if (currentStep < totalSteps) {
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

// --- Summary Generation ---
function generateSummary() {
    const amount = document.getElementById('form-amount').value;
    const term = document.getElementById('form-term').value;
    const purpose = document.getElementById('form-purpose').value || '—';
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    
    document.getElementById('summary-amount').innerText = `XAF ${parseInt(amount).toLocaleString()}`;
    document.getElementById('summary-term').innerText = `${term} Months`;
    document.getElementById('summary-purpose').innerText = purpose;
    
    if (firstName || lastName) {
        document.getElementById('summary-name').innerText = `${firstName} ${lastName}`.trim();
    } else {
        document.getElementById('summary-name').innerText = '—';
    }
}

// --- Form Submission ---
function submitForm(event) {
    event.preventDefault(); // Prevent page reload
    
    // Basic validation check
    const phone = document.getElementById('phone-number').value;
    if(phone.length !== 9) {
        alert("Please enter a valid 9-digit phone number.");
        return;
    }

    // Show loading/success screen
    goToScreen('screen-success');
    
    // Simulate API call delay
    setTimeout(() => {
        console.log("Application Data:", {
            loanType: document.getElementById('loan-type').value,
            amount: document.getElementById('form-amount').value,
            term: document.getElementById('form-term').value,
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            phone: phone,
            employment: document.getElementById('employment-status').value
        });
        // In a real app, you would redirect or show a success message here
    }, 2000);
}