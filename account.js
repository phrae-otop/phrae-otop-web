/**
 * account.js - Handles User Account & Order History
 */

document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');

    // Auth is global from auth.js
    const currentUser = Auth.getCurrentUser();

    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }

    const renderOrders = async () => {
        if (!ordersList) return;
        ordersList.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;"><i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล... / Loading...</div>';

        let userOrders = [];

        console.log('🔍 [Order History Debug] Starting order fetch...');
        console.log('👤 Current User ID:', currentUser.id);

        try {
            // 1. Try fetching from Firestore with a small retry loop for window.db
            let db = window.db;
            if (!db) {
                // Wait up to 2 seconds for DB
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 100));
                    if (window.db) {
                        db = window.db;
                        break;
                    }
                }
            }

            if (db) {
                console.log('📡 Fetching from Firestore...');
                // We'll skip orderBy because it requires a composite index for where + orderBy
                // We'll sort on client side instead to be safer for small order lists
                const snapshot = await db.collection('orders')
                    .where('userId', '==', currentUser.id)
                    .get();

                console.log('Box Firestore snapshot size:', snapshot.size);

                if (!snapshot.empty) {
                    userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Sort by date (descending)
                    userOrders.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                    console.log('✅ Orders fetched from Firestore:', userOrders.length);
                } else {
                    console.log('⚠️ Firestore returned empty - no orders found for this user');
                }
            } else {
                // Fallback to LocalStorage
                console.log('💾 Firestore not available, using LocalStorage...');
                const allOrders = JSON.parse(localStorage.getItem('otop_orders')) || [];
                userOrders = allOrders.filter(order => order.userId === currentUser.id);
                userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        } catch (error) {
            console.error("❌ Error fetching orders:", error);
            // Fallback to LocalStorage on any error
            const allOrders = JSON.parse(localStorage.getItem('otop_orders')) || [];
            userOrders = allOrders.filter(order => order.userId === currentUser.id);
            userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        if (userOrders.length === 0) {
            ordersList.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p>ไม่พบรายการสั่งซื้อของคุณ / No order history found.</p>
                    <a href="index.html#products" class="btn-primary" style="margin-top: 15px; display: inline-block;">เลือกซื้อสินค้า / Shop Now</a>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = userOrders.map(order => `
            <div class="order-card" style="display: block; margin-bottom: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 15px;">
                <div class="order-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div>
                        <h3 style="color: var(--primary-color); margin-bottom: 5px;">คำสั่งซื้อ #${order.id.slice(0, 8)}...</h3>
                        <span class="order-date" style="color: #888; font-size: 0.9rem;">${order.displayDate || order.date}</span>
                    </div>
                    <div class="order-status ${order.status}" style="padding: 6px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background: rgba(255,255,255,0.05);">
                        ${getStatusText(order.status)}
                    </div>
                </div>
                <div class="order-items" style="margin-bottom: 20px;">
                    ${order.items.map(item => `
                        <div class="order-item" style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #ccc;">
                            <span>${(item.title || item.titleEn) || 'Item'} x ${item.quantity}</span>
                            <span>฿${((item.price || 0) * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer" style="padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #888;">ยอดรวมสุทธิ / Total</span>
                    <span style="color: var(--primary-color); font-size: 1.2rem; font-weight: bold;">฿${(order.total || 0).toLocaleString()}</span>
                </div>
                ${order.trackingNumber ? `
                    <div style="margin-top:20px; padding:15px; background:rgba(230, 33, 41, 0.05); border:1px solid rgba(230, 33, 41, 0.1); border-radius:10px; text-align:right;">
                        <div style="font-size:0.9rem; margin-bottom:12px; color:#aaa;">
                            เลขพัสดุ (Flash Express): <strong style="color:#fff; font-size:1.1rem;">${order.trackingNumber}</strong>
                        </div>
                        <a href="https://www.flashexpress.co.th/tracking/?se=${order.trackingNumber}" target="_blank" class="btn-primary" style="padding: 8px 15px; font-size:0.85rem; display: inline-flex; align-items: center; gap: 8px; text-decoration: none;">
                            <i class="fas fa-bolt"></i> เช็คสถานะ Flash Express
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'กำลังตรวจสอบ / Pending';
            case 'paid': return 'ชำระเงินแล้ว / Paid';
            case 'shipping': return 'กำลังรอจัดส่ง / Packing';
            case 'shipped': return 'จัดส่งแล้ว / Shipped';
            case 'completed': return 'สำเร็จ / Completed';
            case 'cancelled': return 'ยกเลิก / Cancelled';
            default: return status || 'Pending';
        }
    };

    // Initial render
    renderOrders();

    // Re-render when Orders tab is clicked
    const ordersTabBtn = document.querySelector('.account-menu a[data-section="orders"]');
    if (ordersTabBtn) {
        ordersTabBtn.onclick = () => {
            renderOrders();
        };
    }

    // PASSWORD CHANGE LOGIC
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        // Display user info
        document.getElementById('profile-name').textContent = currentUser.username;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('edit-username').value = currentUser.username;
        document.getElementById('edit-email').value = currentUser.email;

        // Display store discount if applicable
        const fetchDiscount = async () => {
             try {
                let db = window.db;
                if (!db) {
                    for (let i = 0; i < 20; i++) {
                        await new Promise(r => setTimeout(r, 100));
                        if (window.db) { db = window.db; break; }
                    }
                }
                
                if (db) {
                    const userDoc = await db.collection('users').doc(currentUser.id).get();
                    if (userDoc.exists) {
                        const fullUserData = userDoc.data();
                        if (fullUserData && fullUserData.discount && fullUserData.discount > 0) {
                            const discountSection = document.getElementById('discount-display-section');
                            const discountPercentage = document.getElementById('discount-percentage');
                            if (discountSection && discountPercentage) {
                                discountSection.style.display = 'block';
                                discountPercentage.textContent = `${fullUserData.discount}%`;
                            }
                        }
                    }
                }
             } catch (error) { console.error("Error fetching user discount:", error); }
        };
        fetchDiscount();

        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPass = document.getElementById('current-password').value;
            const newPass = document.getElementById('new-user-password').value;
            const confirmPass = document.getElementById('confirm-user-password').value;
            
            if (typeof window.db === 'undefined') {
                 alert('ระบบฐานข้อมูลขัดข้อง / Database connection error');
                 return;
            }

            try {
                // 1. Verify Current Password by fetching user from Firestore
                const userDoc = await window.db.collection('users').doc(currentUser.id).get();
                
                if (!userDoc.exists) {
                    alert('ไม่พบข้อมูลผู้ใช้ / User not found');
                    return;
                }

                const storedUser = userDoc.data();

                if (storedUser.password !== currentPass) {
                    alert('รหัสผ่านปัจจุบันไม่ถูกต้อง / Incorrect current password');
                    return;
                }

                // 2. Verify New Password
                if (newPass.length < 4) {
                    alert('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร');
                    return;
                }

                if (newPass !== confirmPass) {
                    alert('รหัสผ่านใหม่ไม่ตรงกัน / Passwords do not match');
                    return;
                }

                // 3. Save New Password to Firestore
                await window.db.collection('users').doc(currentUser.id).update({
                    password: newPass
                });

                alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว / Password changed successfully');
                passwordForm.reset();
            } catch (error) {
                console.error("Change Password Error:", error);
                alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน / Failed to change password');
            }
        });
    }
});
