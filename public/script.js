/**
 * AI Chatbot Client Script
 * Praktikum Pengembangan Web Service - Pertemuan 10
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const chatMessages = document.getElementById("chatMessages");
    const welcomeContainer = document.getElementById("welcomeContainer");
    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const stopBtn = document.getElementById("stopBtn");
    const clearChatBtn = document.getElementById("clearChatBtn");
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
    const suggestionChips = document.querySelectorAll(".suggestion-chips .chip");

    // Conversation State
    let conversationHistory = [];
    let isGenerating = false;
    let abortController = null;

    // Auto resize textarea
    messageInput.addEventListener("input", autoResizeTextarea);

    function autoResizeTextarea() {
        messageInput.style.height = "auto";
        const newHeight = Math.min(messageInput.scrollHeight, 160);
        messageInput.style.height = `${newHeight}px`;
    }

    // Handle Enter key for submission (Shift+Enter for new line)
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating && messageInput.value.trim().length > 0) {
                chatForm.dispatchEvent(new Event("submit", { cancelable: true }));
            }
        }
    });

    // Handle Suggestion Chips
    suggestionChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            const promptText = chip.getAttribute("data-prompt");
            if (promptText && !isGenerating) {
                messageInput.value = promptText;
                autoResizeTextarea();
                chatForm.dispatchEvent(new Event("submit", { cancelable: true }));
            }
        });
    });

    // Clear Chat
    clearChatBtn.addEventListener("click", () => {
        if (isGenerating && abortController) {
            abortController.abort();
            abortController = null;
            setGeneratingState(false);
        }
        if (conversationHistory.length > 0) {
            if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat percakapan?")) {
                conversationHistory = [];
                const rows = chatMessages.querySelectorAll(".message-row");
                rows.forEach((row) => row.remove());
                if (welcomeContainer) {
                    welcomeContainer.style.display = "block";
                }
            }
        }
    });

    // Scroll to bottom button visibility
    chatMessages.addEventListener("scroll", () => {
        const threshold = 150;
        const isScrolledUp = 
            chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight > threshold;
        
        scrollToBottomBtn.style.display = isScrolledUp ? "flex" : "none";
    });

    scrollToBottomBtn.addEventListener("click", () => {
        scrollToBottom(true);
    });

    function setGeneratingState(generating) {
        isGenerating = generating;
        if (generating) {
            sendBtn.style.display = "none";
            stopBtn.style.display = "inline-flex";
            messageInput.disabled = true;
        } else {
            stopBtn.style.display = "none";
            sendBtn.style.display = "inline-flex";
            messageInput.disabled = false;
            messageInput.focus();
        }
    }

    function scrollToBottom(smooth = false) {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: smooth ? "smooth" : "auto"
        });
    }

    function getFormattedTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Append User Message to UI
    function appendUserMessage(text) {
        if (welcomeContainer) {
            welcomeContainer.style.display = "none";
        }

        const time = getFormattedTime();
        const row = document.createElement("div");
        row.className = "message-row user";

        row.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div class="message-content-wrapper">
                <div class="message-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
                <div class="message-meta">
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

        chatMessages.appendChild(row);
        scrollToBottom();
    }
});
