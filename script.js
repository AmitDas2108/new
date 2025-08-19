document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Element Selection ---
    const loanAmountInput = document.getElementById("loan-amount");
    const loanAmountSlider = document.getElementById("loan-amount-slider");
    const interestRateInput = document.getElementById("interest-rate");
    const interestRateSlider = document.getElementById("interest-rate-slider");
    const tenureYearsInput = document.getElementById("loan-tenure-years");
    const tenureMonthsInput = document.getElementById("loan-tenure-months");

    const loanEMIValue = document.getElementById("loan-emi-value");
    const totalInterestValue = document.getElementById("total-interest-value");
    const totalAmountValue = document.getElementById("total-amount-value");

    const calculateBtn = document.getElementById("calculate-btn");
    const resetBtn = document.getElementById("reset-btn");
    const printBtn = document.getElementById("print-btn");

    const themeSwitcher = document.querySelector(".theme-switcher");
    const amortizationTableBody = document.querySelector("#amortizationTable tbody");

    let myChart;

    // --- Currency Formatter ---
    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    });

    // --- Theme Switcher Logic ---
    const applyTheme = (theme) => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    themeSwitcher.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    // Load saved theme
    applyTheme(localStorage.getItem('theme') || 'light');


    // --- Input Synchronization ---
    const syncInputs = (input, slider, max) => {
        slider.value = input.value;
        if (input.value > max) input.value = max; // Enforce max value
    };
    
    loanAmountInput.addEventListener('input', () => syncInputs(loanAmountInput, loanAmountSlider, 10000000));
    loanAmountSlider.addEventListener('input', () => loanAmountInput.value = loanAmountSlider.value);
    
    interestRateInput.addEventListener('input', () => syncInputs(interestRateInput, interestRateSlider, 25));
    interestRateSlider.addEventListener('input', () => interestRateInput.value = interestRateSlider.value);


    // --- Core Calculation Logic ---
    const calculateAndDisplay = () => {
        // 1. Get Inputs
        const principal = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseInt(tenureYearsInput.value) || 0;
        const tenureMonths = parseInt(tenureMonthsInput.value) || 0;

        // 2. Validate Inputs
        // NEW: First, check specifically for any negative values.
        if (principal < 0 || annualInterestRate < 0 || tenureYears < 0 || tenureMonths < 0) {
            alert("Error: Input values cannot be negative. Please enter a positive number.");
            return;
        }

        // Second, check for zero values or invalid numbers.
        if (isNaN(principal) || principal === 0 || isNaN(annualInterestRate) || annualInterestRate === 0 || (tenureYears === 0 && tenureMonths === 0)) {
            alert("Please enter valid, positive values for all fields to perform a calculation.");
            return;
        }

        // 3. Prepare for Calculation
        const monthlyInterestRate = annualInterestRate / 12 / 100;
        const totalTenureMonths = (tenureYears * 12) + tenureMonths;

        // 4. Calculate EMI
        const emi = principal * monthlyInterestRate * (Math.pow(1 + monthlyInterestRate, totalTenureMonths)) / (Math.pow(1 + monthlyInterestRate, totalTenureMonths) - 1);
        
        if (!isFinite(emi)) return; // Avoid NaN/Infinity issues

        // 5. Calculate Totals
        const totalAmountPayable = emi * totalTenureMonths;
        const totalInterestPayable = totalAmountPayable - principal;

        // 6. Update UI
        loanEMIValue.textContent = currencyFormatter.format(emi);
        totalInterestValue.textContent = currencyFormatter.format(totalInterestPayable);
        totalAmountValue.textContent = currencyFormatter.format(totalAmountPayable);

        // 7. Update Chart
        updateChart(principal, totalInterestPayable);
        
        // 8. Generate Amortization Schedule
        generateAmortizationSchedule(principal, monthlyInterestRate, emi, totalTenureMonths);
    };

    // --- Chart Logic ---
    const updateChart = (principal, totalInterest) => {
        const ctx = document.getElementById("myChart").getContext("2d");
        
        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Principal Amount", "Total Interest"],
                datasets: [{
                    data: [principal, totalInterest],
                    backgroundColor: ["#4a6cf7", "#98a2b3"],
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: document.body.getAttribute('data-theme') === 'dark' ? '#f9fafb' : '#101828',
                        },
                    },
                },
            },
        });
    };

    // --- Amortization Schedule Generation ---
    const generateAmortizationSchedule = (principal, monthlyRate, emi, tenureMonths) => {
        amortizationTableBody.innerHTML = ''; // Clear previous schedule
        let balance = principal;

        for (let month = 1; month <= tenureMonths; month++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = emi - interestPayment;
            balance -= principalPayment;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${month}</td>
                <td>${currencyFormatter.format(principalPayment)}</td>
                <td>${currencyFormatter.format(interestPayment)}</td>
                <td>${currencyFormatter.format(Math.max(0, balance))}</td>
            `;
            amortizationTableBody.appendChild(row);
        }
    };
    
    // --- Reset Functionality ---
    const resetCalculator = () => {
        document.getElementById('loan-form').reset();
        loanAmountSlider.value = 1000;
        interestRateSlider.value = 1;

        loanEMIValue.textContent = "₹ 0";
        totalInterestValue.textContent = "₹ 0";
        totalAmountValue.textContent = "₹ 0";
        
        amortizationTableBody.innerHTML = '';
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }
    };
    
    // --- Print Functionality ---
    const printSchedule = () => {
        const scheduleCard = document.querySelector('.calculator__schedule-card');
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Amortization Schedule</title>');
        printWindow.document.write('<style> body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { padding: 8px; border: 1px solid #ddd; text-align: right; } th { background-color: #f2f2f2; } </style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(scheduleCard.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    // --- Event Listeners ---
    calculateBtn.addEventListener("click", calculateAndDisplay);
    resetBtn.addEventListener("click", resetCalculator);
    printBtn.addEventListener("click", printSchedule);
    
    // Initialize with default empty chart
    updateChart(1, 0); 
});