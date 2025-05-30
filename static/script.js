// Content Analyzer - Main JavaScript File (Backend-Integrated Version)

class ContentAnalyzer {
    constructor() {
        this.currentContent = null;
        this.chatHistory = [];
        this.isAnalyzing = false;
        this.isChatting = false;

        this.initializeElements();
        this.bindEvents();
        this.initializeChat();
    }

    initializeElements() {
        // Input elements
        this.urlInput = document.getElementById('urlInput');
        this.pdfInput = document.getElementById('pdfInput');
        this.analyzeUrlBtn = document.getElementById('analyzeUrlBtn');
        this.analyzePdfBtn = document.getElementById('analyzePdfBtn');
        this.fileName = document.getElementById('fileName');

        // Toggle buttons
        this.toggleBtns = document.querySelectorAll('.toggle-btn');
        this.inputContainers = document.querySelectorAll('.input-container');

        // Loading and summary elements
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.summaryBox = document.getElementById('summaryBox');
        this.summaryContent = document.getElementById('summaryContent');

        // Chat elements
        this.chatSection = document.getElementById('chatSection');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.startChatBtn = document.getElementById('startChatBtn');
        this.chatStatus = document.getElementById('chatStatus');
        this.quickQuestions = document.getElementById('quickQuestions');
        this.typingIndicator = document.getElementById('typingIndicator');

        // Action buttons
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Toast container
        this.toast = document.getElementById('toast');

        // Resize handle
        this.resizeHandle = document.getElementById('resizeHandle');
    }

