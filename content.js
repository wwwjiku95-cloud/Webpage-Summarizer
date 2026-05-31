function getPageText() {

  const bodyText = document.body.innerText;

  return bodyText.slice(0, 3000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageText') {
    const text = getPageText();
    sendResponse({ text: text });
  }
});