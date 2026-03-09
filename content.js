console.log("AI Email Checker: Content script loaded - waiting for compose windows...");
let currentComposer = null;

// Initialize global button
const globalBtn = document.createElement('button');
globalBtn.id = 'ai-checker-global-btn';
globalBtn.className = 'ai-checker-btn';
globalBtn.innerText = '✨ Check with AI';
globalBtn.style.display = 'none';

// We wait for the body to be available
const intervalId = setInterval(() => {
    if (document.body) {
        document.body.appendChild(globalBtn);
        clearInterval(intervalId);
    }
}, 100);

globalBtn.addEventListener('click', () => {
    if (currentComposer) handleCheckClick(currentComposer);
});

// Periodically check for compose windows
setInterval(() => {
    // Selectors for Gmail (.M9, .Am.Al.editable), Outlook ([aria-label*="Message body"]), and generic ones
    const composers = document.querySelectorAll('[role="textbox"][contenteditable="true"], .M9, .Am.Al.editable, [aria-multiline="true"]');
    
    // Filter out hidden elements or tiny elements
    const visibleComposers = Array.from(composers).filter(c => {
        const rect = c.getBoundingClientRect();
        return rect.width > 50 && rect.height > 20 && c.style.display !== 'none' && c.style.visibility !== 'hidden';
    });

    if (visibleComposers.length > 0) {
        // Find the active one if any, otherwise default to the first
        let active = visibleComposers.find(c => c === document.activeElement || c.contains(document.activeElement));
        if (!active) active = visibleComposers[0];
        
        currentComposer = active;
        globalBtn.style.display = 'flex'; // Show button when composer is found
        if (!globalBtn.dataset.logged) {
            console.log("AI Email Checker: Found composer and injected button!");
            globalBtn.dataset.logged = "true";
        }
    } else {
        globalBtn.style.display = 'none';
        currentComposer = null;
        globalBtn.dataset.logged = "";
    }
}, 1000);

async function handleCheckClick(composer) {
    const text = composer.innerText || composer.textContent;
    
    if (!text || text.trim().length === 0) {
        alert("Please enter some text in the email body before checking.");
        return;
    }

    globalBtn.innerText = 'Checking...';
    globalBtn.disabled = true;

    chrome.runtime.sendMessage({ action: 'checkEmail', text: text }, (response) => {
        globalBtn.innerText = '✨ Check with AI';
        globalBtn.disabled = false;

        if (chrome.runtime.lastError) {
          alert("Extension Error: " + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.error) {
            alert("AI Checker Error: " + response.error);
            return;
        }

        if (response && response.success && response.results) {
            showResultsOverlay(composer, response.results.errors);
        } else {
            alert("Unknown error occurred");
        }
    });
}

function showResultsOverlay(composer, errors) {
    const existing = document.getElementById('ai-checker-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ai-checker-overlay';
    
    if (errors && errors.length > 0) {
        let html = '<h3>AI Suggestions</h3><ul style="list-style:none; padding:0; margin: 0;">';
        errors.forEach((err, idx) => {
            html += `
                <li style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <strong>Problem Found:</strong> <span style="background-color: #ffe6e6; padding: 2px 4px; border-radius: 3px; color: #d32f2f;">${err.original_text || 'Unknown'}</span><br>
                    <strong>Suggestion:</strong> <span style="background-color: #e6ffe6; padding: 2px 4px; border-radius: 3px; color: #2e7d32;">${err.suggestion}</span><br>
                    <strong>Reason:</strong> <span style="color:#555;">${err.reason}</span><br>
                    <button class="ai-checker-apply-btn" data-idx="${idx}">Apply Suggestion</button>
                </li>
            `;
        });
        html += '</ul><div style="text-align:right; margin-top: 15px;"><button id="ai-checker-close">Close</button></div>';
        overlay.innerHTML = html;
        
        document.body.appendChild(overlay);
        document.getElementById('ai-checker-close').addEventListener('click', () => overlay.remove());
        
        const applyBtns = document.querySelectorAll('.ai-checker-apply-btn');
        applyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-idx');
                const err = errors[idx];
                
                // Extremely basic replacement logic (might fail with complex HTML structures)
                // MVP solution: simply replace the text occurrence
                if(composer.innerHTML.includes(err.original_text)) {
                   composer.innerHTML = composer.innerHTML.replace(err.original_text, err.suggestion);
                } else if (composer.innerText.includes(err.original_text)) {
                   composer.innerText = composer.innerText.replace(err.original_text, err.suggestion);
                } else {
                   // Let the user know we couldn't auto-apply
                   alert("Could not automatically apply the change due to formatting. Please apply manually.");
                }
                
                e.target.innerText = 'Applied!';
                e.target.disabled = true;
            });
        });
    } else {
        overlay.innerHTML = '<h3>Looking good!</h3><p>No issues found in your text.</p><div style="text-align:right;"><button id="ai-checker-close">Close</button></div>';
        document.body.appendChild(overlay);
        document.getElementById('ai-checker-close').addEventListener('click', () => overlay.remove());
    }
}