    bindEvents() {
        // Toggle between URL and PDF input
        this.toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchInputType(btn.dataset.type));
        });

        // File input handling
        this.pdfInput.addEventListener('change', (e) => this.handleFileSelection(e));

        // Analyze buttons
        this.analyzeUrlBtn.addEventListener('click', () => this.analyzeUrl());
        this.analyzePdfBtn.addEventListener('click', () => this.analyzePdf());

        // Enter key for URL input
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyzeUrl();
        });

        // Chat functionality
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.startChatBtn.addEventListener('click', () => this.activateChat());

        // Action buttons
        this.copyBtn.addEventListener('click', () => this.copySummary());
        this.downloadBtn.addEventListener('click', () => this.downloadSummary());

        // Resize functionality
        this.initializeResize();

        // Drag and drop for PDF
        this.initializeDragDrop();
    }

    switchInputType(type) {
        // Update toggle buttons
        this.toggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Update input containers
        this.inputContainers.forEach(container => {
            if (container.classList.contains(`${type}-input`)) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        });
    }

    handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            this.fileName.textContent = file.name;
            this.analyzePdfBtn.disabled = false;
            this.showToast('PDF file selected successfully', 'success');
        }
    }

    initializeDragDrop() {
        const fileLabel = document.querySelector('.file-upload-label');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileLabel.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            fileLabel.addEventListener(eventName, () => {
                fileLabel.style.borderColor = 'rgba(77, 182, 255, 0.8)';
                fileLabel.style.background = 'rgba(30, 50, 120, 0.7)';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileLabel.addEventListener(eventName, () => {
                fileLabel.style.borderColor = '';
                fileLabel.style.background = '';
            }, false);
        });

        fileLabel.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.pdfInput.files = files;
                this.handleFileSelection({ target: { files } });
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async analyzeUrl() {
        const url = this.urlInput.value.trim();
        if (!url) {
            this.showToast('Please enter a valid URL', 'error');
            return;
        }

        if (!this.isValidUrl(url)) {
            this.showToast('Please enter a valid URL format', 'error');
            return;
        }

        await this.performAnalysis('url', url);
    }

    async analyzePdf() {
        const file = this.pdfInput.files[0];
        if (!file) {
            this.showToast('Please select a PDF file', 'error');
            return;
        }

        await this.performAnalysis('pdf', file);
    }

    async performAnalysis(type, data) {
        if (this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.showLoading();

        try {
            let summary;
            if (type === 'url') {
                // Real backend call for URL
                const resp = await fetch('/analyze_url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: data })
                });
                const result = await resp.json();
                if (result.summary) {
                    summary = {
                        title: `Analysis of ${this.extractDomain(data)}`,
                        content: result.summary,
                        wordCount: result.summary.split(/\s+/).length,
                        readingTime: `${Math.ceil(result.summary.split(/\s+/).length / 200)} min`,
                        keyTopics: this.extractKeyTopics(result.summary)
                    };
                } else {
                    throw new Error(result.error || "Failed to analyze URL.");
                }
            } else {
                // Real backend call for PDF
                const formData = new FormData();
                formData.append("file", data);
                const resp = await fetch('/analyze_pdf', {
                    method: 'POST',
                    body: formData
                });
                const result = await resp.json();
                if (result.summary) {
                    summary = {
                        title: `PDF Analysis: ${data.name}`,
                        content: result.summary,
                        wordCount: result.summary.split(/\s+/).length,
                        readingTime: `${Math.ceil(result.summary.split(/\s+/).length / 200)} min`,
                        keyTopics: this.extractKeyTopics(result.summary)
                    };
                } else {
                    throw new Error(result.error || "Failed to analyze PDF.");
                }
            }

            this.currentContent = {
                type,
                data,
                summary,
                timestamp: new Date()
            };

            this.displaySummary(summary);
            this.generateQuickQuestions();
            this.showToast('Content analyzed successfully!', 'success');

            // Enable start chat button
            this.startChatBtn.disabled = false;
            this.startChatBtn.classList.remove('disabled');

        } catch (error) {
            this.showToast(error.message || 'Analysis failed. Please try again.', 'error');
            console.error('Analysis error:', error);
        } finally {
            this.hideLoading();
            this.isAnalyzing = false;
        }
    }

    extractKeyTopics(text) {
        // Simple heuristic for key topics: top 5 most frequent words longer than 5 chars
        const words = text.toLowerCase().match(/\b\w{6,}\b/g) || [];
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
    }

    displaySummary(summary) {
        this.summaryContent.innerHTML = `
            <div class="summary-header-info">
                <h4>${summary.title}</h4>
                <div class="summary-meta">
                    <span><i class="fas fa-clock"></i> ${summary.readingTime}</span>
                    <span><i class="fas fa-font"></i> ${summary.wordCount} words</span>
                </div>
            </div>
            <div class="summary-text">
                <p>${summary.content.replace(/\n/g, '</p><p>')}</p>
            </div>
            <div class="key-topics">
                <h5><i class="fas fa-tags"></i> Key Topics:</h5>
                <div class="topic-tags">
                    ${summary.keyTopics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                </div>
            </div>
        `;
        this.summaryBox.classList.add('active');
        this.summaryBox.style.display = "block";
        this.startChatBtn.disabled = false;
        this.startChatBtn.classList.remove('disabled');
    }

    generateQuickQuestions() {
        const questions = [
            "What are the main points?",
            "Can you explain this topic?",
            "What are the key insights?",
            "Summarize the conclusions",
            "What should I know about this?"
        ];

        this.quickQuestions.innerHTML = questions
            .map(q => `<button class="quick-question" type="button">${q}</button>`)
            .join('');

        Array.from(this.quickQuestions.querySelectorAll('.quick-question')).forEach(btn => {
            btn.addEventListener('click', () => {
                this.chatInput.value = btn.textContent;
                this.sendMessage();
            });
        });
    }

    activateChat() {
        this.chatInput.disabled = false;
        this.sendBtn.disabled = false;
        this.updateChatStatus('active', 'Ready to answer questions');

        // Add activation message
        this.addMessage('ai', "Great! I've analyzed the content and I'm ready to answer your questions. What would you like to know?");
        this.chatSection.scrollIntoView({behavior: 'smooth'});
        this.chatInput.focus();
    }

    initializeChat() {
        this.updateChatStatus('inactive', 'Analyze content first');
        this.chatInput.disabled = true;
        this.sendBtn.disabled = true;
        this.startChatBtn.disabled = true;
        this.startChatBtn.classList.add('disabled');
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isChatting) return;

        this.addMessage('user', message);
        this.chatInput.value = '';
        this.isChatting = true;
        this.showTypingIndicator();

        try {
            // Use streaming API
            let aiMsgDiv = this.addMessage('ai', '');
            const resp = await fetch('/ask', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ question: message })
            });

            if (!resp.ok || !resp.body) throw new Error("No streaming response.");

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let done = false, buffer = "";
            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                buffer += value ? decoder.decode(value, { stream: !done }) : "";
                let lines = buffer.split("\n\n");
                buffer = lines.pop(); // last incomplete part
                for (let line of lines) {
                    if (line.startsWith("data:")) {
                        aiMsgDiv.querySelector('.message-content p').innerText += line.replace("data:", "").trim();
                        this.scrollToBottom();
                    }
                }
            }
            this.hideTypingIndicator();
            if (!aiMsgDiv.querySelector('.message-content p').innerText.trim()) {
                aiMsgDiv.querySelector('.message-content p').innerText = "I'm sorry, I couldn't generate an answer.";
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('ai', "I'm sorry, I encountered an error while processing your question. Please try again.");
        } finally {
            this.isChatting = false;
        }
    }

    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = sender === 'ai' ?
            '<div class="ai-avatar"><i class="fas fa-robot"></i></div>' :
            '<div class="user-avatar"><i class="fas fa-user"></i></div>';

        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content">
                <p>${content || ''}</p>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    showTypingIndicator() {
        if (this.typingIndicator) this.typingIndicator.style.display = "block";
    }

    hideTypingIndicator() {
        if (this.typingIndicator) this.typingIndicator.style.display = "none";
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateChatStatus(status, message) {
        const statusIcon = this.chatStatus.querySelector('i');
        const statusText = this.chatStatus.querySelector('span');

        statusIcon.className = status === 'active' ? 'fas fa-circle' : 'fas fa-circle';
        statusIcon.style.color = status === 'active' ? '#4db6ff' : '#666';
        statusText.textContent = message;
    }

    showLoading() {
        this.summaryBox.classList.remove('active');
        this.summaryBox.style.display = "none";
        this.loadingSpinner.style.display = "block";
        this.analyzeUrlBtn.disabled = true;
        this.analyzePdfBtn.disabled = true;
    }

    hideLoading() {
        this.loadingSpinner.style.display = "none";
        this.analyzeUrlBtn.disabled = false;
        this.analyzePdfBtn.disabled = false;
    }

    copySummary() {
        if (!this.currentContent) return;

        const textToCopy = this.summaryContent.textContent;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showToast('Summary copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Summary copied to clipboard!', 'success');
        }
    }

    downloadSummary() {
        if (!this.currentContent) return;

        const content = this.currentContent.summary;
        const text = `${content.title}\n\n${content.content}\n\nKey Topics: ${content.keyTopics.join(', ')}\nWord Count: ${content.wordCount}\nReading Time: ${content.readingTime}`;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `summary_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Summary downloaded!', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'check-circle' :
            type === 'error' ? 'exclamation-triangle' :
                'info-circle';

        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
        `;

        this.toast.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlide 0.5s ease reverse';
                setTimeout(() => toast.remove(), 500);
            }
        }, 4000);
    }

    initializeResize() {
        let isResizing = false;

        this.resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        });

        const handleResize = (e) => {
            if (!isResizing) return;

            const container = document.querySelector('.main-container');
            const rect = container.getBoundingClientRect();
            const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

            if (newLeftWidth > 30 && newLeftWidth < 70) {
                document.querySelector('.left-panel').style.flex = `0 0 ${newLeftWidth}%`;
                document.querySelector('.right-panel').style.flex = `0 0 ${100 - newLeftWidth}%`;
            }
        };

        const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (_) {
            return 'Unknown Domain';
        }
    }
}

// Initialize the application
window.contentAnalyzer = new ContentAnalyzer();

// Error handling for the entire application
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    if (window.contentAnalyzer) {
        contentAnalyzer.showToast('An unexpected error occurred', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.contentAnalyzer) {
        contentAnalyzer.showToast('An unexpected error occurred', 'error');
    }
});