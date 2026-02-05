// Chat Widget Logic
document.addEventListener('DOMContentLoaded', () => {
    // Inject HTML if not exists
    if (!document.getElementById('chat-widget-container')) {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-widget-container';
        chatContainer.innerHTML = `
            <div class="chat-widget-btn" id="chatBtn">
                <i class="fas fa-comments"></i>
                <div class="chat-badge" id="chatBadge">0</div>
            </div>
            
            <div class="chat-box" id="chatBox">
                <div class="chat-header">
                    <h3><i class="fas fa-headset"></i> ติดต่อแอดมิน</h3>
                    <i class="fas fa-times close-chat" id="closeChat"></i>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message admin">สวัสดีครับ มีอะไรให้ช่วยสอบถามได้เลยนะครับ 👋</div>
                </div>
                <div class="chat-input-area">
                    <input type="file" id="chatImageInput" hidden accept="image/*">
                    <button class="image-btn" id="imageBtn"><i class="fas fa-image"></i></button>
                    <input type="text" id="chatInput" placeholder="พิมพ์ข้อความ...">
                    <button class="send-btn" id="sendBtn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);
    }

    const chatBtn = document.getElementById('chatBtn');
    const chatBox = document.getElementById('chatBox');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesContainer = document.getElementById('chatMessages');
    const chatBadge = document.getElementById('chatBadge');

    // Image Upload Elements
    const imageBtn = document.getElementById('imageBtn');
    const chatImageInput = document.getElementById('chatImageInput');

    let isOpen = false;
    let lastMessageCount = 0;

    // Toggle Chat
    chatBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        chatBox.classList.toggle('active');
        if (isOpen) {
            chatBadge.style.display = 'none';
            scrollToBottom();
            markAllAsRead();
        }
    });

    closeChat.addEventListener('click', () => {
        isOpen = false;
        chatBox.classList.remove('active');
    });

    // Image Upload Logic
    if (imageBtn && chatImageInput) {
        imageBtn.addEventListener('click', () => chatImageInput.click());

        chatImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Limit size to avoid localStorage quotas (e.g. 500KB limit for demo)
            if (file.size > 500000) {
                alert('รูปภาพมีขนาดใหญ่เกินไป (จำกัด 500KB)');
                chatImageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const base64String = event.target.result;
                addMessageToStorage(null, 'user', base64String);
                renderMessages();
                chatImageInput.value = '';
            };
            reader.readAsDataURL(file);
        });
    }

    // Send Message
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const identity = getIdentity();
        const messages = getMessages();

        // Filter user's messages
        const userMessages = messages.filter(m => m.userId === identity.id && m.sender === 'user');

        // Check conditions for auto-reply
        let shouldAutoReply = false;
        let autoReplyReason = '';

        // Condition 1: First message ever from this user
        if (userMessages.length === 0) {
            shouldAutoReply = true;
            autoReplyReason = 'first_time';
        } else {
            // Condition 2: First message of the day
            const today = new Date().toDateString();
            const todayMessages = userMessages.filter(m => {
                const msgDate = new Date(m.timestamp).toDateString();
                return msgDate === today;
            });

            if (todayMessages.length === 0) {
                shouldAutoReply = true;
                autoReplyReason = 'first_of_day';
            } else {
                // Condition 3: No admin reply in last 5 minutes
                const now = new Date();
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

                // Get last user message timestamp
                const lastUserMsg = userMessages[userMessages.length - 1];
                const lastUserTime = new Date(lastUserMsg.timestamp);

                // Get admin messages to this user
                const adminReplies = messages.filter(m =>
                    m.sender === 'admin' &&
                    m.recipientId === identity.id &&
                    !m.isAutoReply
                );

                // Check if there's been an admin reply since last user message
                const hasRecentAdminReply = adminReplies.some(m => {
                    const adminTime = new Date(m.timestamp);
                    return adminTime > lastUserTime;
                });

                // If last user message was more than 5 minutes ago and no admin reply
                if (lastUserTime < fiveMinutesAgo && !hasRecentAdminReply) {
                    shouldAutoReply = true;
                    autoReplyReason = 'timeout';
                }
            }
        }

        addMessageToStorage(text, 'user', null);
        chatInput.value = '';

        // Auto-reply based on conditions
        if (shouldAutoReply) {
            setTimeout(() => {
                let autoReplyText = '';

                if (autoReplyReason === 'first_time') {
                    autoReplyText = `ยินดีต้อนรับครับ! 🙏\n\nขอบคุณที่ติดต่อเข้ามา ทางทีมงานได้รับข้อความของคุณแล้ว และจะตอบกลับโดยเร็วที่สุดครับ\n\nเวลาทำการ: จันทร์-ศุกร์ 9:00-18:00 น.\n\nหากต้องการสอบถามเพิ่มเติม สามารถติดต่อ:\n📞 โทร: 088-273-7474\n📧 Email: contact@phrae-otop.com`;
                } else if (autoReplyReason === 'first_of_day') {
                    autoReplyText = `สวัสดีครับ! 👋\n\nยินดีต้อนรับกลับมาอีกครั้ง ทางทีมงานได้รับข้อความของคุณแล้วครับ\n\nเวลาทำการ: จันทร์-ศุกร์ 9:00-18:00 น.`;
                } else if (autoReplyReason === 'timeout') {
                    autoReplyText = `ขออภัยที่รอนานครับ 🙏\n\nทางทีมงานอาจกำลังยุ่งอยู่ แต่เราได้รับข้อความของคุณแล้ว และจะตอบกลับโดยเร็วที่สุดครับ\n\nหากเร่งด่วน กรุณาติดต่อ:\n📞 โทร: 088-273-7474`;
                }

                // Add auto-reply as admin message
                const autoReply = {
                    id: Date.now(),
                    text: autoReplyText,
                    image: null,
                    sender: 'admin',
                    userId: 'system',
                    username: 'Auto-Reply',
                    recipientId: identity.id,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    isAutoReply: true,
                    autoReplyReason: autoReplyReason
                };

                const currentMessages = getMessages();
                currentMessages.push(autoReply);
                localStorage.setItem('phrae_otop_chat', JSON.stringify(currentMessages));
                renderMessages();
            }, 800); // Delay to simulate typing
        }

        renderMessages();
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Storage Logic
    function getMessages() {
        return JSON.parse(localStorage.getItem('phrae_otop_chat')) || [];
    }

    // Helper: Get Current User Identity
    function getIdentity() {
        const currentUser = JSON.parse(localStorage.getItem('phrae_otop_currentUser'));
        if (currentUser) {
            return { id: currentUser.id, name: currentUser.username || currentUser.email };
        }

        let guestId = localStorage.getItem('phrae_otop_guestId');
        if (!guestId) {
            guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('phrae_otop_guestId', guestId);
        }
        return { id: guestId, name: 'Guest' };
    }

    function addMessageToStorage(text, sender, image = null) {
        const messages = getMessages();
        const identity = getIdentity();

        const newMessage = {
            id: Date.now(),
            text: text,
            image: image,
            sender: sender,
            userId: identity.id,      // Tag message with User ID
            username: identity.name,  // Tag message with Username
            timestamp: new Date().toISOString(),
            isRead: false // Always unread upon sending, waiting for recipient
        };
        messages.push(newMessage);
        localStorage.setItem('phrae_otop_chat', JSON.stringify(messages));
    }

    function renderMessages() {
        const messages = getMessages();
        const identity = getIdentity();

        // Filter: Show only generic system msgs OR messages belonging to this user (sent by them or sent to them)
        // Admin messages sent to this user will have 'recipientId' matching identity.id (we will implement this in admin.js)
        // For backward compatibility, we show old messages if they don't have userId (legacy) or match current user.
        const myMessages = messages.filter(m => {
            // If message has no userId/recipientId (legacy), show it? Maybe better to hide to clean up.
            // Let's filter strictly for new system:
            return m.userId === identity.id || m.recipientId === identity.id;
        });

        const currentCount = myMessages.filter(m => m.sender === 'admin' && !m.isRead).length;

        // Update badge if chat closed
        if (!isOpen && currentCount > 0) {
            chatBadge.style.display = 'flex';
            chatBadge.textContent = currentCount;
        }

        // Only re-render check
        const displayedMsgCount = messagesContainer.children.length - 1; // minus greeting
        if (myMessages.length === displayedMsgCount) return;

        // Clear except greeting
        messagesContainer.innerHTML = '<div class="message admin">สวัสดีครับ มีอะไรให้ช่วยสอบถามได้เลยนะครับ 👋</div>';

        myMessages.forEach(msg => {
            const div = document.createElement('div');
            // Admin messages to user are "admin", User messages are "user"
            div.className = `message ${msg.sender === 'admin' ? 'admin' : 'user'}`;

            if (msg.image) {
                const img = document.createElement('img');
                img.src = msg.image;
                img.className = 'chat-image';
                div.appendChild(img);
            } else {
                div.textContent = msg.text;
            }

            messagesContainer.appendChild(div);
        });

        scrollToBottom();
    }

    // Update markAllAsRead to only mark messages for THIS user
    function markAllAsRead() {
        const messages = getMessages();
        const identity = getIdentity();
        const updated = messages.map(m => {
            if (m.sender === 'admin' && m.recipientId === identity.id) {
                m.isRead = true;
            }
            return m;
        });
        localStorage.setItem('phrae_otop_chat', JSON.stringify(updated));
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function markAllAsRead() {
        const messages = getMessages();
        const updated = messages.map(m => {
            if (m.sender === 'admin') m.isRead = true;
            return m;
        });
        localStorage.setItem('phrae_otop_chat', JSON.stringify(updated));
    }

    // Polling for real-time updates
    renderMessages();
    setInterval(renderMessages, 1000);
});
