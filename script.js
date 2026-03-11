/**
 * Basic Calculator - Core Logic
 */

let currentInput = '0';
let history = '';
let lastResult = null;
let cursorPosition = 1;

let undoStack = [];
let redoStack = [];

function saveState() {
    undoStack.push({ currentInput, history, lastResult, cursorPosition });
    if (undoStack.length > 200) undoStack.shift();
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push({ currentInput, history, lastResult, cursorPosition });
    const state = undoStack.pop();
    currentInput = state.currentInput;
    history = state.history;
    lastResult = state.lastResult;
    cursorPosition = state.cursorPosition;
    updateDisplay();
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push({ currentInput, history, lastResult, cursorPosition });
    const state = redoStack.pop();
    currentInput = state.currentInput;
    history = state.history;
    lastResult = state.lastResult;
    cursorPosition = state.cursorPosition;
    updateDisplay();
}

const displayElement = document.getElementById('display');

const historyElement = document.getElementById('history');

let currentFormat = 'in'; // 'in' = Indian, 'intl' = International, 'none' = None

function setFormat(format) {
    currentFormat = format;

    // Update UI toggle buttons
    document.getElementById('fmt-none').className = 'px-2 py-1 rounded transition-colors text-white/40 hover:text-white';
    document.getElementById('fmt-intl').className = 'px-2 py-1 rounded transition-colors text-white/40 hover:text-white';
    document.getElementById('fmt-in').className = 'px-2 py-1 rounded transition-colors text-white/40 hover:text-white';

    if (format === 'in') document.getElementById('fmt-in').className = 'px-2 py-1 rounded transition-colors bg-white/20 text-white shadow-sm';
    if (format === 'intl') document.getElementById('fmt-intl').className = 'px-2 py-1 rounded transition-colors bg-white/20 text-white shadow-sm';
    if (format === 'none') document.getElementById('fmt-none').className = 'px-2 py-1 rounded transition-colors bg-white/20 text-white shadow-sm';

    updateDisplay();
}

