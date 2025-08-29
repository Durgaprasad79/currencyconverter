/**
 * Currency Converter Application
 * Uses Frankfurter API for real-time exchange rates
 */
class CurrencyConverter {
    constructor() {
        this.apiBaseUrl = 'https://api.frankfurter.app';
        this.currencies = {};
        this.currentRates = {};
        this.lastConversion = null;
        this.initializeElements();
        this.setupEventListeners();
        this.loadCurrencies();
    }
    initializeElements() {
        this.form = document.getElementById('currencyForm');
        this.fromCurrency = document.getElementById('fromCurrency');
        this.toCurrency = document.getElementById('toCurrency');
        this.amountInput = document.getElementById('amount');
        this.convertBtn = document.getElementById('convertBtn');
        this.swapBtn = document.getElementById('swapBtn');
        this.resultsContent = document.getElementById('resultsContent');
        this.resultsSection = document.getElementById('resultsSection');
    }
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleConversion(e));
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
        this.amountInput.addEventListener('input', () => this.validateForm());
        this.fromCurrency.addEventListener('change', () => this.validateForm());
        this.toCurrency.addEventListener('change', () => this.validateForm());
    }
    async loadCurrencies() {
        try {
            this.showLoading('Loading currencies...');
            const response = await fetch(`${this.apiBaseUrl}/currencies`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.currencies = await response.json();
            this.populateCurrencyDropdowns();
            this.setDefaultCurrencies();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading currencies:', error);
            this.showError('Failed to load currencies. Please refresh the page.');
        }
    }
    populateCurrencyDropdowns() {
        const currencyEntries = Object.entries(this.currencies);
        currencyEntries.sort(([a], [b]) => a.localeCompare(b));
        this.fromCurrency.innerHTML = '<option value="">Select Currency</option>';
        this.toCurrency.innerHTML = '<option value="">Select Currency</option>';
        currencyEntries.forEach(([code, name]) => {
            const option1 = new Option(`${code} - ${name}`, code);
            const option2 = new Option(`${code} - ${name}`, code);
            this.fromCurrency.appendChild(option1);
            this.toCurrency.appendChild(option2);
        });
    }
    setDefaultCurrencies() {
        if (this.currencies.USD) this.fromCurrency.value = 'USD';
        if (this.currencies.EUR) this.toCurrency.value = 'EUR';
        this.validateForm();
    }
    swapCurrencies() {
        const fromValue = this.fromCurrency.value;
        const toValue = this.toCurrency.value;
        if (fromValue && toValue) {
            this.fromCurrency.value = toValue;
            this.toCurrency.value = fromValue;
            if (this.lastConversion && this.amountInput.value) {
                this.performConversion();
            }
        }
    }
    validateForm() {
        const isValid = this.fromCurrency.value && 
                       this.toCurrency.value && 
                       this.amountInput.value && 
                       parseFloat(this.amountInput.value) > 0;
        this.convertBtn.disabled = !isValid;
    }
    async handleConversion(event) {
        event.preventDefault();
        await this.performConversion();
    }
    async performConversion() {
        const fromCurrency = this.fromCurrency.value;
        const toCurrency = this.toCurrency.value;
        const amount = parseFloat(this.amountInput.value);
        if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
            this.showError('Please fill in all fields with valid values.');
            return;
        }
        if (fromCurrency === toCurrency) {
            this.displayResult(amount, fromCurrency, toCurrency, 1);
            return;
        }
        try {
            this.showLoading('Converting...');
            this.convertBtn.disabled = true;
            const response = await fetch(
                `${this.apiBaseUrl}/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const convertedAmount = data.rates[toCurrency];
            const rate = convertedAmount / amount;
            this.displayResult(convertedAmount, fromCurrency, toCurrency, rate, amount);
            this.lastConversion = { fromCurrency, toCurrency, amount, rate };
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Failed to convert currency. Please try again.');
        } finally {
            this.hideLoading();
            this.validateForm();
        }
    }
    displayResult(convertedAmount, fromCurrency, toCurrency, rate, originalAmount = null) {
        const fromCurrencyName = this.currencies[fromCurrency] || fromCurrency;
        const toCurrencyName = this.currencies[toCurrency] || toCurrency;
        const formattedAmount = this.formatCurrency(convertedAmount, toCurrency);
        const displayAmount = originalAmount || parseFloat(this.amountInput.value);
        this.resultsContent.innerHTML = `
            <div class="conversion-result">${formattedAmount}</div>
            <div class="conversion-details">
                ${displayAmount} ${fromCurrency} = ${formattedAmount}<br>
                <small>1 ${fromCurrency} = ${this.formatCurrency(rate, toCurrency)} (${toCurrencyName})</small>
            </div>
        `;
    }
    formatCurrency(amount, currencyCode) {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            return `${currencyCode} ${amount.toFixed(2)}`;
        }
    }
    showLoading(message = 'Loading...') {
        this.resultsContent.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner"></div>
                <div class="mt-2">${message}</div>
            </div>
        `;
    }
    hideLoading() {
    }
    showError(message) {
        this.resultsContent.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});
