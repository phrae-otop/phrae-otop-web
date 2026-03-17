// Admin Dashboard Logic - Using Firebase Firestore
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth - Only permit role:admin or role:staff
    const currentAdminUser = JSON.parse(sessionStorage.getItem('currentAdminUser'));
    if (!currentAdminUser || (currentAdminUser.role !== 'admin' && currentAdminUser.role !== 'staff')) {
        window.location.href = 'admin-login.html';
        return;
    }

    // Role-based UI rendering
    if (currentAdminUser.role === 'staff') {
        const totalRevenueCard = document.getElementById('total-revenue')?.parentElement;
        if (totalRevenueCard) totalRevenueCard.style.display = 'none';

        const historyMenu = document.querySelector('a[data-target="history"]');
        if (historyMenu) {
            historyMenu.style.display = 'none';
        }

        const settingsMenu = document.querySelector('a[data-target="settings"]');
        if (settingsMenu) {
            settingsMenu.style.display = 'none';
        }
    }

    // Header updates
    const adminNameDisplay = document.getElementById('admin-name-display');
    if (adminNameDisplay) {
        adminNameDisplay.textContent = currentAdminUser.username;
    }

    // Initialize display logic
    let displayedOrders = [];
    let allChatMessages = [];

    // TABS LOGIC
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');
    const sections = document.querySelectorAll('.dashboard-section');

    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.querySelector('a').dataset.target;
            
            // Check permissions for history and settings
            if (currentAdminUser.role === 'staff' && (target === 'history' || target === 'settings')) {
                alert('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
                return;
            }

            // UI
            sidebarMenuItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(target);
            if (targetSection) targetSection.classList.add('active');

            // Lazy Load if needed
            if (target === 'customers') renderAdminUsers();
            if (target === 'products') renderAdminProducts();
            if (target === 'chat') renderAdminChat();
        });
    });

    // SETTINGS / NOTIFICATIONS
    const notifToggle = document.getElementById('notif-toggle');
    const notifStatus = document.getElementById('notif-status');
    const testNotifSound = document.getElementById('test-notif-sound');
    let isNotifEnabled = localStorage.getItem('phrae_otop_admin_notif') !== 'false';

    function updateNotifUI() {
        if (!notifToggle || !notifStatus) return;
        if (isNotifEnabled) {
            notifToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            notifToggle.style.color = '#4CAF50';
            notifStatus.textContent = 'เปิด';
            notifStatus.style.color = '#4CAF50';
        } else {
            notifToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            notifToggle.style.color = '#F44336';
            notifStatus.textContent = 'ปิด';
            notifStatus.style.color = '#F44336';
        }
    }

    if (notifToggle) {
        notifToggle.addEventListener('click', () => {
            isNotifEnabled = !isNotifEnabled;
            localStorage.setItem('phrae_otop_admin_notif', isNotifEnabled);
            updateNotifUI();
        });
        updateNotifUI(); // Initial
    }

    if (testNotifSound) {
        testNotifSound.addEventListener('click', playNotificationSound);
    }

    function playNotificationSound() {
        if (!isNotifEnabled) return;
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio tracking issue - user interaction needed:', e));
    }

    // LOGOUT
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                sessionStorage.removeItem('currentAdminUser');
                window.location.href = 'admin-login.html';
            }
        });
    }

    // Wait for Firestore to initialize
    for (let i = 0; i < 30; i++) {
        if (window.db) break;
        await new Promise(r => setTimeout(r, 100)); // wait up to 3 seconds
    }

    if (!window.db) {
        alert('เชื่อมต่อฐานข้อมูลล้มเหลว กรุณารีเฟรชหน้า');
        return;
    }

    // ============================================
    // REAL-TIME FIRESTORE LISTENERS
    // ============================================

    // 1. Listen to 'users' collection
    window.db.collection('users').onSnapshot((snapshot) => {
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        window.adminUsersCache = users; // Cache globally
        if (document.getElementById('customers')?.classList.contains('active')) {
            renderAdminUsers();
        }
    });

    // 2. Listen to 'orders' collection (for dashboard and history)
    window.db.collection('orders').onSnapshot((snapshot) => {
        displayedOrders = [];
        snapshot.forEach(doc => {
            displayedOrders.push({ id: doc.id, ...doc.data() });
        });
        // Sort newest first
        displayedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        updateDashboardStats(displayedOrders);
        renderOrders('pending', document.getElementById('order-list'));
        renderOrders('history', document.getElementById('history-orders-list'));
        
        // Count pending
        const pendingCount = displayedOrders.filter(o => o.status === 'pending').length;
        if (document.getElementById('pending-orders-count')) {
            document.getElementById('pending-orders-count').textContent = pendingCount;
        }
    });

    // 3. Listen to 'chats' collection (Real-time sync)
    // Subscribe to ALL chats in real-time from Firestore (no orderBy to avoid index requirement)
    if (window.db) {
        console.log('📡 Starting chat listener on Firestore...');
        window.db.collection('chats').onSnapshot((snapshot) => {
            allChatMessages = [];
            snapshot.forEach(doc => allChatMessages.push({ id: doc.id, ...doc.data() }));
            // Sort client-side by timestamp
            allChatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            console.log(`✅ [Chat Sync] ${allChatMessages.length} chat messages loaded from DB. Snapshot empty: ${snapshot.empty}`);
            renderAdminChat();
        }, (error) => {
            console.error('❌ Chat Firestore Error:', error);
        });
    } else {
        console.warn('⏳ Admin chat: Firestore not ready, retrying...');
        let retries = 0;
        const chatInterval = setInterval(() => {
            retries++;
            if (window.db) {
                clearInterval(chatInterval);
                console.log('📡 Firestore ready, starting chat listener...');
                window.db.collection('chats').onSnapshot((snapshot) => {
                    allChatMessages = [];
                    snapshot.forEach(doc => allChatMessages.push({ id: doc.id, ...doc.data() }));
                    allChatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    console.log(`✅ [Chat Sync Retry] ${allChatMessages.length} messages loaded.`);
                    renderAdminChat();
                });
            } else if (retries > 30) {
                clearInterval(chatInterval);
                console.error('❌ Could not connect to Firestore for chat after 30 attempts.');
            }
        }, 1000);
    }


    // ============================================
    // UI RENDERING FUNCTIONS
    // ============================================

    // MEMBER MANAGEMENT
    window.adminUsersCache = []; // Global cache for users

    function renderAdminUsers() {
        const container = document.getElementById('admin-user-list');
        const countEl = document.getElementById('total-members-count');

        const users = window.adminUsersCache;
        if (countEl) countEl.textContent = users.length.toLocaleString();

        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#aaa;">ไม่มีสมาชิกในระบบ</td></tr>';
            return;
        }

        container.innerHTML = users.map((u, index) => {
            const username = u.username || 'Unknown';
            const email = u.email || 'No Email';
            const password = u.password || '******';
            const createdAt = u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH', { 
                year: 'numeric', month: 'long', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            }) : 'N/A';
            const discount = u.discount || 0;
            const initial = username.charAt(0).toUpperCase();

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center;">
                            <div style="width:30px; height:30px; background:var(--primary-color); border-radius:50%; color:#000; display:flex; justify-content:center; align-items:center; margin-right:10px; font-weight:bold;">
                                ${initial}
                            </div>
                            ${username}
                        </div>
                    </td>
                    <td>${email}</td>
                    <td style="font-family:monospace; color:#aaa;">${password}</td>
                    <td>
                        <span style="background:${discount > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(128, 128, 128, 0.2)'}; color:${discount > 0 ? '#4CAF50' : '#888'}; padding:4px 10px; border-radius:12px; font-weight:bold; font-size:0.85rem;">
                            ${discount}%
                        </span>
                    </td>
                    <td>${createdAt}</td>
                    <td>
                        <button class="btn-icon" onclick="viewUserHistory('${u.id}', '${username.replace(/'/g, "\\'")}')" title="ดูประวัติการสั่งซื้อ" style="margin-right:5px; background:rgba(33, 150, 243, 0.2); color:#2196F3;">
                            <i class="fas fa-history"></i>
                        </button>
                        <button class="btn-icon" onclick="editCustomerDiscount(${index})" title="แก้ไขส่วนลด" style="margin-right:5px; background:rgba(76, 175, 80, 0.2); color:#4CAF50;">
                            <i class="fas fa-percent"></i>
                        </button>
                        <button class="btn-icon edit" onclick="editCustomerPassword(${index})" title="แก้ไขรหัสผ่าน">
                            <i class="fas fa-key"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.editCustomerDiscount = async (index) => {
        const users = window.adminUsersCache || [];
        const user = users[index];

        if (!user || !user.id || !window.db) {
            alert('ไม่พบข้อมูลผู้ใช้ในระบบ หรือเชื่อมต่อฐานข้อมูลไม่ได้');
            return;
        }

        const currentDiscount = user.discount || 0;
        const newDiscount = prompt(`กำหนดส่วนลดสำหรับ: ${user.username}\n\nส่วนลดปัจจุบัน: ${currentDiscount}%\n\nกรอกส่วนลดใหม่ (0-100):`, currentDiscount);

        if (newDiscount === null) return;

        const discountValue = parseFloat(newDiscount);
        if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
            alert('กรุณากรอกส่วนลดที่ถูกต้อง (0-100%)');
            return;
        }

        try {
            await window.db.collection('users').doc(user.id).update({ discount: discountValue });
            // Notification is handled globally by listener
        } catch (error) {
            console.error('Error updating discount:', error);
            alert('❌ เกิดข้อผิดพลาดในการอัปเดตส่วนลด');
        }
    };

    window.viewUserHistory = (userId, username) => {
        const modal = document.getElementById('history-modal');
        const list = document.getElementById('user-history-list');
        const title = document.getElementById('history-modal-title');

        if (!modal || !list) return;

        title.textContent = `ประวัติการสั่งซื้อ: ${username}`;
        list.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
        modal.style.display = 'flex';

        let userOrders = displayedOrders.filter(o => o.userId == userId);

        if (userOrders.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#aaa;">ไม่พบประวัติการสั่งซื้อ</td></tr>';
            return;
        }

        list.innerHTML = userOrders.map(o => `
            <tr>
                <td>#${o.id.substring(0, 6)}...</td>
                <td>${o.displayDate || o.date}</td>
                <td>
                    ${o.items.map(i => `<div style="font-size:0.85rem;">- ${i.title} (x${i.quantity})</div>`).join('')}
                </td>
                <td>฿${o.total.toLocaleString()}</td>
                <td>
                    <span class="status-badge status-${o.status || 'pending'}">
                        ${o.status || 'Pending'}
                    </span>
                </td>
            </tr>
        `).join('');
    };

    window.editCustomerPassword = async (index) => {
        const users = window.adminUsersCache || [];
        const user = users[index];

        if (!user || !user.id || !window.db) {
            alert('ไม่พบข้อมูลผู้ใช้');
            return;
        }

        const newPassword = prompt(`แก้ไขรหัสผ่านสำหรับ: ${user.username}\n\nกรอกรหัสผ่านใหม่:`, user.password);
        if (newPassword === null) return;
        if (!newPassword.trim()) { alert('ค่าว่างไม่ได้'); return; }

        try {
            await window.db.collection('users').doc(user.id).update({ password: newPassword.trim() });
        } catch (error) {
            alert('เกิดข้อผิดพลาด');
        }
    };

    // ORDER PROCESSING (Wait vs Update)
    function updateDashboardStats(orders) {
        const today = new Date().toISOString().split('T')[0];
        
        const totalSales = orders.filter(o => o.status !== 'cancelled')
                                 .reduce((sum, o) => sum + o.total, 0);
        document.getElementById('total-revenue').textContent = `฿${totalSales.toLocaleString()}`;

        const todaySales = orders.filter(o => o.status !== 'cancelled' && o.date.startsWith(today))
                                 .reduce((sum, o) => sum + o.total, 0);
        document.getElementById('today-sales').textContent = `฿${todaySales.toLocaleString()}`;

        const newOrders = orders.filter(o => o.status === 'pending').length;
        document.getElementById('new-orders').textContent = newOrders;

        const lowStockCount = (window.cachedProducts || []).filter(p => !p.inStock || p.inStock === false).length;
        document.getElementById('low-stock').textContent = lowStockCount; // We will need to plug this in via products
    }

    function renderOrders(filterStatus, container) {
        if (!container) return;
        let filtered = displayedOrders;
        if (filterStatus === 'pending') {
            filtered = displayedOrders.filter(o => o.status === 'pending' || o.status === 'processing');
        }
        
        if (filtered.length === 0) {
            container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#aaa;">ไม่มีรายการสั่งซื้อ${filterStatus === 'pending' ? 'ใหม่' : ''}</td></tr>`;
            return;
        }

        container.innerHTML = filtered.map(o => {
            const date = o.displayDate || new Date(o.date).toLocaleDateString('th-TH');
            const items = o.items.map(i => `<div style="font-size:0.85rem; color:#ccc;">- ${i.title} (x${i.quantity})</div>`).join('');
            
            let actions = '';
            if (currentAdminUser.role === 'admin' || currentAdminUser.role === 'staff') {
                 if (o.status === 'pending') {
                     actions = `<button class="btn-action check" onclick="updateOrderStatus('${o.id}', 'processing')" title="รับออเดอร์"><i class="fas fa-check"></i> รับออเดอร์</button>`;
                 } else if (o.status === 'processing') {
                     actions = `<button class="btn-action dispatch" onclick="updateOrderStatus('${o.id}', 'shipped')" title="จัดส่งแล้ว"><i class="fas fa-truck"></i> จัดส่ง</button>`;
                 }
                 if (filterStatus === 'history') {
                    // Provide option to cancel maybe
                 }
            }

            return `
            <tr>
                <td style="font-family:monospace; color:#aaa;">#${o.id.substring(0,6)}</td>
                <td>${o.customerDetails?.name || 'ลูกค้าทั่วไป'}<div style="font-size:0.8rem;color:#888">${o.customerDetails?.phone || ''}</div></td>
                <td>${items}</td>
                <td>฿${o.total.toLocaleString()}</td>
                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                <td>
                    ${actions}
                    <button class="btn-icon edit" onclick="viewOrderDetails('${o.id}')" title="ดูรายละเอียด"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
            `;
        }).join('');
    }

    window.updateOrderStatus = async (orderId, newStatus) => {
        try {
            await window.db.collection('orders').doc(orderId).update({ status: newStatus });
            // Notification plays automatically via snapshot event if we configure it
        } catch (error) {
            console.error(error);
            alert('อัปเดตสถานะไม่สำเร็จ');
        }
    };

    window.viewOrderDetails = (orderId) => {
        const order = displayedOrders.find(o => o.id === orderId);
        if(!order) return;
        alert(`รายการที่สั่ง: \n${order.items.map(i=>i.title + " x" + i.quantity).join('\n')}\n\nที่อยู่จัดส่ง:\n${order.customerDetails?.address || 'ไม่มี'}`);
    };


    // CHAT MANAGEMENT
    const adminChatInput = document.getElementById('adminChatInput');
    const adminSendBtn = document.getElementById('adminSendBtn');
    const adminChatMessages = document.getElementById('adminChatMessages');
    const adminImageBtn = document.getElementById('adminImageBtn');
    const adminImageInput = document.getElementById('adminImageInput');
    let activeChatUserId = null;
    let lastUnreadMsgCount = 0;

    function renderAdminChat() {
        if (!adminChatMessages) return;
        const messages = allChatMessages;
        const chatUserList = document.getElementById('chatUserList');
        const chatHeader = document.getElementById('chatHeaderUser');
        const activeUserName = document.getElementById('activeUserName');
        const inputArea = document.getElementById('adminChatInputArea');

        const usersMap = {};
        messages.forEach(msg => {
            let uid = msg.userId;
            let uname = msg.username;
            if (msg.sender === 'admin') uid = msg.recipientId;
            if (!uid) { uid = 'legacy'; uname = 'Guest'; }
            
            if (!usersMap[uid]) {
                usersMap[uid] = { id: uid, name: uname || 'Guest', lastMsg: '', lastTime: '', unread: 0 };
            }
            if (uname && uname !== 'Unknown' && msg.sender !== 'admin') usersMap[uid].name = uname;
            usersMap[uid].lastMsg = msg.image ? '[รูปภาพ]' : msg.text;
            usersMap[uid].lastTime = msg.timestamp;
            if (msg.sender === 'user' && !msg.isRead) usersMap[uid].unread++;
        });

        // Notifications logic
        const totalUnread = Object.values(usersMap).reduce((s, u) => s + u.unread, 0);
        if (totalUnread > lastUnreadMsgCount) {
            playNotificationSound();
        }
        lastUnreadMsgCount = totalUnread;

        if (chatUserList) {
            chatUserList.innerHTML = '';
            const sortedUsers = Object.values(usersMap).sort((a,b) => new Date(b.lastTime) - new Date(a.lastTime));
            if(sortedUsers.length===0){
                chatUserList.innerHTML = '<div style="padding:20px; color:#666; text-align:center;">ยังไม่มีข้อความ</div>';
            }
            sortedUsers.forEach(u => {
                const item = document.createElement('div');
                item.className = 'chat-user-item';
                item.style.padding = '15px';
                item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                item.style.cursor='pointer';
                if(activeChatUserId===u.id) item.style.background='rgba(255,215,0,0.1)';
                
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <div style="font-weight:bold; color:#fff;">${u.name}</div>
                        ${u.unread > 0 ? `<div style="background:red; color:white; font-size:10px; padding:2px 6px; border-radius:10px;">${u.unread}</div>` : ''}
                    </div>
                    <div style="font-size:0.8rem; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${u.lastMsg||''}</div>
                `;
                item.addEventListener('click', () => { activeChatUserId=u.id; renderAdminChat();});
                chatUserList.appendChild(item);
            });
        }

        // Active chat
        if (activeChatUserId) {
            if (inputArea) inputArea.style.display = 'flex';
            if (chatHeader) chatHeader.style.display = 'block';
            if (activeUserName) activeUserName.textContent = usersMap[activeChatUserId]?.name || 'Chat';

            // Mark read
            messages.filter(m => m.sender === 'user' && m.userId === activeChatUserId && !m.isRead).forEach(async m => {
                await window.db.collection('chats').doc(m.id).update({ isRead: true });
            });

            const conversation = messages.filter(m => 
                (m.sender === 'user' && m.userId === activeChatUserId) ||
                (m.sender === 'admin' && m.recipientId === activeChatUserId)
            );

            adminChatMessages.innerHTML = '';
            conversation.forEach(msg => {
                const div = document.createElement('div');
                div.className = `message ${msg.sender === 'admin' ? 'admin' : 'user'}`;
                if(msg.image){
                    div.innerHTML = `<img src="${msg.image}" style="max-width:100%; border-radius:8px;"/>`;
                } else {
                    div.textContent = msg.text;
                }
                adminChatMessages.appendChild(div);
            });
            adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
        }
    }

    async function sendAdminMessage(image=null){
        if(!activeChatUserId) return;
        const text = adminChatInput?.value.trim();
        if(!text && !image) return;

        try {
            await window.db.collection('chats').add({
                text: text||null,
                image: image||null,
                sender: 'admin',
                userId: activeChatUserId,
                recipientId: activeChatUserId,
                username: 'Admin',
                timestamp: new Date().toISOString(),
                isRead: false
            });
            if(adminChatInput) adminChatInput.value = '';
        } catch(e) {
            console.error(e);
        }
    }

    if(adminSendBtn) adminSendBtn.addEventListener('click', () => sendAdminMessage(null));
    if(adminChatInput) adminChatInput.addEventListener('keypress', (e) => { if(e.key==='Enter') sendAdminMessage(null); });
    
    // PRODUCT MANAGEMENT simplified
    window.cachedProducts = [];
    if(window.db){
        window.db.collection('products').onSnapshot(snapshot => {
            window.cachedProducts = [];
            snapshot.forEach(doc => window.cachedProducts.push({id: doc.id, ...doc.data()}));
            window.cachedProducts.sort((a,b)=>a.index - b.index);
            if(document.getElementById('products')?.classList.contains('active')) renderAdminProducts();
        });
    }

    function renderAdminProducts() {
        const body = document.getElementById('admin-product-list');
        if(!body) return;
        body.innerHTML = window.cachedProducts.map(p => `
            <tr>
                <td><img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                <td style="font-weight:bold;">${p.title}</td>
                <td>${p.category || 'N/A'}</td>
                <td>฿${p.price.toLocaleString()}</td>
                <td><span class="status-badge status-${p.inStock ? 'completed' : 'cancelled'}">${p.inStock ? 'มีสินค้า' : 'หมด'}</span></td>
                <td>-</td>
            </tr>
        `).join('');
    }

});