function formatNumber(numStr, format) {
    if (format === 'none') return numStr;
    if (isNaN(numStr) || numStr === '') return numStr;

    let parts = numStr.split('.');
    let wholePart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    if (format === 'intl') {
        wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (format === 'in') {
        // Indian system: last 3 digits, then every 2 digits
        let lastThree = wholePart.substring(wholePart.length - 3);
        let otherDigits = wholePart.substring(0, wholePart.length - 3);
        if (otherDigits !== '') {
            lastThree = ',' + lastThree;
        }
        wholePart = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    }

    return wholePart + decimalPart;
}

function formatExpression(expression) {
    // Basic regex to find numbers in the expression and format them
    return expression.replace(/(\d+(\.\d+)?)/g, match => formatNumber(match, currentFormat));
}

function updateDisplay() {
    // Render cursor
    let renderText = currentInput;

    // Formatting logic that preserves cursor position visually
    if (currentFormat !== 'none') {
        let leftSide = renderText.slice(0, cursorPosition);
        let rightSide = renderText.slice(cursorPosition);

        // We format the entire expression string to correctly inject commas
        let formattedFull = formatExpression(renderText.replace(/,/g, ''));

        // Let's accurately map by re-building up to the cursor character by character and matching digits
        let formattedString = "";
        let unformattedIndex = 0;
        let mappedCursor = 0;

        for (let i = 0; i < formattedFull.length; i++) {
            if (unformattedIndex === cursorPosition) {
                mappedCursor = i;
            }
            if (formattedFull[i] !== ',') {
                unformattedIndex++;
            }
        }
        if (unformattedIndex === cursorPosition) {
            mappedCursor = formattedFull.length;
        }

        renderText = formattedFull;
        var displayCursorPos = mappedCursor;
    } else {
        var displayCursorPos = cursorPosition;
    }

    const cursorHTML = '<span class="animate-pulse border-l-2 border-white mix-blend-difference">&#8203;</span>';

    if (displayCursorPos >= renderText.length) {
        renderText = renderText + cursorHTML;
    } else {
        renderText = renderText.slice(0, displayCursorPos) + cursorHTML + renderText.slice(displayCursorPos);
    }

    displayElement.innerHTML = renderText;
    historyElement.innerText = formatExpression(history);

    // Auto-scroll horizontally to end
    historyElement.scrollLeft = historyElement.scrollWidth;
    const displayContainer = document.getElementById('display-container');
    if (displayContainer) {
        displayContainer.scrollLeft = displayContainer.scrollWidth;
    }

    // Subtle visual feedback
    displayElement.style.opacity = '0.5';
    setTimeout(() => {
        displayElement.style.opacity = '1';
    }, 50);
}

function appendValue(value) {
    saveState();
    if (currentInput === '0' && value !== '.') {
        currentInput = value;
        cursorPosition = value.length;
    } else {
        currentInput = currentInput.slice(0, cursorPosition) + value + currentInput.slice(cursorPosition);
        cursorPosition += value.length;
    }
    updateDisplay();
}

function setOperator(op) {
    saveState();
    if (currentInput === '0' && lastResult !== null) {
        currentInput = lastResult.toString();
        cursorPosition = currentInput.length;
    }

    let left = currentInput.slice(0, cursorPosition);
    let right = currentInput.slice(cursorPosition);

    if (left === '0' && right === '') {
        if (op === '-' || op === '+') {
            left = op;
        } else {
            left = '0' + op;
        }
    } else {
        let trailingOpMatch = left.match(/([+\-*/]+)$/);
        if (trailingOpMatch) {
            let existingOps = trailingOpMatch[1];
            if (op === '-') {
                if (existingOps === '*' || existingOps === '/' || existingOps === '//') {
                    left = left + op;
                } else {
                    left = left.slice(0, -existingOps.length) + op;
                }
            } else {
                left = left.slice(0, -existingOps.length) + op;
            }
        } else {
            left = left + op;
        }
    }

    currentInput = left + right;
    cursorPosition = left.length;
    updateDisplay();
}

function clearDisplay() {
    saveState();
    currentInput = '0';
    cursorPosition = 1;
    history = '';
    lastResult = null;
    updateDisplay();
}

function calculate() {
    saveState();
    try {
        let expression = history + currentInput;

        // Handle Python-style integer division //
        // We replace "a // b" with "Math.floor(a / b)"
        // This is a simple regex for basic usage: a // b
        // For more complex expressions, a proper parser would be better, 
        // but for a budgeting calculator, this should suffice.

        let sanitizedExpression = expression.replace(/(-?\d+(\.\d+)?)\s*\/\/\s*(-?\d+(\.\d+)?)/g, 'Math.floor($1 / $3)');

        // Using Function constructor instead of eval for a bit more safety in this context
        const result = new Function('return ' + sanitizedExpression)();

        history = expression + ' =';
        currentInput = result.toString();
        cursorPosition = currentInput.length;
        lastResult = result;
        updateDisplay();

        // Reset history after calculation so next input replaces it
        history = '';
    } catch (error) {
        console.error("Calculation Error:", error);
        displayElement.classList.add('error-shake');
        setTimeout(() => displayElement.classList.remove('error-shake'), 400);
    }
}

let lastDKeyTime = 0;

// Shortcut Handling
document.addEventListener('keydown', async (event) => {
    // Advanced Clipboard and Standard Shortcuts
    if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();

        if (key === 'z') {
            event.preventDefault();
            undo();
            return;
        }

        if (key === 'y') {
            event.preventDefault();
            redo();
            return;
        }

        if (key === 'a') {
            event.preventDefault();
            const range = document.createRange();
            if (event.shiftKey) {
                // Ctrl+Shift+A: Select both history and display result
                range.selectNodeContents(document.getElementById('display-container').parentNode);
            } else {
                // Ctrl+A: Select only the current line (the large text)
                range.selectNodeContents(document.getElementById('display'));
            }
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }

        if (key === 'x') {
            event.preventDefault();
            try {
                if (event.shiftKey) {
                    saveState();
                    // Ctrl+Shift+X: Cut everything
                    const fullText = history + currentInput;
                    await navigator.clipboard.writeText(fullText);
                    currentInput = '0';
                    cursorPosition = 1;
                    history = '';
                    lastResult = null;
                    updateDisplay();
                } else {
                    saveState();
                    // Ctrl+X: Cut current input
                    await navigator.clipboard.writeText(currentInput);
                    currentInput = '0';
                    cursorPosition = 1;
                    updateDisplay();
                }
            } catch (err) {
                console.error('Failed to cut text: ', err);
            }
            return;
        }

        if (key === 'v') {
            event.preventDefault();
            try {
                const text = await navigator.clipboard.readText();
                if (!text) return;

                // Sanitize: allow numbers, dot, basic operators
                const sanitized = text.replace(/[^0-9\.+\-*/() ]/g, '');

                if (event.shiftKey) {
                    saveState();
                    // Ctrl+Shift+V: Append to end of currentInput
                    currentInput += sanitized;
                    cursorPosition = currentInput.length;
                    updateDisplay();
                } else {
                    saveState();
                    // Ctrl+V: Insert at cursor position in currentInput
                    if (currentInput === '0' && sanitized !== '.') {
                        currentInput = sanitized;
                        cursorPosition = sanitized.length;
                    } else {
                        currentInput = currentInput.slice(0, cursorPosition) + sanitized + currentInput.slice(cursorPosition);
                        cursorPosition += sanitized.length;
                    }
                    updateDisplay();
                }
            } catch (err) {
                console.error('Failed to paste text: ', err);
            }
            return;
        }

        // Return early for any other Ctrl shortcuts (like Ctrl+C) so they work natively without triggering our operations
        return;
    }

    const key = event.key.toLowerCase();

    // Ignore raw modifier keys from being processed further
    if (['shift', 'control', 'alt', 'meta', 'capslock', 'tab', 'arrowup', 'arrowdown'].includes(key)) {
        return;
    }

    // Numbers
    if (/[0-9]/.test(key)) {
        appendValue(key);
    }

    // Operations
    if (key === 'p' || key === '+') setOperator('+');
    if (key === 's' || key === '-') setOperator('-');
    if (key === 'm' || key === '*') setOperator('*');
    if (key === 'd' || key === '/') {
        const now = Date.now();
        if (now - lastDKeyTime < 400) {
            // Convert last '/' to '//' by manipulating currentInput
            let left = currentInput.slice(0, cursorPosition);
            if (left.endsWith('/')) {
                saveState();
                currentInput = left.slice(0, -1) + '//' + currentInput.slice(cursorPosition);
                cursorPosition++;
                updateDisplay();
            }
            lastDKeyTime = 0; // Prevent triple 'd' from doing anything weird
        } else {
            setOperator('/');
            lastDKeyTime = now;
        }
    }

    // Brackets
    if (key === 'q') appendValue('(');
    if (key === 'w') appendValue(')');
    if (key === '(' || key === ')') appendValue(key);

    // Focus and Arrow Keys
    if (key === 'arrowleft') {
        if (cursorPosition > 0) {
            cursorPosition--;
            updateDisplay();
        }
    }
    if (key === 'arrowright') {
        if (cursorPosition < currentInput.length) {
            cursorPosition++;
            updateDisplay();
        }
    }

    // Functional Keys
    if (key === 'enter' || key === '=') {
        event.preventDefault();
        calculate();
    }

    // Removed 'c' and 'a' from clear to prevent accidental presses. Only explicit escape clears fully.
    if (key === 'escape') clearDisplay();

    if (key === 'backspace') {
        saveState();
        if (currentInput.length > 1) {
            if (cursorPosition > 0) {
                currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
                cursorPosition--;
            }
        } else {
            currentInput = '0';
            cursorPosition = 1;
        }
        updateDisplay();
    }
    if (key === 'delete') {
        saveState();
        if (cursorPosition < currentInput.length) {
            currentInput = currentInput.slice(0, cursorPosition) + currentInput.slice(cursorPosition + 1);
            updateDisplay();
        }
    }
    if (key === '.') appendValue('.');
    if (key === 'u') toggleCurrencyModal();
});

