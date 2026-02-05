// admin.js - Refactored for Compat SDK

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentAdminUser'));

    // Auth Guard
    if (sessionStorage.getItem('isAdmin') !== 'true' || !currentUser) {
        window.location.href = 'admin-login.html';
        return;
    }

    // RBAC: Role-Based Access Control
    // If STAFF, hide specific elements
    if (currentUser.role === 'staff') {
        // Hide Financial Stats
        const revenueCard = document.getElementById('total-revenue')?.closest('.stat-card');
        if (revenueCard) revenueCard.style.display = 'none';

        // Hide Settings Tab
        const settingsTabBtn = document.querySelector('.sidebar-nav a[data-tab="settings"]');
        if (settingsTabBtn) settingsTabBtn.style.display = 'none';

        // Hide Delete Buttons (Optional, let's keep it simple for now or css hide)
        document.body.classList.add('role-staff');
    }

    // Render Admin Name
    const adminNameDisplay = document.querySelector('.sidebar-header span');
    if (adminNameDisplay) adminNameDisplay.textContent = `${currentUser.name} (${currentUser.role.toUpperCase()})`;


    // Logout Function
    window.adminLogout = () => {
        if (confirm('ต้องการออกจากระบบใช่หรือไม่? / Are you sure you want to logout?')) {
            sessionStorage.removeItem('isAdmin');
            window.location.href = 'admin-login.html';
        }
    };

    // TAB SWITCHING
    const tabs = document.querySelectorAll('.sidebar-nav a[data-tab]');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(`${target}-tab`).classList.add('active');

            if (target === 'products') renderAdminProducts();
            if (target === 'orders') renderAdminOrders();
            if (target === 'shipping') renderShippingOrders();
            if (target === 'history') renderHistoryOrders();
            if (target === 'users') renderAdminUsers();
        });
    });

    // NOTIFICATION SOUND SYSTEM
    let isSoundOn = localStorage.getItem('adminSoundEnabled') !== 'false'; // Default true
    let lastUnreadMsgCount = 0;
    const soundToggle = document.getElementById('toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    const soundStatus = document.getElementById('sound-status');
    const audioEl = document.getElementById('notification-sound');

    // Update UI based on state
    const updateSoundUI = () => {
        if (!soundToggle) return;
        if (isSoundOn) {
            soundIcon.className = 'fas fa-volume-up';
            soundStatus.textContent = 'เปิด';
            soundStatus.style.color = '#4CAF50';
        } else {
            soundIcon.className = 'fas fa-volume-mute';
            soundStatus.textContent = 'ปิด';
            soundStatus.style.color = '#f44336';
        }
    };

    // Initialize UI
    updateSoundUI();

    // Toggle Handler
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            isSoundOn = !isSoundOn;
            localStorage.setItem('adminSoundEnabled', isSoundOn);
            updateSoundUI();

            // Test sound if turning on
            if (isSoundOn && audioEl) {
                audioEl.volume = 0.5;
                audioEl.play().catch(e => console.warn('Audio play blocked:', e));
            }
        });
    }

    // MEMBER MANAGEMENT
    const userListContainer = document.getElementById('admin-user-list');
    const totalMembersEl = document.getElementById('total-members-count');

    const renderAdminUsers = () => {
        const users = JSON.parse(localStorage.getItem('phrae_otop_users')) || [];

        // Update Count
        if (totalMembersEl) totalMembersEl.textContent = users.length.toLocaleString();

        if (users.length === 0) {
            userListContainer.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#aaa;">ไม่มีสมาชิกในระบบ / No registered members</td></tr>';
            return;
        }

        userListContainer.innerHTML = users.map((u, index) => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center;">
                        <div style="width:30px; height:30px; background:var(--primary-color); border-radius:50%; color:#000; display:flex; justify-content:center; align-items:center; margin-right:10px; font-weight:bold;">
                            ${u.username.charAt(0).toUpperCase()}
                        </div>
                        ${u.username}
                    </div>
                </td>
                <td>${u.email}</td>
                <td style="font-family:monospace; color:#aaa;">${u.password}</td>
                <td>${new Date(u.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                    <button class="btn-icon edit" onclick="editCustomerPassword(${index})" title="แก้ไขรหัสผ่าน">
                        <i class="fas fa-key"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };

    window.editCustomerPassword = (index) => {
        const users = JSON.parse(localStorage.getItem('phrae_otop_users')) || [];
        const user = users[index];

        if (!user) return;

        const newPassword = prompt(`แก้ไขรหัสผ่านสำหรับ: ${user.username}\n\nกรอกรหัสผ่านใหม่:`, user.password);

        if (newPassword === null) return; // Cancelled

        if (!newPassword.trim()) {
            alert('รหัสผ่านต้องไม่เป็นค่าว่าง');
            return;
        }

        users[index].password = newPassword.trim();
        localStorage.setItem('phrae_otop_users', JSON.stringify(users));

        alert('แก้ไขรหัสผ่านเรียบร้อยแล้ว!');
        renderAdminUsers();
    };

    // PRODUCT MANAGEMENT
    const productTableBody = document.getElementById('admin-product-list');
    const productForm = document.getElementById('product-form');
    const productModal = document.getElementById('product-modal');

    const renderAdminProducts = async () => {
        const productTableBody = document.getElementById('admin-product-list');
        productTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

        const products = window.getProducts ? await window.getProducts() : [];
        if (products.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No products found.</td></tr>';
            return;
        }

        productTableBody.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.image}" alt="" class="p-thumb"></td>
                <td class="p-title-cell">
                    <div>${p.title}</div>
                    <small>${p.titleEn}</small>
                </td>
                <td>฿${p.price.toLocaleString()}</td>
                <td>
                    <span style="color: ${(p.stock || 0) < 10 ? '#ff4444' : '#4CAF50'}; font-weight: bold;">
                        ${p.stock || 0} ชิ้น
                    </span>
                    <button class="btn-icon" onclick="adjustStock('${p.id}')" title="ปรับสต็อก" style="margin-left:5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn-icon edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    window.adjustStock = async (productId) => {
        const products = await window.getProducts();
        const product = products.find(p => p.id === productId);

        if (!product) return;

        const newStock = prompt(`ปรับสต็อกสำหรับ: ${product.title}\n\nจำนวนปัจจุบัน: ${product.stock || 0} ชิ้น\n\nกรอกจำนวนใหม่:`, product.stock || 0);

        if (newStock === null) return; // Cancelled

        const stockValue = parseInt(newStock);
        if (isNaN(stockValue) || stockValue < 0) {
            alert('กรุณากรอกจำนวนที่ถูกต้อง (ตัวเลขที่มากกว่าหรือเท่ากับ 0)');
            return;
        }

        try {
            await window.db.collection('products').doc(productId).update({
                stock: stockValue
            });
            alert(`อัปเดตสต็อกเรียบร้อย!\n${product.title}: ${stockValue} ชิ้น`);
            renderAdminProducts();
        } catch (e) {
            console.error(e);
            alert('Error updating stock: ' + e.message);
        }
    };

    window.openProductModal = async (id = null) => {
        productModal.style.display = 'flex';
        productForm.reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('modal-title').textContent = 'เพิ่มสินค้าใหม่';

        if (id) {
            const products = await window.getProducts();
            const p = products.find(x => x.id === id);
            if (p) {
                document.getElementById('edit-id').value = p.id;
                document.getElementById('p-title').value = p.title;
                document.getElementById('p-title-en').value = p.titleEn;
                document.getElementById('p-desc').value = p.desc;
                document.getElementById('p-desc-en').value = p.descEn;
                document.getElementById('p-price').value = p.price;
                document.getElementById('p-stock').value = p.stock || 100;
                document.getElementById('p-image').value = p.image;
                document.getElementById('modal-title').textContent = 'แก้ไขสินค้า';
            }
        }
    };

    window.closeProductModal = () => {
        productModal.style.display = 'none';
    };

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // If edit-id is empty, it's new. Use null to let Firestore generate (or we generate)
        // Actually for edit we need ID.
        let id = document.getElementById('edit-id').value;

        const productData = {
            title: document.getElementById('p-title').value,
            titleEn: document.getElementById('p-title-en').value,
            desc: document.getElementById('p-desc').value,
            descEn: document.getElementById('p-desc-en').value,
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value) || 100,
            image: document.getElementById('p-image').value
        };

        try {
            if (id) {
                // UPDATE
                await window.db.collection('products').doc(id).update(productData);
            } else {
                // CREATE new
                await window.db.collection('products').add({
                    ...productData,
                    createdAt: new Date().toISOString()
                });
            }
            // window.saveProducts not needed as we write to DB
            renderAdminProducts();
            closeProductModal();
            alert('บันทึกข้อมูลเรียบร้อย / Product saved!');
        } catch (error) {
            console.error(error);
            alert('Error saving product: ' + error.message);
        }
    });

    window.editProduct = (id) => openProductModal(id);

    window.deleteProduct = async (id) => {
        // RBAC Check
        const currentUser = JSON.parse(sessionStorage.getItem('currentAdminUser'));
        if (currentUser && currentUser.role === 'staff') {
            alert('ขออภัย! พนักงานระดับ Staff ไม่ได้รับอนุญาตให้ลบข้อมูลสินค้า\n\nPermission Denied: Staff cannot delete products.');
            return;
        }

        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? / Are you sure you want to delete this product?')) {
            try {
                await window.db.collection('products').doc(id).delete();
                renderAdminProducts();
            } catch (e) {
                alert('Error deleting: ' + e.message);
            }
        }
    };

    // ORDER MANAGEMENT
    const orderListContainer = document.getElementById('admin-order-list');
    const shippingListContainer = document.getElementById('admin-shipping-list');
    const historyListContainer = document.getElementById('admin-history-list');

    window.viewSlip = (url) => {
        const win = window.open();
        if (win) {
            win.document.write(`
                <html>
                <body style="margin:0; background:#121212; display:flex; justify-content:center; align-items:center; min-height:100vh;">
                    <img src="${url}" style="max-width:90%; max-height:90vh; border-radius:10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="position:fixed; top:20px; left:20px; color:white; font-family:sans-serif; background:rgba(0,0,0,0.5); padding:10px 20px; border-radius:20px;">
                        รายละเอียดสลิปโอนเงิน / Payment Slip Details
                    </div>
                </body>
                </html>
            `);
            win.document.title = "View Payment Slip - Phrae OTOP Admin";
        }
    };

    // REAL-TIME FIRESTORE LISTENER FOR ORDERS
    let displayedOrders = []; // cache

    // Subscribe to orders
    const subscribeOrders = () => {
        if (!window.db) return;
        window.db.collection('orders').orderBy('date', 'desc').onSnapshot((snapshot) => {
            const orders = [];
            snapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            displayedOrders = orders;

            // Re-render current tab
            const activeTab = document.querySelector('.sidebar-nav a.active')?.getAttribute('data-tab');
            if (activeTab === 'orders') renderAdminOrders();
            if (activeTab === 'shipping') renderShippingOrders();
            if (activeTab === 'history') renderHistoryOrders();

            // Check for new orders logic (Sound)
            // Simplifying: just ring on snapshot changes if purely new addition? 
            // For now let's reuse checkNewOrders logic slightly modified if needed or rely on snapshot
        });
    };
    subscribeOrders();

    window.updateOrderStatus = async (orderId, nextStatus) => {
        // Prompt logic same as before
        let trackingNum = null;
        if (nextStatus === 'shipping') {
            trackingNum = prompt("กรุณากรอกเลขพัสดุ (Tracking Number):", "");
            if (trackingNum === null) return;
        }

        try {
            const updateData = { status: nextStatus };
            if (trackingNum) updateData.trackingNumber = trackingNum;

            await window.db.collection('orders').doc(orderId).update(updateData);
            // Snapshot will auto update UI
        } catch (e) {
            alert('Error updating status: ' + e.message);
        }
    };

    const renderAdminOrders = (highlightFirst = false) => {
        const pendingOrders = displayedOrders.filter(o => !o.status || o.status === 'pending');

        if (pendingOrders.length === 0) {
            orderListContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">ไม่มีรายการสั่งซื้อใหม่... / No new orders...</p>';
            return;
        }

        orderListContainer.innerHTML = pendingOrders.map((o, index) => `
            <div class="order-card ${highlightFirst && index === 0 ? 'new-order' : ''}">
                <div class="order-header">
                    <div class="order-id-box">
                        <span class="order-id">#${o.id.substring(0, 8)}...</span>
                        <span class="order-date">${o.displayDate || o.date}</span>
                    </div>
                    <div class="order-customer-info">
                        <i class="fas fa-user"></i> <strong>${o.customer ? o.customer.name : 'N/A'}</strong>
                        <br>
                        <i class="fas fa-phone"></i> ${o.customer ? o.customer.phone : 'N/A'}
                        <br>
                        <i class="fas fa-map-marker-alt"></i> ${o.customer ? o.customer.address : 'N/A'}
                        ${o.slip ? `
                            <div class="order-slip-preview">
                                <span class="slip-label"><i class="fas fa-receipt"></i> สลิปโอนเงิน:</span>
                                <img src="${o.slip}" alt="Slip" onclick="viewSlip('${o.slip}')">
                                <a href="javascript:void(0)" class="btn-view-slip" onclick="viewSlip('${o.slip}')">
                                    <i class="fas fa-search-plus"></i> ดูสลิปขนาดใหญ่
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="order-body">
                    ${o.items.map(item => `
                        <div class="order-item">
                            <span>${item.title} x ${item.quantity}</span>
                            <span>฿${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">
                        ยอดรวม: ฿${o.total.toLocaleString()}
                    </div>
                    <button class="btn-status pack" onclick="updateOrderStatus('${o.id}', 'shipping')">
                        <i class="fas fa-check"></i> แพ็คของเสร็จสิ้น
                    </button>
                    <!-- Small delete button for cleanup -->
                    <button class="btn-icon delete" style="margin-left:auto; background:none; color:#f44336;" onclick="deleteOrder('${o.id}')" title="ลบคำสั่งซื้อ (Delete Order)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    };

    // Helper to delete junk orders
    window.deleteOrder = async (id) => {
        if (confirm('Delete this order?')) {
            await window.db.collection('orders').doc(id).delete();
        }
    }

    const renderShippingOrders = () => {
        const shippingOrders = displayedOrders.filter(o => o.status === 'shipping');

        if (shippingOrders.length === 0) {
            shippingListContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">ไม่มีรายการกำลังจัดส่ง... / No shipping orders...</p>';
            return;
        }

        shippingListContainer.innerHTML = shippingOrders.map(o => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id-box">
                       <span class="order-id">#${o.id.substring(0, 8)}...</span>
                        <span class="order-date">${o.displayDate || o.date}</span>
                    </div>
                    <div class="order-customer-info">
                         <i class="fas fa-user"></i> <strong>${o.customer ? o.customer.name : 'N/A'}</strong>
                        <br>
                        <i class="fas fa-phone"></i> ${o.customer ? o.customer.phone : 'N/A'}
                        <br>
                        <i class="fas fa-map-marker-alt"></i> ${o.customer ? o.customer.address : 'N/A'}
                        ${o.slip ? `
                            <div class="order-slip-preview">
                                <span class="slip-label"><i class="fas fa-receipt"></i> สลิปโอนเงิน:</span>
                                <img src="${o.slip}" alt="Slip" onclick="viewSlip('${o.slip}')">
                                <a href="javascript:void(0)" class="btn-view-slip" onclick="viewSlip('${o.slip}')">
                                    <i class="fas fa-search-plus"></i> ดูสลิปขนาดใหญ่
                                </a>
                            </div>
                        ` : ''}
                        ${o.trackingNumber ? `
                            <div style="margin-top:10px; padding:8px; background:rgba(39, 174, 96, 0.1); border-radius:6px; border:1px dashed #27ae60;">
                                <i class="fas fa-truck" style="color:#27ae60;"></i> 
                                <strong style="color:#27ae60; font-size:1rem;">${o.trackingNumber}</strong>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="order-body">
                    ${o.items.map(item => `
                        <div class="order-item">
                            <span>${item.title} x ${item.quantity}</span>
                            <span>฿${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">
                        ยอดรวม: ฿${o.total.toLocaleString()}
                    </div>
                    <button class="btn-status deliver" onclick="updateOrderStatus('${o.id}', 'delivered')">
                        <i class="fas fa-truck"></i> จัดส่งเรียบร้อยแล้ว
                    </button>
                </div>
            </div>
        `).join('');
    };

    const renderHistoryOrders = () => {
        const historyOrders = displayedOrders.filter(o => o.status === 'delivered');

        // Calculate statistics
        const totalCustomers = historyOrders.length;
        const totalItems = historyOrders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
        const totalRevenue = historyOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        // Update statistics display
        const totalCustomersEl = document.getElementById('total-customers');
        const totalItemsEl = document.getElementById('total-items');
        const totalRevenueEl = document.getElementById('total-revenue');
        if (totalCustomersEl) totalCustomersEl.textContent = totalCustomers.toLocaleString();
        if (totalItemsEl) totalItemsEl.textContent = totalItems.toLocaleString();
        if (totalRevenueEl) totalRevenueEl.textContent = '฿' + totalRevenue.toLocaleString();

        if (historyOrders.length === 0) {
            historyListContainer.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">ยังไม่มีประวัติการสั่งซื้อที่สำเร็จ... / No completed orders yet...</p>';
            return;
        }

        historyListContainer.innerHTML = historyOrders.map(o => `
            <div class="order-card" style="opacity: 0.8; border-color: #27ae60;">
                <div class="order-header">
                    <div class="order-id-box">
                        <span class="order-id" style="color: #27ae60;">#${o.id.substring(0, 8)}... [เสร็จสิ้น]</span>
                        <span class="order-date">${o.displayDate || o.date}</span>
                    </div>
                    <div class="order-customer-info" style="text-align: right;">
                         <i class="fas fa-user"></i> <strong>${o.customer ? o.customer.name : 'N/A'}</strong>
                        <br>
                        <i class="fas fa-phone"></i> ${o.customer ? o.customer.phone : 'N/A'}
                        <br>
                        <i class="fas fa-map-marker-alt"></i> ${o.customer ? o.customer.address : 'N/A'}
                        ${o.trackingNumber ? `
                            <div style="margin-top:10px; padding:8px; background:rgba(39, 174, 96, 0.1); border-radius:6px; border:1px dashed #27ae60;">
                                <i class="fas fa-truck" style="color:#27ae60;"></i> 
                                <strong style="color:#27ae60; font-size:1rem;">${o.trackingNumber}</strong>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="order-body">
                    ${o.items.map(item => `
                        <div class="order-item">
                            <span>${item.title} x ${item.quantity}</span>
                            <span>฿${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total" style="color: #27ae60;">
                        ยอดรวมสุทธิ: ฿${o.total.toLocaleString()}
                    </div>
                    <span style="color: #27ae60; font-size: 0.9rem; font-weight: 600;"><i class="fas fa-check-double"></i> จัดส่งสำเร็จ</span>
                </div>
            </div>
        `).join('');
    };

    // Initial Load
    renderAdminProducts();
    renderAdminOrders();
    renderShippingOrders();
    renderHistoryOrders();

    // SOUND NOTIFICATION LOGIC (Handled at top of file)
    let lastOrderCount = (JSON.parse(localStorage.getItem('otop_orders')) || []).length;


    const checkNewOrders = () => {
        const currentOrders = JSON.parse(localStorage.getItem('otop_orders')) || [];
        if (currentOrders.length > lastOrderCount) {
            // New order detected!
            if (isSoundOn && audioEl) {
                audioEl.play().catch(e => console.log('Audio play failed:', e));
            }

            // Refresh the active tab if it's orders or shipping
            const activeTab = document.querySelector('.sidebar-nav a.active').getAttribute('data-tab');
            if (activeTab === 'orders') {
                renderAdminOrders(true);
            } else if (activeTab === 'shipping') {
                renderShippingOrders();
            } else if (activeTab === 'history') {
                renderHistoryOrders();
            }

            lastOrderCount = currentOrders.length;
        } else if (currentOrders.length < lastOrderCount) {
            lastOrderCount = currentOrders.length;
        }
    };

    // PASSWORD CHANGE FUNCTIONALITY
    const savePasswordBtn = document.getElementById('save-password-btn');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', () => {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Validation
            if (!newPassword || !confirmPassword) {
                alert('กรุณากรอกรหัสผ่านให้ครบถ้วน');
                return;
            }

            if (newPassword.length < 4) {
                alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('รหัสผ่านไม่ตรงกัน กรุณาลองใหม่อีกครั้ง');
                return;
            }

            // Save new password
            localStorage.setItem('admin_password', newPassword);
            alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');

            // Clear inputs
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        });
    }

    // ================= CHAT LOGIC =================
    const adminChatInput = document.getElementById('adminChatInput');
    const adminSendBtn = document.getElementById('adminSendBtn');
    const adminChatMessages = document.getElementById('adminChatMessages');
    const msgBadge = document.getElementById('msg-badge');

    // Image Upload Elements
    const adminImageBtn = document.getElementById('adminImageBtn');
    const adminImageInput = document.getElementById('adminImageInput');

    let lastChatCount = 0;

    // Add event listener to send button
    if (adminSendBtn) {
        adminSendBtn.addEventListener('click', () => sendAdminMessage(null)); // Send text
        if (adminChatInput) {
            adminChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendAdminMessage(null);
            });
        }
    }

    // Image Upload Logic
    if (adminImageBtn && adminImageInput) {
        adminImageBtn.addEventListener('click', () => adminImageInput.click());

        adminImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 500000) {
                alert('รูปภาพมีขนาดใหญ่เกินไป (จำกัด 500KB)');
                adminImageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const base64String = event.target.result;
                sendAdminMessage(base64String); // Send image
                adminImageInput.value = '';
            };
            reader.readAsDataURL(file);
        });
    }

    // State for Admin Chat
    let activeChatUserId = null;

    function sendAdminMessage(image = null) {
        if (!activeChatUserId) {
            alert('กรุณาเลือกผูู้ติดต่อก่อน / Please select a user to chat with.');
            return;
        }

        const text = adminChatInput ? adminChatInput.value.trim() : '';
        // Return if nothing to send
        if (!text && !image) return;

        let messages = JSON.parse(localStorage.getItem('phrae_otop_chat')) || [];
        const newMessage = {
            id: Date.now(),
            text: text,
            image: image,
            sender: 'admin',
            recipientId: activeChatUserId, // Admin messages MUST have a recipient
            timestamp: new Date().toISOString(),
            isRead: false
        };

        messages.push(newMessage);
        localStorage.setItem('phrae_otop_chat', JSON.stringify(messages));

        if (adminChatInput) adminChatInput.value = '';
        renderAdminChat(); // Re-render to show new message
    }

    function renderAdminChat() {
        if (!adminChatMessages) return;

        const messages = JSON.parse(localStorage.getItem('phrae_otop_chat')) || [];
        const chatUserList = document.getElementById('chatUserList');
        const chatHeader = document.getElementById('chatHeaderUser');
        const activeUserName = document.getElementById('activeUserName');
        const inputArea = document.getElementById('adminChatInputArea');

        // 1. Group messages by Users
        const usersMap = {};
        messages.forEach(msg => {
            // Identify conversation partner
            let uid, uname;
            if (msg.sender === 'user') {
                uid = msg.userId;
                uname = msg.username;
            } else if (msg.sender === 'admin') {
                uid = msg.recipientId;
                // We might not know username if only admin msgs exist, but usually it starts with user msg
                uname = 'Unknown'; // Fallback
            }

            // Fallback for Legacy Messages (Old customers before update)
            if (!uid) {
                uid = 'legacy_user';
                uname = 'Guest (Legacy)';
            }

            if (uid) {
                if (!usersMap[uid]) {
                    usersMap[uid] = {
                        id: uid,
                        name: uname || 'Guest',
                        lastMsg: '',
                        lastTime: '',
                        unread: 0
                    };
                }
                // Update latest info
                if (uname && uname !== 'Unknown' && uname !== 'Guest (Legacy)') usersMap[uid].name = uname;
                usersMap[uid].lastMsg = msg.image ? '[รูปภาพ]' : msg.text;
                usersMap[uid].lastTime = msg.timestamp;

                if (msg.sender === 'user' && !msg.isRead) {
                    usersMap[uid].unread++;
                }
            }
        });

        // 2. Render User List
        chatUserList.innerHTML = '';
        const sortedUsers = Object.values(usersMap).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

        if (sortedUsers.length === 0) {
            chatUserList.innerHTML = '<div style="padding:20px; color:#666; text-align:center;">ยังไม่มีข้อความ</div>';
        }

        sortedUsers.forEach(u => {
            const item = document.createElement('div');
            item.className = 'chat-user-item';
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            item.style.cursor = 'pointer';
            item.style.transition = '0.2s';
            if (activeChatUserId === u.id) item.style.background = 'rgba(255,215,0,0.1)';

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <div style="font-weight:bold; color:#fff;">${u.name}</div>
                    ${u.unread > 0 ? `<div style="background:red; color:white; font-size:10px; padding:2px 6px; border-radius:10px;">${u.unread}</div>` : ''}
                </div>
                <div style="font-size:0.8rem; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${u.lastMsg}</div>
                <div style="font-size:0.7rem; color:#555; text-align:right; margin-top:5px;">${new Date(u.lastTime).toLocaleString('th-TH')}</div>
            `;

            item.addEventListener('click', () => {
                activeChatUserId = u.id;
                renderAdminChat(); // Re-render full view
            });

            // Hover effect
            item.onmouseover = () => { if (activeChatUserId !== u.id) item.style.background = 'rgba(255,255,255,0.05)'; };
            item.onmouseout = () => { if (activeChatUserId !== u.id) item.style.background = 'transparent'; };

            chatUserList.appendChild(item);
        });

        // 3. Render Active Conversation
        if (activeChatUserId) {
            // Unhide Input Area
            inputArea.style.display = 'flex';
            chatHeader.style.display = 'block';
            activeUserName.textContent = usersMap[activeChatUserId]?.name || 'Chat';

            // Filter Conversation
            const conversation = messages.filter(m =>
                (m.sender === 'user' && m.userId === activeChatUserId) ||
                (m.sender === 'admin' && m.recipientId === activeChatUserId)
            );

            adminChatMessages.innerHTML = '';

            // Mark as read (only user messages)
            let hasReadUpdate = false;
            conversation.forEach(msg => {
                if (msg.sender === 'user' && !msg.isRead) {
                    msg.isRead = true;
                    // Find original object in main array to update storage
                    const original = messages.find(m => m.id === msg.id);
                    if (original) original.isRead = true;
                    hasReadUpdate = true;
                }
            });

            if (hasReadUpdate) {
                localStorage.setItem('phrae_otop_chat', JSON.stringify(messages));
                // Recalculate badge logic if needed (handled by badge rendering below)
            }

            conversation.forEach(msg => {
                const div = document.createElement('div');
                div.className = `message ${msg.sender}`; // .message.user (left) or .message.admin (right)

                if (msg.image) {
                    const img = document.createElement('img');
                    // ... image render logic same as before ...
                    img.src = msg.image;
                    img.style.maxWidth = '200px';
                    img.style.borderRadius = '10px';
                    div.appendChild(img);
                } else {
                    div.textContent = msg.text;
                }
                adminChatMessages.appendChild(div);
            });

            // Scroll to bottom
            adminChatMessages.scrollTop = adminChatMessages.scrollHeight;

        } else {
            // No user selected
            inputArea.style.display = 'none';
            chatHeader.style.display = 'none';
            adminChatMessages.innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:#666; flex-direction:column;"><i class="fas fa-comments" style="font-size:3rem; margin-bottom:20px;"></i><p>เลือกแชทจากรายการทางซ้ายมือ</p></div>';
        }

        // Global Badge Update
        // Global Badge Update
        // Count unique users who have sent unread messages
        const unreadUserIds = new Set(
            messages.filter(m => m.sender === 'user' && !m.isRead).map(m => m.userId)
        );
        const totalUnreadPeople = unreadUserIds.size;

        if (msgBadge) {
            msgBadge.style.display = totalUnreadPeople > 0 ? 'inline-block' : 'none';
            msgBadge.textContent = totalUnreadPeople > 99 ? '99+' : totalUnreadPeople;

            // Optional: visual pulse if new
            if (totalUnreadPeople > 0) {
                msgBadge.style.animation = 'pulse-red 2s infinite';
            } else {
                msgBadge.style.animation = 'none';
            }
        }

        // Play Sound if new messages arrived
        // We calculate total unread messages across all users
        const totalUnreadCount = sortedUsers.reduce((sum, u) => sum + u.unread, 0);

        if (totalUnreadCount > lastUnreadMsgCount) {
            if (isSoundOn && audioEl) {
                audioEl.currentTime = 0;
                audioEl.play().catch(e => console.warn('Notification sound blocked:', e));
            }
        }

        // Update tracker (prevent sound loop)
        lastUnreadMsgCount = totalUnreadCount;
    }


    // Polling interval
    setInterval(() => {
        checkNewOrders();
        renderAdminChat();
    }, 2000);

    // Initial load
    lastOrderCount = (JSON.parse(localStorage.getItem('otop_orders')) || []).length;

    // Check initial tab
    const initialTab = document.querySelector('.sidebar-nav a.active');
    if (initialTab) {
        const tabName = initialTab.getAttribute('data-tab');
        if (tabName === 'messages') {
            renderAdminChat();
        } else if (tabName === 'orders') {
            renderAdminOrders();
        } else if (tabName === 'shipping') {
            renderShippingOrders();
        } else if (tabName === 'history') {
            renderHistoryOrders();
        } else if (tabName === 'settings') {
            renderAdminManagementList();
            // Display current username
            const usernameDisplay = document.getElementById('current-admin-username');
            if (usernameDisplay && currentUser) {
                usernameDisplay.textContent = `${currentUser.username} (${currentUser.name})`;
            }
        }
    }

    // ==========================================
    // PERSONAL PASSWORD CHANGE (Settings Tab)
    // ==========================================
    window.changeMyPassword = () => {
        const currentPassword = document.getElementById('current-password').value.trim();
        const newPassword = document.getElementById('new-password-self').value.trim();

        if (!currentPassword || !newPassword) {
            alert('กรุณากรอกรหัสผ่านให้ครบถ้วน');
            return;
        }

        // Verify current password
        if (currentPassword !== currentUser.password) {
            alert('รหัสผ่านปัจจุบันไม่ถูกต้อง!');
            return;
        }

        // Update in localStorage
        const admins = JSON.parse(localStorage.getItem('phrae_otop_admins')) || [];
        const index = admins.findIndex(a => a.username === currentUser.username);

        if (index === -1) {
            alert('ไม่พบข้อมูลผู้ใช้งาน');
            return;
        }

        admins[index].password = newPassword;
        localStorage.setItem('phrae_otop_admins', JSON.stringify(admins));

        // Update session
        currentUser.password = newPassword;
        sessionStorage.setItem('currentAdminUser', JSON.stringify(currentUser));

        alert('เปลี่ยนรหัสผ่านสำเร็จ!');

        // Clear inputs
        document.getElementById('current-password').value = '';
        document.getElementById('new-password-self').value = '';
    };

    // ==========================================
    // ADMIN MANAGEMENT LOGIC (Settings Tab)
    // ==========================================
    window.renderAdminManagementList = () => {
        const list = document.getElementById('admin-management-list');
        if (!list) return;

        const admins = JSON.parse(localStorage.getItem('phrae_otop_admins')) || [];
        list.innerHTML = admins.map((a, index) => `
            <tr>
                <td>${a.name}</td>
                <td>${a.username}</td>
                <td>
                    <span style="background:${a.role === 'admin' ? 'var(--primary-color)' : '#aaa'}; color:#000; padding:2px 8px; border-radius:10px; font-size:0.8rem; font-weight:bold;">
                        ${a.role.toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn-icon edit" onclick="editAdminPassword(${index})" title="แก้ไขรหัสผ่าน">
                        <i class="fas fa-key"></i>
                    </button>
                    ${a.username === 'admin' ? '<small style="margin-left:5px;">Main</small>' : `<button class="btn-icon delete" onclick="deleteAdminUser(${index})"><i class="fas fa-trash"></i></button>`}
                </td>
            </tr>
        `).join('');
    };

    window.editAdminPassword = (index) => {
        const admins = JSON.parse(localStorage.getItem('phrae_otop_admins')) || [];
        const admin = admins[index];

        if (!admin) return;

        const newPassword = prompt(`แก้ไขรหัสผ่านสำหรับ: ${admin.username} (${admin.name})\n\nกรอกรหัสผ่านใหม่:`, admin.password);

        if (newPassword === null) return; // Cancelled

        if (!newPassword.trim()) {
            alert('รหัสผ่านต้องไม่เป็นค่าว่าง');
            return;
        }

        admins[index].password = newPassword.trim();
        localStorage.setItem('phrae_otop_admins', JSON.stringify(admins));

        // Update session if editing current user
        const currentUser = JSON.parse(sessionStorage.getItem('currentAdminUser'));
        if (currentUser && currentUser.username === admin.username) {
            currentUser.password = newPassword.trim();
            sessionStorage.setItem('currentAdminUser', JSON.stringify(currentUser));
        }

        alert('แก้ไขรหัสผ่านเรียบร้อยแล้ว!');
        renderAdminManagementList();
    };

    window.saveAdminUser = () => {
        const uname = document.getElementById('new-admin-user').value.trim();
        const upass = document.getElementById('new-admin-pass').value.trim();
        const unameDisplay = document.getElementById('new-admin-name').value.trim();
        const urole = document.getElementById('new-admin-role').value;

        if (!uname || !upass || !unameDisplay) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const admins = JSON.parse(localStorage.getItem('phrae_otop_admins')) || [];

        // Check duplicate
        if (admins.find(a => a.username === uname)) {
            alert('Username นี้มีอยู่ในระบบแล้ว');
            return;
        }

        admins.push({
            username: uname,
            password: upass,
            name: unameDisplay,
            role: urole
        });

        localStorage.setItem('phrae_otop_admins', JSON.stringify(admins));
        alert('บันทึกผู้ใช้งานเรียบร้อย');

        // Clear Inputs
        document.getElementById('new-admin-user').value = '';
        document.getElementById('new-admin-pass').value = '';
        document.getElementById('new-admin-name').value = '';

        renderAdminManagementList();
    };

    window.deleteAdminUser = (index) => {
        // RBAC Check
        const currentUser = JSON.parse(sessionStorage.getItem('currentAdminUser'));
        if (currentUser && currentUser.role === 'staff') {
            alert('ขออภัย! พนักงานระดับ Staff ไม่ได้รับอนุญาตให้ลบผู้ดูแลระบบ\n\nPermission Denied: Staff cannot delete admins.');
            return;
        }

        if (!confirm('ต้องการลบผู้ใช้งานนี้ใช่หรือไม่?')) return;

        const admins = JSON.parse(localStorage.getItem('phrae_otop_admins')) || [];
        admins.splice(index, 1);
        localStorage.setItem('phrae_otop_admins', JSON.stringify(admins));
        renderAdminManagementList();
    };

    // ==========================================
    // BACKUP & RESTORE SYSTEM
    // ==========================================
    window.exportBackupData = () => {
        const data = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            orders: JSON.parse(localStorage.getItem('otop_orders')),
            products: JSON.parse(localStorage.getItem('otop_products')),
            users: JSON.parse(localStorage.getItem('phrae_otop_users')),
            admins: JSON.parse(localStorage.getItem('phrae_otop_admins')),
            chat: localStorage.getItem('otop_chat_sessions') // Chat history
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "otop_backup_" + new Date().toISOString().slice(0, 10) + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    window.importBackupData = (input) => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (confirm('คำเตือน: การกู้คืนข้อมูลจะทับข้อมูลปัจจุบันทั้งหมด\nต้องการดำเนินการต่อหรือไม่?')) {
                    if (data.orders) localStorage.setItem('otop_orders', JSON.stringify(data.orders));
                    if (data.products) localStorage.setItem('otop_products', JSON.stringify(data.products));
                    if (data.users) localStorage.setItem('phrae_otop_users', JSON.stringify(data.users));
                    if (data.admins) localStorage.setItem('phrae_otop_admins', JSON.stringify(data.admins));
                    if (data.chat) localStorage.setItem('otop_chat_sessions', data.chat);

                    alert('กู้คืนข้อมูลสำเร็จ! ระบบจะรีเฟรชหน้าจอ');
                    location.reload();
                }
            } catch (err) {
                alert('ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการอ่านไฟล์');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };
});
