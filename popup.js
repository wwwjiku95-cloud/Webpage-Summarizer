// Summary সেভ রাখার জন্য
let currentSummary = '';

async function summarize() {
  const apiKey = document.getElementById('api-key').value.trim();
  const btn = document.getElementById('summarize-btn');
  const loading = document.getElementById('loading');
  const errorMsg = document.getElementById('error-msg');
  const resultBox = document.getElementById('result-box');

  // Error clear করো
  errorMsg.textContent = '';
  errorMsg.classList.remove('show');
  resultBox.style.display = 'none';

  // Validation
  if (!apiKey) {
    errorMsg.textContent = 'Please enter your Groq API key.';
    errorMsg.classList.add('show');
    return;
  }

  // Loading দেখাও
  btn.disabled = true;
  btn.textContent = '⏳ Summarizing...';
  loading.style.display = 'block';

  try {
    // Active tab থেকে page text নাও
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    // content.js কে inject করো এবং text নাও
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'getPageText'
    });

    const pageText = response.text;

    if (!pageText || pageText.length < 50) {
      throw new Error('Could not extract text from this page.');
    }

    // Groq API তে summarize করতে পাঠাও
    const summary = await callGroqAPI(apiKey, pageText, tab.title);

    // Result দেখাও
    currentSummary = summary;
    document.getElementById('summary-text').textContent = summary;
    resultBox.style.display = 'block';

  } catch (error) {
    errorMsg.textContent = 'Error: ' + error.message;
    errorMsg.classList.add('show');
  }

  // Loading বন্ধ করো
  loading.style.display = 'none';
  btn.disabled = false;
  btn.textContent = '🔍 Summarize This Page';
}

async function callGroqAPI(apiKey, pageText, pageTitle) {
  const prompt = `
You are a helpful assistant. Summarize the following webpage content clearly and concisely.

Page Title: ${pageTitle}

Page Content:
${pageText}

Instructions:
- Write a clear summary in 5-8 bullet points
- Use simple English
- Focus on the key information
- Start each point with a bullet (•)
`;

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function copySummary() {
  if (!currentSummary) return;

  navigator.clipboard.writeText(currentSummary).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 2000);
  });
}
// Button এ click listener লাগাও
document.getElementById('summarize-btn').addEventListener('click', summarize);
document.getElementById('copy-btn').addEventListener('click', copySummary);