// Initial display
updateDisplay();

// --- Currency Conversion Logic ---

const currencyModal = document.getElementById('currency-modal');
const convAmountDisplay = document.getElementById('conv-amount');
const convResultDisplay = document.getElementById('conv-result');
const convRateDisplay = document.getElementById('conv-rate');
const convFromSelect = document.getElementById('conv-from');
const convToSelect = document.getElementById('conv-to');

let exchangeRates = null;
let baseCurrency = 'USD';
let isModalOpen = false;

// Fetch rates once on load
async function fetchGlobalRates() {
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        const data = await response.json();
        if (data.result === "success") {
            exchangeRates = data.rates;
            console.log("Global exchange rates loaded successfully.");
        } else {
            console.error("Failed to parse exchange rates on load.");
        }
    } catch (error) {
        console.error("Could not fetch global exchange rates on load:", error);
    }
}

// Call on startup
fetchGlobalRates();

function toggleCurrencyModal() {
    isModalOpen = !isModalOpen;
    if (isModalOpen) {
        currencyModal.classList.remove('hidden');
        currencyModal.classList.add('flex');

        // Base amount is either the last result, or if currently typing, the current input
        let baseAmount = currentInput;
        if (currentInput === '0' && lastResult !== null) {
            baseAmount = lastResult.toString();
        }

        // Remove commas if present in the raw input
        baseAmount = baseAmount.replace(/,/g, '');

        // Formatting cleanly for display in the modal
        convAmountDisplay.innerText = formatNumber(baseAmount, currentFormat);

        // Set attribute so we can read the raw value later
        convAmountDisplay.setAttribute('data-raw-value', parseFloat(baseAmount) || 0);

        performConversion();
    } else {
        currencyModal.classList.add('hidden');
        currencyModal.classList.remove('flex');
    }
}

