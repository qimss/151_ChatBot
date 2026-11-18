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

    // Configure Marked if available
    if (window.marked) {
        window.marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: false,
            mangle: false
        });
    }

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

    // Handle Suggestion Chips (jika ada di HTML)
    if (suggestionChips.length > 0) {
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
    }

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

    // Markdown renderer with fallback
    function renderMarkdown(rawText) {
        if (window.marked && typeof window.marked.parse === "function") {
            try {
                return window.marked.parse(rawText);
            } catch (err) {
                console.warn("Marked parse error, using fallback:", err);
            }
        }

        let html = escapeHtml(rawText);
        html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${code}</code></pre>`;
        });
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    // Enhance rendered HTML (add copy buttons to code blocks)
    function enhanceRenderedContent(bubbleEl) {
        const preBlocks = bubbleEl.querySelectorAll("pre");
        preBlocks.forEach((pre) => {
            if (pre.parentElement && pre.parentElement.classList.contains("code-block-wrapper")) {
                return;
            }

            const codeEl = pre.querySelector("code");
            const rawCode = codeEl ? codeEl.innerText : pre.innerText;

            let lang = "CODE";
            if (codeEl) {
                const langClass = Array.from(codeEl.classList).find(c => c.startsWith("language-"));
                if (langClass) {
                    lang = langClass.replace("language-", "").toUpperCase();
                }
            }

            const wrapper = document.createElement("div");
            wrapper.className = "code-block-wrapper";

            const header = document.createElement("div");
            header.className = "code-header";

            const langLabel = document.createElement("span");
            langLabel.textContent = lang || "CODE";

            const copyBtn = document.createElement("button");
            copyBtn.type = "button";
            copyBtn.className = "btn-copy-code";
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Salin</span>
            `;

            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(rawCode);
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#10b981" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span style="color: #10b981;">Tersalin!</span>
                    `;
                    setTimeout(() => {
                        copyBtn.innerHTML = `
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span>Salin</span>
                        `;
                    }, 2000);
                } catch (e) {
                    console.error("Gagal menyalin:", e);
                }
            });

            header.appendChild(langLabel);
            header.appendChild(copyBtn);

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });
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

    // Create Bot Message placeholder with typing indicator
    function createBotMessagePlaceholder() {
        const time = getFormattedTime();
        const row = document.createElement("div");
        row.className = "message-row bot";

        row.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                    <circle cx="12" cy="5" r="2"></circle>
                    <path d="M12 7v4"></path>
                    <line x1="8" y1="16" x2="8" y2="16"></line>
                    <line x1="16" y1="16" x2="16" y2="16"></line>
                </svg>
            </div>
            <div class="message-content-wrapper">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                </div>
                <div class="message-meta">
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

        chatMessages.appendChild(row);
        scrollToBottom();

        const bubble = row.querySelector(".message-bubble");
        const meta = row.querySelector(".message-meta");

        return { row, bubble, meta };
    }

    // Attach copy button to bot message
    function attachMessageCopyAction(metaEl, rawText) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn-copy-msg";
        copyBtn.title = "Salin teks jawaban";
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Salin</span>
        `;

        copyBtn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(rawText);
                copyBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style="color: #10b981;">Tersalin!</span>
                `;
                setTimeout(() => {
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Salin</span>
                    `;
                }, 2000);
            } catch (err) {
                console.error("Gagal menyalin pesan:", err);
            }
        });

        metaEl.appendChild(copyBtn);
    }

    // Main Form Submit Handler
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userText = messageInput.value.trim();
        if (!userText || isGenerating) return;

        // Reset input field
        messageInput.value = "";
        autoResizeTextarea();

        // 1. Append user message to UI
        appendUserMessage(userText);

        // 2. Save into conversation history
        conversationHistory.push({
            role: "user",
            content: userText
        });

        // 3. Create Bot message placeholder
        const { row, bubble, meta } = createBotMessagePlaceholder();

        // Set generating state
        setGeneratingState(true);
        abortController = new AbortController();

        let botReply = "";
        let isFirstChunk = true;

        try {
            // Request to app.js backend endpoint: /api/chat
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: conversationHistory
                }),
                signal: abortController.signal
            });

            if (!response.ok) {
                let errDetail = "Terjadi kesalahan pada server.";
                try {
                    const errJson = await response.json();
                    if (errJson && errJson.error) {
                        errDetail = errJson.error;
                    }
                } catch (_) {}
                throw new Error(errDetail);
            }

            // Read SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    if (!trimmed.startsWith("data:")) continue;

                    const data = trimmed.slice(5).trim();

                    if (data === "[DONE]" || data === "DONE") {
                        continue;
                    }

                    try {
                        const parsedContent = JSON.parse(data);
                        if (parsedContent) {
                            if (isFirstChunk) {
                                bubble.innerHTML = "";
                                isFirstChunk = false;
                            }
                            botReply += parsedContent;
                            bubble.innerHTML = renderMarkdown(botReply);
                            enhanceRenderedContent(bubble);
                            scrollToBottom();
                        }
                    } catch (parseErr) {
                        console.warn("Gagal parsing SSE chunk:", parseErr, data);
                    }
                }
            }

            // Stream completed
            if (!botReply) {
                botReply = "(Tidak ada respon yang diterima dari server)";
                bubble.innerHTML = `<p>${botReply}</p>`;
            }

            // Save bot reply to history
            conversationHistory.push({
                role: "assistant",
                content: botReply
            });

            // Add copy button to message
            attachMessageCopyAction(meta, botReply);

        } catch (error) {
            console.error("Error communicating with chat API:", error);

            if (error.name === "AbortError") {
                if (botReply) {
                    botReply += "\n\n*(Respon dihentikan oleh pengguna)*";
                    bubble.innerHTML = renderMarkdown(botReply);
                    enhanceRenderedContent(bubble);
                    conversationHistory.push({
                        role: "assistant",
                        content: botReply
                    });
                    attachMessageCopyAction(meta, botReply);
                } else {
                    bubble.innerHTML = `<p><em>Respon dihentikan.</em></p>`;
                }
            } else {
                row.classList.add("error");
                bubble.innerHTML = `
                    <p><strong>⚠️ Gagal Memuat Respon:</strong></p>
                    <p>${escapeHtml(error.message || "Koneksi ke backend terputus.")}</p>
                `;
            }
        } finally {
            abortController = null;
            setGeneratingState(false);
            scrollToBottom();
        }
    });
});
