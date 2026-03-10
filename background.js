chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkEmail' || request.action === 'refineEmail') {
    // 1. Get settings
    chrome.storage.sync.get(['aiProvider', 'apiKey'], async (settings) => {
      if (!settings.apiKey) {
        sendResponse({ error: 'API Key not configured. Please click the extension icon to set it.' });
        return;
      }
      try {
        const prompt = request.action === 'refineEmail' ? getRefineSystemPrompt(request.tone) : CHECK_SYSTEM_PROMPT;
        const results = await generateAIResponse(settings.aiProvider, settings.apiKey, request.text, prompt);
        sendResponse({ success: true, results: results });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    });
    return true; // Keep message channel open for async response
  }
});

const CHECK_SYSTEM_PROMPT = `You are an expert email proofreader. Review the following email text for spelling errors, grammatical mistakes, and logical inconsistencies. Provide a JSON response listing each error, the original text snippet, and a suggested correction. Do not change the tone unnecessarily. Format response as: {"errors": [{"original_text": "...", "suggestion": "...", "reason": "..."}]}`;

function getRefineSystemPrompt(tone) {
  return `You are an expert email assistant. Rewrite the following email to be more ${tone}, while preserving the original context and meaning. Provide a JSON response with the final rewritten text. Format response as: {"rewritten_text": "..."}`;
}

async function generateAIResponse(provider, apiKey, text, prompt) {
  if (provider === 'gemini') {
    return await callGemini(apiKey, text, prompt);
  } else {
    return await callOpenAI(apiKey, text, prompt);
  }
}

async function callGemini(apiKey, text, prompt) {
  // Setup the API request to Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: `${prompt}\n\nText to process:\n${text}`
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const jsonString = data.candidates[0].content.parts[0].text;
  return JSON.parse(jsonString);
}

async function callOpenAI(apiKey, text, prompt) {
  // Setup the API request to OpenAI
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `Text to process:\n${text}` }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const jsonString = data.choices[0].message.content;
  return JSON.parse(jsonString);
}