function swapCurrencies() {
    const temp = convFromSelect.value;
    convFromSelect.value = convToSelect.value;
    convToSelect.value = temp;
    performConversion();
}

function performConversion() {
    const rawAmount = parseFloat(convAmountDisplay.getAttribute('data-raw-value'));
    if (isNaN(rawAmount)) {
        convResultDisplay.innerText = "Invalid Amount";
        return;
    }

    if (!exchangeRates) {
        convResultDisplay.innerText = "Error";
        convRateDisplay.innerText = "Rates failed to load on startup.";
        return;
    }

    const fromCurr = convFromSelect.value;
    const toCurr = convToSelect.value;

    try {
        // Calculate cross-currency rate using our cached USD base rates
        // Ensure the base rate exists, else default to 1
        const fromRate = exchangeRates[fromCurr] || 1;
        const toRate = exchangeRates[toCurr] || 1;

        // Convert 'from' currency to base currency, then to 'to' currency
        const amountInBase = rawAmount / fromRate;
        const convertedAmount = amountInBase * toRate;

        // Calculate the raw display rate between these two specific currencies
        const directRate = toRate / fromRate;

        // Format result based on Indian vs Intl setting
        let finalValue = convertedAmount;

        // Round nicely
        if (!Number.isInteger(finalValue)) {
            finalValue = finalValue.toFixed(4); // 4 decimals for precision
            // remove trailing zeros after decimal
            finalValue = parseFloat(finalValue).toString();
        } else {
            finalValue = finalValue.toString();
        }

        convResultDisplay.innerText = formatNumber(finalValue, currentFormat) + ' ' + toCurr;
        convRateDisplay.innerText = `1 ${fromCurr} = ${directRate.toFixed(4)} ${toCurr}`;

    } catch (error) {
        console.error("Currency conversion error:", error);
        convResultDisplay.innerText = "Conversion Error";
    }
}

// Re-calculate when dropdowns change
convFromSelect.addEventListener('change', performConversion);
convToSelect.addEventListener('change', performConversion);
