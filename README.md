# AI Email Checker Chrome Extension

This Chrome Extension adds a small "✨ Check with AI" button into your Gmail and Outlook email composure windows. When you click it, the extension securely analyzes your email for spelling errors, grammatical mistakes, and logical flaws using powerful AI, then offers you suggestions that you can apply with one click.

Below is a complete guide to help you set this up—even if you've never used developer mode or an API key before!

## ⚠️ Important Risks and Disclaimers

Before installing this extension, please review the following risks carefully:

### 1. Developer Mode Risks
Installing extensions in **Developer Mode** means you are installing code directly from your computer, rather than through the official Google Chrome Web Store. 
* **The Risk:** Google does not review developer mode extensions for security. Only install folders from sources (or developers) you explicitly trust. Malicious code could potentially access your web browsing data.
* **Our Promise:** This specific extension is open-source and its strictly limited goal is to send your composed email text directly to your chosen AI provider (Google or OpenAI) and receive corrections.

### 2. AI Data Privacy Risks
To check your email, this extension must send the text you have written to the servers of either Google (Gemini) or OpenAI (ChatGPT). 
* **The Risk:** If your email includes highly sensitive, confidential, or proprietary personal/business information (like passwords, social security numbers, or sensitive financial data), **you are sending it to a third party**. 
* **Best Practice:** Avoid using *any* AI checker when composing emails containing highly confidential information.

### 3. AI Hallucination and Tone
* **The Risk:** AI is not flawless. It might misunderstand your logic, suggest words that change the tone of your email so it sounds robotic, or flag correct words as incorrect (sometimes known as "hallucinating"). 
* **Best Practice:** Always quickly read over the AI's suggestions before hitting the "Apply Suggestion" button. You are still the final author of the email!

---

## 🚀 Setup Guide

Follow these steps carefully to get your AI companion up and running.

### Phase 1: Obtaining your AI "API Key"
An API Key is like a secret password that allows the extension to talk to the AI provider securely under your account. You can choose either Google Gemini or OpenAI.

#### Option A: Getting a Google Gemini API Key (Recommended & Often Free)
1. Go to Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account.
3. On the left-hand menu, click **"Get API key"**.
4. Click the **"Create API key"** button.
5. Once your key is generated, copy the long string of letters and numbers. **Keep it secret!**

#### Option B: Getting an OpenAI API Key
1. Go to the OpenAI Developer Platform: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account. (Note: OpenAI usually requires setting up a payment method to use their API, though it costs fractions of a cent per email).
3. Click **"Create new secret key"**.
4. Give it a name (like "My Email Extension") and click Create.
5. Copy the long string starting with `sk-`. **Keep it secret!**

---

### Phase 2: Installing the Extension in Chrome

Since this extension isn't in the Web Store yet, we install it through "Developer Mode."

1. Download or clone this repository folder to your computer so you have a folder named `ai-mailcheck-chrome` (or similar) containing files like `manifest.json`.
2. Open Google Chrome.
3. In the URL bar at the top, type `chrome://extensions/` and hit Enter.
4. Look in the top right corner of the page. You will see a toggle switch labeled **Developer mode**. Click it so it turns on (the switch usually turns blue).
5. A new menu bar will appear at the top left. Click the button that says **Load unpacked**.
6. A file browser window will open. Navigate to the folder you downloaded in Step 1, select it, and click "Select Folder" (or "Open").
7. **Success!** You should now see the "AI Email Checker" listed among your extensions.

---

### Phase 3: Configuring Your Extension

We now need to give the extension your secret API key so it can work.

1. Look at the top right of your Chrome browser (next to the website address bar). Click the puzzle piece icon (🧩) to see all your extensions.
2. Find **"AI Email Checker"** in the list and click the little pushpin icon next to it to "pin" it to your bar for easy access.
3. Click the new AI Email Checker icon that appeared in your browser bar. A small popup menu will open.
4. In the dropdown, select the AI Provider you got your key for (Google Gemini or OpenAI).
5. Paste your secret API key into the text box.
6. Click **Save Settings**. 

### Phase 4: Using It!

You are now ready to go:
1. Open Gmail or Outlook.
2. Compose a new email or reply to an existing one. 
3. When you click into the text box to type, a purple button saying **"✨ Check with AI"** will appear in the bottom right corner.
4. Type your message and hit the button! An overlay will appear showing any mistakes it found and giving you the option to apply them to your email effortlessly. 

Enjoy your perfectly proofread emails!
