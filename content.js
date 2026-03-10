console.log("AI Email Checker: Content script loaded - waiting for compose windows...");
let currentComposer = null;

// Initialize action container
const actionContainer = document.createElement('div');
actionContainer.id = 'ai-checker-actions-container';
actionContainer.style.display = 'none';

// AI Check Button
const globalBtn = document.createElement('button');
globalBtn.id = 'ai-checker-global-btn';
globalBtn.className = 'ai-checker-btn';
globalBtn.innerText = '✨ Check with AI';

// Tone Select Dropdown
const toneSelect = document.createElement('select');
toneSelect.id = 'ai-checker-tone-select';
toneSelect.className = 'ai-checker-select';
toneSelect.innerHTML = `
  <option value="Professional">Professional</option>
  <option value="Determining">Determining</option>
  <option value="Friendly">Friendly</option>
`;

// Refine Button
const refineBtn = document.createElement('button');
refineBtn.id = 'ai-checker-refine-btn';
refineBtn.className = 'ai-checker-btn';
refineBtn.innerText = 'Refine';

actionContainer.appendChild(globalBtn);
actionContainer.appendChild(toneSelect);
actionContainer.appendChild(refineBtn);

// We wait for the body to be available
const intervalId = setInterval(() => {
    if (document.body) {
        document.body.appendChild(actionContainer);
        clearInterval(intervalId);
    }
}, 100);

globalBtn.addEventListener('click', () => {
    if (currentComposer) handleCheckClick(currentComposer);
});

refineBtn.addEventListener('click', () => {
    if (currentComposer) handleRefineClick(currentComposer, toneSelect.value);
});

// Periodically check for compose windows
setInterval(() => {
    // Selectors for Gmail (.M9, .Am.Al.editable), 
    // Outlook ([aria-label*="Message body"]),
    // GMX/Web.de (usually via classes like .cke_editable or iframe bodies if we had access, but often just contenteditable="true" works),
    // and generic ones
    const composers = document.querySelectorAll('[role="textbox"][contenteditable="true"], .M9, .Am.Al.editable, [aria-multiline="true"], .cke_editable, [contenteditable="true"]');

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
        actionContainer.style.display = 'flex'; // Show buttons when composer is found
        if (!actionContainer.dataset.logged) {
            console.log("AI Email Checker: Found composer and injected buttons!");
            actionContainer.dataset.logged = "true";
        }
    } else {
        actionContainer.style.display = 'none';
        currentComposer = null;
        actionContainer.dataset.logged = "";
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

                // Use TreeWalker to replace text without destroying HTML tags
                let foundAndReplaced = false;
                const walker = document.createTreeWalker(composer, NodeFilter.SHOW_TEXT, null, false);

                let node;
                while ((node = walker.nextNode())) {
                    if (node.nodeValue.includes(err.original_text)) {
                        node.nodeValue = node.nodeValue.replace(err.original_text, err.suggestion);
                        foundAndReplaced = true;

                        // Let email clients know the content changed
                        composer.dispatchEvent(new Event('input', { bubbles: true }));
                        break;
                    }
                }

                if (!foundAndReplaced) {
                    // Fallback to naive replacement if TreeWalker didn't find the exact contiguous string 
                    // (e.g., if the error spans across multiple HTML tags like "bad <b>word</b>")
                    if (composer.innerHTML.includes(err.original_text)) {
                        composer.innerHTML = composer.innerHTML.replace(err.original_text, err.suggestion);
                        composer.dispatchEvent(new Event('input', { bubbles: true }));
                    } else if (composer.innerText.includes(err.original_text)) {
                        composer.innerText = composer.innerText.replace(err.original_text, err.suggestion);
                        composer.dispatchEvent(new Event('input', { bubbles: true }));
                    } else {
                        alert("Could not automatically apply the change due to complex formatting. Please apply manually.");
                        return; // Don't gray out the button
                    }
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

async function handleRefineClick(composer, tone) {
    const text = composer.innerText || composer.textContent;

    if (!text || text.trim().length === 0) {
        alert("Please enter some text in the email body before refining.");
        return;
    }

    const refineBtn = document.getElementById('ai-checker-refine-btn');
    if (refineBtn) {
        refineBtn.innerText = 'Refining...';
        refineBtn.disabled = true;
    }

    chrome.runtime.sendMessage({ action: 'refineEmail', text: text, tone: tone }, (response) => {
        if (refineBtn) {
            refineBtn.innerText = 'Refine';
            refineBtn.disabled = false;
        }

        if (chrome.runtime.lastError) {
            alert("Extension Error: " + chrome.runtime.lastError.message);
            return;
        }

        if (response && response.error) {
            alert("AI Checker Error: " + response.error);
            return;
        }

        if (response && response.success && response.results) {
            showRefineResultsOverlay(composer, response.results.rewritten_text);
        } else {
            alert("Unknown error occurred");
        }
    });
}

function showRefineResultsOverlay(composer, rewrittenText) {
    const existing = document.getElementById('ai-checker-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ai-checker-overlay';

    if (rewrittenText) {
        overlay.innerHTML = `
            <h3>AI Refinement</h3>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 16px; white-space: pre-wrap; font-family: inherit;">${rewrittenText}</div>
            <div style="text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button id="ai-checker-close" class="ai-checker-secondary-btn">Cancel</button>
                <button id="ai-checker-apply-all-btn" class="ai-checker-apply-btn">Apply Rewrite</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('ai-checker-close').addEventListener('click', () => overlay.remove());

        document.getElementById('ai-checker-apply-all-btn').addEventListener('click', (e) => {
            if (composer.innerHTML !== undefined) {
                composer.innerText = rewrittenText;
            } else {
                composer.textContent = rewrittenText;
            }
            composer.dispatchEvent(new Event('input', { bubbles: true }));

            e.target.innerText = 'Applied!';
            e.target.disabled = true;
            setTimeout(() => overlay.remove(), 1000);
        });
    } else {
        overlay.innerHTML = '<h3>Error</h3><p>Could not refine text.</p><div style="text-align:right;"><button id="ai-checker-close" class="ai-checker-secondary-btn">Close</button></div>';
        document.body.appendChild(overlay);
        document.getElementById('ai-checker-close').addEventListener('click', () => overlay.remove());
    }
}
