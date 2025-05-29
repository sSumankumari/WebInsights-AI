// Global state management
const AppState = {
    currentContent: null,
    isProcessing: false,
    chatEnabled: false,
    messages: []
};

// DOM Elements
const elements = {
    // Toggle buttons
    toggleBtns: document.querySelectorAll('.toggle-btn'),
    urlInput: document.getElementById('urlInput'),
    pdfInput: document.getElementById('pdfInput'),
    fileName: document.getElementById('fileName'),
    
    // Input containers
    urlContainer: document.querySelector('.url-input'),
    pdfContainer: document.querySelector('.pdf-input'),
    
    // Buttons
    analyzeUrlBtn: document.getElementById('analyzeUrl'),
    analyzePdfBtn: document.getElementById('analyzePdf'),
    startChatBtn: document.getElementById('startChatBtn'),
    sendBtn: document.getElementById('sendBtn'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    
    // Containers
    loading: document.querySelector('.loading'),
    result: document.getElementById('result'),
    chatContainer: document.querySelector('.chat-container'),
    userInput: document.getElementById('userInput'),
    chatMessages: document.getElementById('chatMessages')
};

// Utility Functions
function showLoading() {
    elements.loading.style.display = 'flex';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function toggleInput(type) {
    if (type === 'url') {
        elements.urlContainer.style.display = 'block';
        elements.pdfContainer.style.display = 'none';
    } else {
        elements.urlContainer.style.display = 'none';
        elements.pdfContainer.style.display = 'block';
    }
}

// Event Handlers
elements.toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        toggleInput(type);
    });
});

elements.analyzeUrlBtn.addEventListener('click', () => {
    const url = elements.urlInput.value;
    if (!url) return alert('Please enter a URL');

    AppState.isProcessing = true;
    showLoading();
    elements.result.innerText = "";

    // Simulate API call
    setTimeout(() => {
        hideLoading();
        AppState.currentContent = `Summary of the content from ${url}`;
        elements.result.innerText = AppState.currentContent;
        elements.chatContainer.style.display = 'block';
        AppState.chatEnabled = true;
    }, 2000);
});

elements.analyzePdfBtn.addEventListener('click', () => {
    const file = elements.pdfInput.files[0];
    if (!file) return alert('Please upload a PDF');

    elements.fileName.innerText = file.name;
    AppState.isProcessing = true;
    showLoading();
    elements.result.innerText = "";

    // Simulate API call
    setTimeout(() => {
        hideLoading();
        AppState.currentContent = `Summary of the uploaded PDF: ${file.name}`;
        elements.result.innerText = AppState.currentContent;
        elements.chatContainer.style.display = 'block';
        AppState.chatEnabled = true;
    }, 2000);
});

elements.sendBtn.addEventListener('click', () => {
    const userText = elements.userInput.value.trim();
    if (!userText) return;

    const userMessage = `<div class="chat-message user">You: ${userText}</div>`;
    elements.chatMessages.innerHTML += userMessage;
    elements.userInput.value = "";

    // Simulate response
    setTimeout(() => {
        const botResponse = `<div class="chat-message bot">Bot: This is a response to "${userText}"</div>`;
        elements.chatMessages.innerHTML += botResponse;
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }, 1000);
});

elements.copyBtn.addEventListener('click', () => {
    if (!AppState.currentContent) return;
    navigator.clipboard.writeText(AppState.currentContent)
        .then(() => alert('Summary copied to clipboard!'))
        .catch(() => alert('Failed to copy content.'));
});

elements.downloadBtn.addEventListener('click', () => {
    if (!AppState.currentContent) return;

    const blob = new Blob([AppState.currentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
