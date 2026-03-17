// Chat Widget Logic - Firebase Firestore Version (v1.1.3)
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
    const imageBtn = document.getElementById('imageBtn');
    const chatImageInput = document.getElementById('chatImageInput');

    let isOpen = false;
    let unsubscribeListener = null;

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

    // Toggle Chat
    chatBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        chatBox.classList.toggle('active');
        if (isOpen) {
            chatBadge.style.display = 'none';
            scrollToBottom();
        }
    });

    closeChat.addEventListener('click', () => {
        isOpen = false;
        chatBox.classList.remove('active');
    });

    // Image Upload Logic
    if (imageBtn && chatImageInput) {
        imageBtn.addEventListener('click', () => chatImageInput.click());
        chatImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 500000) {
                alert('รูปภาพมีขนาดใหญ่เกินไป (จำกัด 500KB)');
                chatImageInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = async function (event) {
                const base64String = event.target.result;
                await saveMessageToFirestore(null, 'user', base64String);
                chatImageInput.value = '';
            };
            reader.readAsDataURL(file);
        });
    }

    // Save message to Firestore
    async function saveMessageToFirestore(text, sender, image = null) {
        const db = await getDB();
        if (!db) {
            console.error('❌ Firestore not available for chat');
            return;
        }
        const identity = getIdentity();
        const newMessage = {
            text: text,
            image: image,
            sender: sender,
            userId: identity.id, // ID ของลูกค้า
            username: identity.name,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        try {
            console.log('⏳ Saving to Firestore...', newMessage);
            const docRef = await db.collection('chats').add(newMessage);
            console.log('✅ Chat message saved to Firestore with ID:', docRef.id);
        } catch (e) {
            console.error('❌ Failed to save chat message:', e);
            alert('ไม่สามารถส่งข้อความได้: ' + e.message);
        }
    }

    // Get DB with retry
    async function getDB() {
        if (window.db) return window.db;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 100));
            if (window.db) return window.db;
        }
        return null;
    }

    // Send Message
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';
        await saveMessageToFirestore(text, 'user', null);

        // Auto-reply logic
        const identity = getIdentity();
        const db = await getDB();
        if (!db) return;

        const snapshot = await db.collection('chats')
            .where('userId', '==', identity.id)
            .where('sender', '==', 'user')
            .get();

        const userMessages = snapshot.docs.map(d => d.data());
        let shouldAutoReply = false;
        let autoReplyReason = '';

        if (userMessages.length <= 1) {
            shouldAutoReply = true;
            autoReplyReason = 'first_time';
        } else {
            const today = new Date().toDateString();
            const todayMessages = userMessages.filter(m => new Date(m.timestamp).toDateString() === today);
            if (todayMessages.length <= 1) {
                shouldAutoReply = true;
                autoReplyReason = 'first_of_day';
            }
        }

        if (shouldAutoReply) {
            setTimeout(async () => {
                let autoReplyText = '';
                if (autoReplyReason === 'first_time') {
                    autoReplyText = `ยินดีต้อนรับครับ! 🙏\n\nขอบคุณที่ติดต่อเข้ามา ทางทีมงานได้รับข้อความของคุณแล้ว และจะตอบกลับโดยเร็วที่สุดครับ\n\nเวลาทำการ: จันทร์-ศุกร์ 9:00-18:00 น.`;
                } else {
                    autoReplyText = `สวัสดีครับ! 👋\n\nยินดีต้อนรับกลับมาอีกครั้ง ทางทีมงานได้รับข้อความของคุณแล้วครับ`;
                }
                const autoReply = {
                    text: autoReplyText,
                    image: null,
                    sender: 'admin',
                    userId: identity.id,
                    username: 'Auto-Reply',
                    recipientId: identity.id,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    isAutoReply: true
                };
                await db.collection('chats').add(autoReply);
            }, 800);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Render messages from Firestore in real-time
    async function subscribeToChat() {
        const db = await getDB();
        if (!db) {
            console.warn('⏳ Firestore not ready for chat, retrying...');
            setTimeout(subscribeToChat, 2000);
            return;
        }

        const identity = getIdentity();
        console.log('📡 Subscribing to chat for user:', identity.id);

        if (unsubscribeListener) unsubscribeListener();

        unsubscribeListener = db.collection('chats')
            .where('userId', '==', identity.id)
            .onSnapshot((snapshot) => {
                const messages = [];
                snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
                // Also get admin replies to this user
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                console.log(`📥 Received ${messages.length} messages from Firestore for user ${identity.id}`);
                renderMessages(messages);
            }, (error) => {
                console.error('❌ Chat listener error:', error);
            });
    }

    function renderMessages(messages) {
        const adminMessages = messages.filter(m => 
            m.sender === 'admin' && !m.isRead
        ).length;

        if (!isOpen && adminMessages > 0) {
            chatBadge.style.display = 'flex';
            chatBadge.textContent = adminMessages;
        }

        const identity = getIdentity();
        // Include both messages from this user AND admin replies to this user
        const myMessages = messages.filter(m =>
            m.userId === identity.id || m.recipientId === identity.id
        );

        // Reset and re-render
        messagesContainer.innerHTML = '<div class="message admin">สวัสดีครับ มีอะไรให้ช่วยสอบถามได้เลยนะครับ 👋</div>';
        myMessages.forEach(msg => {
            const div = document.createElement('div');
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

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Start listening
    subscribeToChat();
});
