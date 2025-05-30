// Content Analyzer - Main JavaScript File

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
        this.analyzeUrlBtn = document.getElementById('analyzeUrl');
        this.analyzePdfBtn = document.getElementById('analyzePdf');
        this.fileName = document.getElementById('fileName');
        
        // Toggle buttons
        this.toggleBtns = document.querySelectorAll('.toggle-btn');
        this.inputContainers = document.querySelectorAll('.input-container');
        
        // Loading and summary elements
        this.loadingContainer = document.getElementById('loadingContainer');
        this.summaryContainer = document.getElementById('summaryContainer');
        this.summaryContent = document.getElementById('summaryContent');
        this.loadingSteps = document.querySelectorAll('.step');
        
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.startChatBtn = document.getElementById('startChatBtn');
        this.chatStatus = document.getElementById('chatStatus');
        this.quickQuestions = document.getElementById('quickQuestions');
        
        // Action buttons
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
        
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
            // Simulate analysis steps
            await this.simulateAnalysisSteps();
            
            // Generate mock summary based on type
            const summary = await this.generateMockSummary(type, data);
            
            this.currentContent = {
                type,
                data,
                summary,
                timestamp: new Date()
            };
            
            this.displaySummary(summary);
            this.generateQuickQuestions();
            this.showToast('Content analyzed successfully!', 'success');
            
        } catch (error) {
            this.showToast('Analysis failed. Please try again.', 'error');
            console.error('Analysis error:', error);
        } finally {
            this.hideLoading();
            this.isAnalyzing = false;
        }
    }

    async simulateAnalysisSteps() {
        const steps = ['Fetching content', 'Analyzing text', 'Generating summary'];
        
        for (let i = 0; i < steps.length; i++) {
            // Update step status
            this.loadingSteps.forEach((step, index) => {
                step.classList.toggle('active', index <= i);
            });
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    async generateMockSummary(type, data) {
        // Mock content generation based on type
        if (type === 'url') {
            return {
                title: `Analysis of ${this.extractDomain(data)}`,
                content: `This webpage contains comprehensive information about various topics. The content is well-structured and provides valuable insights into the subject matter. Key points include detailed explanations, practical examples, and relevant data that support the main arguments presented.

The document appears to be professionally written with clear sections and logical flow. It covers multiple aspects of the topic, making it a valuable resource for readers seeking in-depth understanding.

Main themes identified:
• Detailed analysis and explanation of core concepts
• Practical applications and real-world examples  
• Supporting data and evidence
• Well-organized structure with clear sections
• Professional presentation and formatting

This content would be suitable for educational purposes, research, or professional development. The information presented appears to be current and relevant to the field.`,
                wordCount: 156,
                readingTime: '2-3 minutes',
                keyTopics: ['Analysis', 'Information', 'Content Structure', 'Professional Writing']
            };
        } else {
            return {
                title: `PDF Analysis: ${data.name}`,
                content: `This PDF document contains ${Math.floor(Math.random() * 50 + 10)} pages of content covering various important topics. The document is well-organized with clear headings and structured information.

The content includes detailed explanations, data analysis, and comprehensive coverage of the subject matter. Key sections provide in-depth information that would be valuable for research, education, or professional purposes.

Document highlights:
• Comprehensive coverage of main topics
• Well-structured organization with clear sections
• Detailed analysis and supporting information
• Professional formatting and presentation
• Relevant data and examples throughout

The document appears to be authoritative and well-researched, making it a valuable resource for anyone interested in the subject matter. The information is presented in a clear, accessible manner.`,
                wordCount: Math.floor(Math.random() * 1000 + 500),
                readingTime: `${Math.floor(Math.random() * 10 + 5)}-${Math.floor(Math.random() * 15 + 10)} minutes`,
                keyTopics: ['Document Analysis', 'Research', 'Professional Content', 'Data Analysis']
            };
        }
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
                ${summary.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
            </div>
            <div class="key-topics">
                <h5><i class="fas fa-tags"></i> Key Topics:</h5>
                <div class="topic-tags">
                    ${summary.keyTopics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                </div>
            </div>
        `;
        
        this.summaryContainer.classList.add('active');
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
            .map(q => `<button class="quick-question" onclick="contentAnalyzer.askQuestion('${q}')">${q}</button>`)
            .join('');
    }

    activateChat() {
        this.chatInput.disabled = false;
        this.sendBtn.disabled = false;
        this.updateChatStatus('active', 'Ready to answer questions');
        
        // Add activation message
        this.addMessage('ai', "Great! I've analyzed the content and I'm ready to answer your questions. What would you like to know?");
        
        this.chatInput.focus();
    }

    initializeChat() {
        this.updateChatStatus('inactive', 'Analyze content first');
    }

    askQuestion(question) {
        this.chatInput.value = question;
        this.sendMessage();
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isChatting) return;
        
        this.addMessage('user', message);
        this.chatInput.value = '';
        this.isChatting = true;
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Simulate AI response
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            const response = this.generateAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage('ai', response);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('ai', "I'm sorry, I encountered an error while processing your question. Please try again.");
        } finally {
            this.isChatting = false;
        }
    }

    generateAIResponse(question) {
        const responses = [
            "Based on the analyzed content, here's what I found: The main points revolve around comprehensive analysis and structured information presentation. The content provides detailed insights that are well-organized and professionally presented.",
            
            "Great question! From my analysis, the key insights include thorough coverage of the topic with supporting data and examples. The content is structured to provide maximum value to readers seeking in-depth understanding.",
            
            "According to the content I analyzed, the main conclusions emphasize the importance of well-structured information and professional presentation. The document provides valuable insights supported by relevant data.",
            
            "The content covers several important aspects that I can help clarify. The information is presented in a logical flow with clear sections that build upon each other to provide comprehensive understanding.",
            
            "From what I've analyzed, this content offers valuable information that's well-researched and professionally presented. The key points are supported by data and examples that strengthen the overall message."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
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
                <p>${content}</p>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message-loading';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="ai-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
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
        this.summaryContainer.classList.remove('active');
        this.loadingContainer.classList.add('active');
        this.analyzeUrlBtn.disabled = true;
        this.analyzePdfBtn.disabled = true;
    }

    hideLoading() {
        this.loadingContainer.classList.remove('active');
        this.analyzeUrlBtn.disabled = false;
        this.analyzePdfBtn.disabled = false;
        
        // Reset loading steps
        this.loadingSteps.forEach(step => step.classList.remove('active'));
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
        
        this.toastContainer.appendChild(toast);
        
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
const contentAnalyzer = new ContentAnalyzer();

// Additional utility functions
document.addEventListener('DOMContentLoaded', () => {
    // Add some initial styling for dynamic content
    const style = document.createElement('style');
    style.textContent = `
        .summary-header-info h4 {
            color: #4db6ff;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .summary-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            font-size: 0.85rem;
            opacity: 0.8;
        }
        
        .summary-meta span {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .summary-text p {
            margin-bottom: 15px;
            line-height: 1.6;
        }
        
        .key-topics {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(100, 150, 255, 0.2);
        }
        
        .key-topics h5 {
            color: #4db6ff;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .topic-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .topic-tag {
            background: rgba(77, 182, 255, 0.2);
            color: #4db6ff;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            border: 1px solid rgba(77, 182, 255, 0.3);
        }
    `;
    document.head.appendChild(style);
});

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

// Fetching API calls from backend
// For URL
fetch('http://localhost:5000/analyze_url', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ url: inputURL })
})

// For PDF
const formData = new FormData();
formData.append("file", selectedPDFFile);
fetch('http://localhost:5000/analyze_pdf', {
  method: 'POST',
  body: formData
})

// For QnA
fetch('http://localhost:5000/ask', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ question: userQuestion })
})
